import type { Node } from 'acorn';
import type { Step, StepType, RuntimeValue, StackFrame, QueuedTask } from '../types/simulation';
import { RuntimeEnvironment, Scope, uid, resetUid } from './runtime';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ASTNode = Node & { [key: string]: any };

const UNDEFINED_VAL: RuntimeValue = { type: 'undefined', value: undefined };
const NULL_VAL: RuntimeValue = { type: 'null', value: null };

function toRaw(v: RuntimeValue): unknown {
  if (v.type === 'reference' || v.type === 'function') return `[${v.type}]`;
  return v.value;
}

function toPrimitive(val: unknown): RuntimeValue {
  if (val === undefined) return UNDEFINED_VAL;
  if (val === null) return NULL_VAL;
  if (typeof val === 'number') return { type: 'number', value: val };
  if (typeof val === 'string') return { type: 'string', value: val };
  if (typeof val === 'boolean') return { type: 'boolean', value: val };
  return UNDEFINED_VAL;
}

function formatValue(v: RuntimeValue): string {
  if (v.type === 'string') return `"${v.value}"`;
  if (v.type === 'undefined') return 'undefined';
  if (v.type === 'null') return 'null';
  if (v.type === 'function') return `fn ${v.name}`;
  if (v.type === 'reference') return v.label;
  return String(v.value);
}

interface PendingCallback {
  node: ASTNode;
  scope: Scope;
  name: string;
  thisVal: RuntimeValue;
}

export class Interpreter {
  private runtime = new RuntimeEnvironment();
  private steps: Step[] = [];
  private stepId = 0;
  private currentScope: Scope;
  private globalScope: Scope;
  private maxSteps = 2000;
  private pendingTimerCallbacks: Map<string, PendingCallback> = new Map();
  private pendingMicrotaskCallbacks: Map<string, PendingCallback> = new Map();

  constructor() {
    this.globalScope = new Scope('global');
    this.currentScope = this.globalScope;
  }

  run(ast: ASTNode): Step[] {
    resetUid();
    this.steps = [];
    this.stepId = 0;
    this.runtime = new RuntimeEnvironment();
    this.globalScope = new Scope('global');
    this.currentScope = this.globalScope;
    this.pendingTimerCallbacks = new Map();
    this.pendingMicrotaskCallbacks = new Map();

    // Push global execution context
    const globalFrame: StackFrame = {
      id: uid('frame'),
      name: 'Global',
      type: 'global',
      variables: {},
      line: 1,
    };
    this.runtime.callStack.push(globalFrame);
    this.emit('program_start', 'Program execution begins', 1, 'callStack');

    // Hoist function declarations first
    if (ast.type === 'Program' && ast.body) {
      for (const node of ast.body as ASTNode[]) {
        if (node.type === 'FunctionDeclaration' && node.id) {
          this.hoistFunction(node);
        }
      }
    }

    // Execute program body
    try {
      if (ast.type === 'Program' && ast.body) {
        for (const node of ast.body as ASTNode[]) {
          this.execute(node);
          if (this.stepId > this.maxSteps) break;
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== '__RETURN__') {
        this.emit('program_end', `Error: ${msg}`, null, 'output');
      }
    }

    // Simulate event loop (process timers and microtasks)
    this.processEventLoop();

    // Pop global context
    this.runtime.callStack.pop();
    this.emit('program_end', 'Program execution complete', null);

    return this.steps;
  }

  private emit(
    type: StepType,
    description: string,
    line: number | null,
    highlightComponent?: NonNullable<Step['highlight']>['component'],
    highlightItemId?: string,
  ) {
    // Update global frame variables
    const topFrame = this.runtime.callStack.peek();
    if (topFrame) {
      topFrame.variables = this.currentScope.snapshot();
      if (line !== null) topFrame.line = line;
    }

    this.steps.push({
      id: this.stepId++,
      type,
      description,
      line,
      snapshot: this.runtime.snapshot(line),
      highlight: highlightComponent
        ? { component: highlightComponent, itemId: highlightItemId }
        : undefined,
    });
  }

  private getLine(node: ASTNode): number {
    return node.loc?.start?.line ?? 0;
  }

  private hoistFunction(node: ASTNode) {
    const name = node.id.name;
    const heapId = uid('fn');
    this.runtime.heap.alloc({
      id: heapId,
      type: 'function',
      label: `fn ${name}`,
      properties: {},
    });
    const fnVal: RuntimeValue = { type: 'function', name, heapId };
    this.currentScope.define(name, fnVal);
  }

  private execute(node: ASTNode): RuntimeValue {
    if (this.stepId > this.maxSteps) return UNDEFINED_VAL;

    switch (node.type) {
      case 'VariableDeclaration':
        return this.execVariableDeclaration(node);
      case 'FunctionDeclaration':
        return UNDEFINED_VAL; // already hoisted
      case 'ExpressionStatement':
        return this.evaluate(node.expression);
      case 'BlockStatement':
        return this.execBlock(node);
      case 'IfStatement':
        return this.execIf(node);
      case 'ForStatement':
        return this.execFor(node);
      case 'WhileStatement':
        return this.execWhile(node);
      case 'ReturnStatement':
        return this.execReturn(node);
      case 'EmptyStatement':
        return UNDEFINED_VAL;
      default:
        return this.evaluate(node);
    }
  }

  private execVariableDeclaration(node: ASTNode): RuntimeValue {
    const kind = node.kind as string;
    for (const decl of node.declarations as ASTNode[]) {
      const name = decl.id?.name ?? '?';
      const value = decl.init ? this.evaluate(decl.init) : UNDEFINED_VAL;
      this.currentScope.define(name, value);
      this.emit(
        'declaration',
        `Declare ${kind} ${name} = ${formatValue(value)}`,
        this.getLine(node),
        'callStack',
      );
    }
    return UNDEFINED_VAL;
  }

  private execBlock(node: ASTNode): RuntimeValue {
    const prevScope = this.currentScope;
    this.currentScope = new Scope('block', prevScope);
    let result: RuntimeValue = UNDEFINED_VAL;
    try {
      for (const stmt of node.body as ASTNode[]) {
        result = this.execute(stmt);
      }
    } finally {
      this.currentScope = prevScope;
    }
    return result;
  }

  private execIf(node: ASTNode): RuntimeValue {
    const testVal = this.evaluate(node.test);
    const raw = toRaw(testVal);
    const truthful = !!raw;
    this.emit(
      'condition_check',
      `Condition is ${truthful ? 'truthy' : 'falsy'} (${formatValue(testVal)})`,
      this.getLine(node),
    );
    if (truthful) {
      return this.execute(node.consequent);
    } else if (node.alternate) {
      return this.execute(node.alternate);
    }
    return UNDEFINED_VAL;
  }

  private execFor(node: ASTNode): RuntimeValue {
    const prevScope = this.currentScope;
    this.currentScope = new Scope('block', prevScope);
    try {
      if (node.init) {
        if (node.init.type === 'VariableDeclaration') {
          this.execVariableDeclaration(node.init);
        } else {
          this.evaluate(node.init);
        }
      }

      let iterations = 0;
      const maxIter = 200;
      while (iterations < maxIter) {
        if (node.test) {
          const testVal = this.evaluate(node.test);
          if (!toRaw(testVal)) {
            this.emit(
              'condition_check',
              `Loop condition is falsy, exiting loop`,
              this.getLine(node),
            );
            break;
          }
          this.emit(
            'loop_iteration',
            `Loop iteration ${iterations + 1}`,
            this.getLine(node),
          );
        }
        this.execute(node.body);
        if (node.update) this.evaluate(node.update);
        iterations++;
        if (this.stepId > this.maxSteps) break;
      }
    } finally {
      this.currentScope = prevScope;
    }
    return UNDEFINED_VAL;
  }

  private execWhile(node: ASTNode): RuntimeValue {
    let iterations = 0;
    const maxIter = 200;
    while (iterations < maxIter) {
      const testVal = this.evaluate(node.test);
      if (!toRaw(testVal)) {
        this.emit('condition_check', 'While condition is falsy, exiting', this.getLine(node));
        break;
      }
      this.emit('loop_iteration', `While iteration ${iterations + 1}`, this.getLine(node));
      this.execute(node.body);
      iterations++;
      if (this.stepId > this.maxSteps) break;
    }
    return UNDEFINED_VAL;
  }

  private execReturn(node: ASTNode): RuntimeValue {
    const value = node.argument ? this.evaluate(node.argument) : UNDEFINED_VAL;
    this.emit(
      'function_return',
      `Return ${formatValue(value)}`,
      this.getLine(node),
      'callStack',
    );
    // Use a sentinel to unwind
    throw Object.assign(new Error('__RETURN__'), { returnValue: value });
  }

  // --------------- Evaluation ---------------

  private evaluate(node: ASTNode): RuntimeValue {
    if (this.stepId > this.maxSteps) return UNDEFINED_VAL;

    switch (node.type) {
      case 'Literal':
        return toPrimitive(node.value);

      case 'TemplateLiteral':
        return this.evalTemplateLiteral(node);

      case 'Identifier':
        return this.currentScope.get(node.name);

      case 'BinaryExpression':
        return this.evalBinary(node);

      case 'LogicalExpression':
        return this.evalLogical(node);

      case 'UnaryExpression':
        return this.evalUnary(node);

      case 'UpdateExpression':
        return this.evalUpdate(node);

      case 'AssignmentExpression':
        return this.evalAssignment(node);

      case 'CallExpression':
        return this.evalCall(node);

      case 'MemberExpression':
        return this.evalMember(node);

      case 'NewExpression':
        return this.evalNew(node);

      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        return this.evalFunctionExpr(node);

      case 'ConditionalExpression':
        return this.evalConditional(node);

      case 'ArrayExpression':
        return this.evalArray(node);

      case 'ObjectExpression':
        return this.evalObject(node);

      case 'SequenceExpression': {
        let result: RuntimeValue = UNDEFINED_VAL;
        for (const expr of node.expressions as ASTNode[]) {
          result = this.evaluate(expr);
        }
        return result;
      }

      default:
        return UNDEFINED_VAL;
    }
  }

  private evalTemplateLiteral(node: ASTNode): RuntimeValue {
    const quasis = node.quasis as ASTNode[];
    const expressions = node.expressions as ASTNode[];
    let result = '';
    for (let i = 0; i < quasis.length; i++) {
      result += quasis[i].value.cooked ?? '';
      if (i < expressions.length) {
        const val = this.evaluate(expressions[i]);
        result += String(toRaw(val));
      }
    }
    return { type: 'string', value: result };
  }

  private evalBinary(node: ASTNode): RuntimeValue {
    const left = toRaw(this.evaluate(node.left)) as number;
    const right = toRaw(this.evaluate(node.right)) as number;
    let result: unknown;

    switch (node.operator) {
      case '+': result = (left as any) + (right as any); break;
      case '-': result = left - right; break;
      case '*': result = left * right; break;
      case '/': result = left / right; break;
      case '%': result = left % right; break;
      case '**': result = left ** right; break;
      case '===': result = left === right; break;
      case '!==': result = left !== right; break;
      case '==': result = left == right; break;
      case '!=': result = left != right; break;
      case '<': result = left < right; break;
      case '>': result = left > right; break;
      case '<=': result = left <= right; break;
      case '>=': result = left >= right; break;
      default: result = undefined;
    }
    return toPrimitive(result);
  }

  private evalLogical(node: ASTNode): RuntimeValue {
    const left = this.evaluate(node.left);
    const leftRaw = toRaw(left);
    if (node.operator === '&&') return leftRaw ? this.evaluate(node.right) : left;
    if (node.operator === '||') return leftRaw ? left : this.evaluate(node.right);
    if (node.operator === '??') return leftRaw != null ? left : this.evaluate(node.right);
    return UNDEFINED_VAL;
  }

  private evalUnary(node: ASTNode): RuntimeValue {
    const arg = this.evaluate(node.argument);
    const raw = toRaw(arg);
    switch (node.operator) {
      case '!': return toPrimitive(!raw);
      case '-': return toPrimitive(-(raw as number));
      case '+': return toPrimitive(+(raw as number));
      case 'typeof': return toPrimitive(typeof raw);
      default: return UNDEFINED_VAL;
    }
  }

  private evalUpdate(node: ASTNode): RuntimeValue {
    const name = node.argument?.name;
    if (!name) return UNDEFINED_VAL;
    const curr = this.currentScope.get(name);
    const raw = toRaw(curr) as number;
    const newVal = node.operator === '++' ? raw + 1 : raw - 1;
    const newRv = toPrimitive(newVal);
    this.currentScope.set(name, newRv);
    this.emit('assignment', `${name} ${node.operator} → ${newVal}`, this.getLine(node), 'callStack');
    return node.prefix ? newRv : curr;
  }

  private evalAssignment(node: ASTNode): RuntimeValue {
    const value = this.evaluate(node.right);
    if (node.left.type === 'Identifier') {
      const name = node.left.name;

      let finalValue = value;
      if (node.operator !== '=') {
        const curr = toRaw(this.currentScope.get(name)) as number;
        const rv = toRaw(value) as number;
        switch (node.operator) {
          case '+=': finalValue = toPrimitive((curr as any) + (rv as any)); break;
          case '-=': finalValue = toPrimitive(curr - rv); break;
          case '*=': finalValue = toPrimitive(curr * rv); break;
          case '/=': finalValue = toPrimitive(curr / rv); break;
          default: break;
        }
      }

      this.currentScope.set(name, finalValue) || this.currentScope.define(name, finalValue);
      this.emit(
        'assignment',
        `${name} = ${formatValue(finalValue)}`,
        this.getLine(node),
        'callStack',
      );
      return finalValue;
    }
    return value;
  }

  private evalCall(node: ASTNode): RuntimeValue {
    // Handle console.log
    if (
      node.callee.type === 'MemberExpression' &&
      node.callee.object?.name === 'console' &&
      node.callee.property?.name === 'log'
    ) {
      return this.handleConsoleLog(node);
    }

    // Handle setTimeout
    if (node.callee.type === 'Identifier' && node.callee.name === 'setTimeout') {
      return this.handleSetTimeout(node);
    }

    // Handle setInterval
    if (node.callee.type === 'Identifier' && node.callee.name === 'setInterval') {
      return this.handleSetInterval(node);
    }

    // Handle Promise.resolve().then(...)
    if (this.isPromiseResolve(node)) {
      return this.handlePromiseResolve(node);
    }

    // Handle .then() on promises
    if (
      node.callee.type === 'MemberExpression' &&
      node.callee.property?.name === 'then'
    ) {
      return this.handleThen(node);
    }

    // Handle new Promise(...)
    if (node.type === 'NewExpression') {
      return this.evalNew(node);
    }

    // Regular function call
    const calleeName = this.getCalleeName(node.callee);
    const fnVal = this.evaluate(node.callee);
    const args = (node.arguments as ASTNode[]).map(a => this.evaluate(a));

    if (fnVal.type !== 'function') {
      this.emit('expression', `${calleeName}() is not a function`, this.getLine(node));
      return UNDEFINED_VAL;
    }

    return this.invokeFunction(fnVal.name, fnVal.heapId, args, this.getLine(node));
  }

  private invokeFunction(
    name: string,
    heapId: string,
    args: RuntimeValue[],
    line: number,
  ): RuntimeValue {
    const heapObj = this.runtime.heap.get(heapId);
    if (!heapObj) return UNDEFINED_VAL;

    const fnNode = (heapObj as unknown as { _node?: ASTNode })._node;
    if (!fnNode) return UNDEFINED_VAL;

    // Push new frame
    const frame: StackFrame = {
      id: uid('frame'),
      name: name || 'anonymous',
      type: 'function',
      variables: {},
      line,
    };
    this.runtime.callStack.push(frame);
    this.emit('function_call', `Call ${name}(${args.map(formatValue).join(', ')})`, line, 'callStack', frame.id);

    // Create function scope
    const prevScope = this.currentScope;
    const closureScope = (heapObj as unknown as { _closureScope?: Scope })._closureScope ?? this.globalScope;
    this.currentScope = new Scope('function', closureScope);

    // Bind parameters
    const params = (fnNode.params as ASTNode[]) ?? [];
    for (let i = 0; i < params.length; i++) {
      const pName = params[i].name ?? `arg${i}`;
      this.currentScope.define(pName, args[i] ?? UNDEFINED_VAL);
    }

    let returnValue: RuntimeValue = UNDEFINED_VAL;
    try {
      const body = fnNode.body;
      if (body.type === 'BlockStatement') {
        for (const stmt of body.body as ASTNode[]) {
          this.execute(stmt);
        }
      } else {
        // Arrow function with expression body
        returnValue = this.evaluate(body);
        this.emit('function_return', `Return ${formatValue(returnValue)}`, this.getLine(body), 'callStack');
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message === '__RETURN__') {
        returnValue = (e as unknown as { returnValue: RuntimeValue }).returnValue;
      } else {
        throw e;
      }
    } finally {
      this.currentScope = prevScope;
      this.runtime.callStack.pop();
      this.emit('function_return', `${name}() returned ${formatValue(returnValue)}`, line, 'callStack');
    }

    return returnValue;
  }

  // --------------- Built-in handlers ---------------

  private handleConsoleLog(node: ASTNode): RuntimeValue {
    const args = (node.arguments as ASTNode[]).map(a => this.evaluate(a));
    const output = args.map(a => {
      const raw = toRaw(a);
      return typeof raw === 'string' ? raw : String(raw);
    }).join(' ');
    this.runtime.output.push(output);
    this.emit('console_log', `console.log(${output})`, this.getLine(node), 'output');
    return UNDEFINED_VAL;
  }

  private handleSetTimeout(node: ASTNode): RuntimeValue {
    const args = node.arguments as ASTNode[];
    const callbackNode = args[0];
    const delayNode = args[1];
    const delay = delayNode ? (toRaw(this.evaluate(delayNode)) as number) : 0;

    const callbackName = this.getCalleeName(callbackNode) || 'callback';
    const timer = this.runtime.webAPIs.registerTimeout(callbackName, delay);

    // Store the callback for later execution
    this.pendingTimerCallbacks.set(timer.id, {
      node: callbackNode,
      scope: this.currentScope,
      name: callbackName,
      thisVal: UNDEFINED_VAL,
    });

    this.emit(
      'web_api_register',
      `setTimeout(${callbackName}, ${delay}ms) → registered in Web APIs`,
      this.getLine(node),
      'webAPI',
      timer.id,
    );
    return toPrimitive(0);
  }

  private handleSetInterval(node: ASTNode): RuntimeValue {
    const args = node.arguments as ASTNode[];
    const callbackNode = args[0];
    const delayNode = args[1];
    const delay = delayNode ? (toRaw(this.evaluate(delayNode)) as number) : 0;

    const callbackName = this.getCalleeName(callbackNode) || 'callback';
    const timer = this.runtime.webAPIs.registerInterval(callbackName, delay);

    this.pendingTimerCallbacks.set(timer.id, {
      node: callbackNode,
      scope: this.currentScope,
      name: callbackName,
      thisVal: UNDEFINED_VAL,
    });

    this.emit(
      'web_api_register',
      `setInterval(${callbackName}, ${delay}ms) → registered in Web APIs`,
      this.getLine(node),
      'webAPI',
      timer.id,
    );
    return toPrimitive(0);
  }

  private isPromiseResolve(node: ASTNode): boolean {
    const callee = node.callee;
    if (callee.type !== 'MemberExpression') return false;
    if (callee.object?.type === 'Identifier' && callee.object.name === 'Promise') {
      return callee.property?.name === 'resolve' || callee.property?.name === 'reject';
    }
    return false;
  }

  private handlePromiseResolve(node: ASTNode): RuntimeValue {
    const args = (node.arguments as ASTNode[]).map(a => this.evaluate(a));
    const value = args[0] ?? UNDEFINED_VAL;
    const isReject = node.callee.property?.name === 'reject';

    const heapId = uid('promise');
    this.runtime.heap.alloc({
      id: heapId,
      type: 'promise',
      label: isReject ? 'Promise.reject' : 'Promise.resolve',
      properties: {},
      promiseState: isReject ? 'rejected' : 'fulfilled',
      promiseValue: value,
    });

    this.emit(
      isReject ? 'promise_reject' : 'promise_resolve',
      `Promise.${isReject ? 'reject' : 'resolve'}(${formatValue(value)})`,
      this.getLine(node),
      'heap',
      heapId,
    );

    return { type: 'reference', heapId, label: `Promise<${formatValue(value)}>` };
  }

  private handleThen(node: ASTNode): RuntimeValue {
    // Evaluate the object first (the promise)
    const promiseVal = this.evaluate(node.callee.object);

    // Evaluate the callback
    const args = node.arguments as ASTNode[];
    const callbackNode = args[0];
    if (!callbackNode) return promiseVal;

    const callbackName = this.getCalleeName(callbackNode) || 'then callback';
    const taskId = uid('microtask');

    // Store callback for event loop processing
    this.pendingMicrotaskCallbacks.set(taskId, {
      node: callbackNode,
      scope: this.currentScope,
      name: callbackName,
      thisVal: UNDEFINED_VAL,
    });

    // If promise is already resolved, queue microtask
    const task: QueuedTask = {
      id: taskId,
      label: `.then(${callbackName})`,
      callbackName,
      type: 'promise_then',
    };
    this.runtime.microtaskQueue.enqueue(task);

    this.emit(
      'queue_microtask',
      `.then(${callbackName}) → queued as microtask`,
      this.getLine(node),
      'microtaskQueue',
      taskId,
    );

    // Return the promise chain (same reference for simplicity)
    return promiseVal;
  }

  private evalNew(node: ASTNode): RuntimeValue {
    // Handle new Promise(executor)
    if (node.callee.type === 'Identifier' && node.callee.name === 'Promise') {
      return this.handleNewPromise(node);
    }
    return UNDEFINED_VAL;
  }

  private handleNewPromise(node: ASTNode): RuntimeValue {
    const heapId = uid('promise');
    this.runtime.heap.alloc({
      id: heapId,
      type: 'promise',
      label: 'new Promise',
      properties: {},
      promiseState: 'pending',
    });

    this.emit('promise_create', 'new Promise() created (pending)', this.getLine(node), 'heap', heapId);

    // Execute the executor function synchronously
    const args = node.arguments as ASTNode[];
    const executorNode = args[0];
    if (executorNode) {
      // The executor receives resolve and reject.
      // We simulate them as simple functions that resolve the promise.
      const prevScope = this.currentScope;
      this.currentScope = new Scope('function', prevScope);

      // Create resolve/reject as special built-in identifiers
      this.currentScope.define('resolve', { type: 'function', name: 'resolve', heapId: `${heapId}_resolve` });
      this.currentScope.define('reject', { type: 'function', name: 'reject', heapId: `${heapId}_reject` });

      // Store resolve/reject heap entries so we can detect calls
      this.runtime.heap.alloc({
        id: `${heapId}_resolve`,
        type: 'function',
        label: 'resolve',
        properties: { __promiseId: { type: 'string', value: heapId } },
      });
      Object.assign(this.runtime.heap.get(`${heapId}_resolve`)!, {
        _isResolve: true,
        _promiseHeapId: heapId,
      });

      // If executor is a function expression / arrow
      if (executorNode.type === 'ArrowFunctionExpression' || executorNode.type === 'FunctionExpression') {
        const params = (executorNode.params as ASTNode[]) ?? [];
        if (params[0]) this.currentScope.define(params[0].name, this.currentScope.get('resolve'));
        if (params[1]) this.currentScope.define(params[1].name, this.currentScope.get('reject'));

        try {
          if (executorNode.body.type === 'BlockStatement') {
            for (const stmt of executorNode.body.body as ASTNode[]) {
              this.execute(stmt);
            }
          } else {
            this.evaluate(executorNode.body);
          }
        } catch (e: unknown) {
          if (e instanceof Error && e.message === '__RETURN__') {
            // ignore returns in executor
          }
        }
      }

      this.currentScope = prevScope;
    }

    return { type: 'reference', heapId, label: 'Promise' };
  }

  private evalFunctionExpr(node: ASTNode): RuntimeValue {
    const name = node.id?.name ?? 'anonymous';
    const heapId = uid('fn');
    const fnObj = {
      id: heapId,
      type: 'function' as const,
      label: `fn ${name}`,
      properties: {},
      _node: node,
      _closureScope: this.currentScope,
    };
    this.runtime.heap.alloc(fnObj);
    Object.assign(this.runtime.heap.get(heapId)!, { _node: node, _closureScope: this.currentScope });
    return { type: 'function', name, heapId };
  }

  private evalMember(node: ASTNode): RuntimeValue {
    const obj = this.evaluate(node.object);
    const prop = node.computed
      ? String(toRaw(this.evaluate(node.property)))
      : node.property?.name;

    if (obj.type === 'reference') {
      const heapObj = this.runtime.heap.get(obj.heapId);
      if (heapObj && prop && prop in heapObj.properties) {
        return heapObj.properties[prop];
      }
      // Array length
      if (heapObj?.type === 'array' && prop === 'length') {
        const len = Object.keys(heapObj.properties).filter(k => k !== 'length').length;
        return toPrimitive(len);
      }
    }
    return UNDEFINED_VAL;
  }

  private evalConditional(node: ASTNode): RuntimeValue {
    const test = this.evaluate(node.test);
    return toRaw(test) ? this.evaluate(node.consequent) : this.evaluate(node.alternate);
  }

  private evalArray(node: ASTNode): RuntimeValue {
    const heapId = uid('arr');
    const properties: Record<string, RuntimeValue> = {};
    const elements = (node.elements as ASTNode[]) ?? [];
    elements.forEach((el, i) => {
      if (el) properties[String(i)] = this.evaluate(el);
    });
    this.runtime.heap.alloc({
      id: heapId,
      type: 'array',
      label: `Array(${elements.length})`,
      properties,
    });
    return { type: 'reference', heapId, label: `[${elements.length} items]` };
  }

  private evalObject(node: ASTNode): RuntimeValue {
    const heapId = uid('obj');
    const properties: Record<string, RuntimeValue> = {};
    for (const prop of (node.properties as ASTNode[]) ?? []) {
      const key = prop.key?.name ?? prop.key?.value ?? '?';
      properties[String(key)] = this.evaluate(prop.value);
    }
    this.runtime.heap.alloc({
      id: heapId,
      type: 'object',
      label: '{...}',
      properties,
    });
    return { type: 'reference', heapId, label: `{${Object.keys(properties).join(', ')}}` };
  }

  // --------------- Event Loop ---------------

  private processEventLoop() {
    if (
      this.runtime.webAPIs.timers.length === 0 &&
      this.runtime.microtaskQueue.isEmpty() &&
      this.runtime.taskQueue.isEmpty()
    ) {
      return;
    }

    this.runtime.eventLoop.setPhase('checking');
    this.emit('event_loop_tick', 'Event loop starts checking queues', null, 'eventLoop');

    // First drain microtask queue
    this.drainMicrotasks();

    // Move timers to task queue (simulate all timers completing)
    const timerIds = this.runtime.webAPIs.timers.map(t => t.id);
    for (const timerId of timerIds) {
      const timer = this.runtime.webAPIs.completeTimer(timerId);
      if (!timer) continue;

      this.emit(
        'web_api_complete',
        `Timer ${timer.callbackName} (${timer.delay}ms) complete → moved to Task Queue`,
        null,
        'webAPI',
      );

      const task: QueuedTask = {
        id: uid('task'),
        label: timer.callbackName,
        callbackName: timer.callbackName,
        type: 'timer',
      };
      this.runtime.taskQueue.enqueue(task);
      // Link the callback
      const cb = this.pendingTimerCallbacks.get(timerId);
      if (cb) {
        this.pendingTimerCallbacks.set(task.id, cb);
      }

      this.emit('queue_macrotask', `${timer.callbackName} added to Task Queue`, null, 'taskQueue', task.id);
    }

    // Process task queue (one task at a time, with microtask drain between)
    let safetyCounter = 0;
    while (!this.runtime.taskQueue.isEmpty() && safetyCounter < 50 && this.stepId < this.maxSteps) {
      this.runtime.eventLoop.setPhase('macrotask');
      const task = this.runtime.taskQueue.dequeue();
      if (!task) break;

      this.emit(
        'dequeue_macrotask',
        `Dequeue "${task.label}" from Task Queue → execute callback`,
        null,
        'taskQueue',
      );

      // Execute the callback
      const cb = this.pendingTimerCallbacks.get(task.id) ?? this.pendingTimerCallbacks.get(task.callbackName);
      if (cb) {
        this.executeCallback(cb, `${task.label} callback`);
      }

      // Drain microtasks after each macrotask
      this.drainMicrotasks();
      safetyCounter++;
    }

    this.runtime.eventLoop.setPhase('idle');
    this.emit('event_loop_tick', 'Event loop idle — all tasks processed', null, 'eventLoop');
  }

  private drainMicrotasks() {
    let safety = 0;
    while (!this.runtime.microtaskQueue.isEmpty() && safety < 100 && this.stepId < this.maxSteps) {
      this.runtime.eventLoop.setPhase('microtasks');
      const task = this.runtime.microtaskQueue.dequeue();
      if (!task) break;

      this.emit(
        'dequeue_microtask',
        `Dequeue "${task.label}" from Microtask Queue → execute`,
        null,
        'microtaskQueue',
      );

      const cb = this.pendingMicrotaskCallbacks.get(task.id);
      if (cb) {
        this.executeCallback(cb, task.label);
      }
      safety++;
    }
  }

  private executeCallback(cb: PendingCallback, name: string) {
    const frame: StackFrame = {
      id: uid('frame'),
      name,
      type: 'function',
      variables: {},
      line: this.getLine(cb.node),
    };
    this.runtime.callStack.push(frame);
    this.runtime.eventLoop.setPhase('callStack');
    this.emit('function_call', `Execute callback: ${name}`, this.getLine(cb.node), 'callStack', frame.id);

    const prevScope = this.currentScope;
    this.currentScope = new Scope('function', cb.scope);

    try {
      const node = cb.node;
      if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
        if (node.body.type === 'BlockStatement') {
          for (const stmt of node.body.body as ASTNode[]) {
            this.execute(stmt);
          }
        } else {
          this.evaluate(node.body);
        }
      } else if (node.type === 'Identifier') {
        // The callback is a named function reference
        const fnVal = cb.scope.get(node.name) ?? this.globalScope.get(node.name);
        if (fnVal.type === 'function') {
          this.invokeFunction(fnVal.name, fnVal.heapId, [], this.getLine(node));
        }
      }
    } catch (e: unknown) {
      if (!(e instanceof Error && e.message === '__RETURN__')) {
        // swallow
      }
    } finally {
      this.currentScope = prevScope;
      this.runtime.callStack.pop();
      this.emit('function_return', `${name} callback complete`, this.getLine(cb.node), 'callStack');
    }
  }

  // Also handle resolve() calls inside promise executors
  // Override evalCall to detect resolve/reject
  private getCalleeName(node: ASTNode): string {
    if (node.type === 'Identifier') return node.name;
    if (node.type === 'MemberExpression') {
      const obj = this.getCalleeName(node.object);
      const prop = node.property?.name ?? '';
      return `${obj}.${prop}`;
    }
    if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
      return node.id?.name ?? 'anonymous';
    }
    return 'anonymous';
  }
}
