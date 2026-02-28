import type {
  StackFrame,
  HeapObject,
  WebAPITimer,
  QueuedTask,
  RuntimeValue,
  RuntimeSnapshot,
  EventLoopPhase,
} from '../types/simulation';

let _uid = 0;
function uid(prefix = 'id') {
  return `${prefix}_${++_uid}`;
}

export function resetUid() {
  _uid = 0;
}

// --------------- Scope ---------------
export class Scope {
  id: string;
  variables: Record<string, RuntimeValue> = {};
  parent: Scope | null;
  type: 'global' | 'function' | 'block';

  constructor(type: 'global' | 'function' | 'block', parent: Scope | null = null) {
    this.id = uid('scope');
    this.type = type;
    this.parent = parent;
  }

  define(name: string, value: RuntimeValue) {
    this.variables[name] = value;
  }

  get(name: string): RuntimeValue {
    if (name in this.variables) return this.variables[name];
    if (this.parent) return this.parent.get(name);
    return { type: 'undefined', value: undefined };
  }

  set(name: string, value: RuntimeValue): boolean {
    if (name in this.variables) {
      this.variables[name] = value;
      return true;
    }
    if (this.parent) return this.parent.set(name, value);
    return false;
  }

  snapshot(): Record<string, RuntimeValue> {
    return { ...this.variables };
  }
}

// --------------- CallStack ---------------
export class CallStack {
  frames: StackFrame[] = [];

  push(frame: StackFrame) {
    this.frames.push(frame);
  }

  pop(): StackFrame | undefined {
    return this.frames.pop();
  }

  peek(): StackFrame | undefined {
    return this.frames[this.frames.length - 1];
  }

  isEmpty(): boolean {
    return this.frames.length === 0;
  }

  snapshot(): StackFrame[] {
    return this.frames.map(f => ({
      ...f,
      variables: { ...f.variables },
    }));
  }
}

// --------------- Heap ---------------
export class Heap {
  objects: Record<string, HeapObject> = {};

  alloc(obj: HeapObject): string {
    this.objects[obj.id] = obj;
    return obj.id;
  }

  get(id: string): HeapObject | undefined {
    return this.objects[id];
  }

  update(id: string, props: Partial<HeapObject>) {
    if (this.objects[id]) {
      this.objects[id] = { ...this.objects[id], ...props };
    }
  }

  snapshot(): Record<string, HeapObject> {
    const snap: Record<string, HeapObject> = {};
    for (const [k, v] of Object.entries(this.objects)) {
      snap[k] = { ...v, properties: { ...v.properties } };
    }
    return snap;
  }
}

// --------------- WebAPI ---------------
export class WebAPIs {
  timers: WebAPITimer[] = [];

  registerTimeout(callbackName: string, delay: number): WebAPITimer {
    const timer: WebAPITimer = {
      id: uid('timer'),
      type: 'timeout',
      callbackName,
      delay,
      elapsed: 0,
    };
    this.timers.push(timer);
    return timer;
  }

  registerInterval(callbackName: string, delay: number): WebAPITimer {
    const timer: WebAPITimer = {
      id: uid('interval'),
      type: 'interval',
      callbackName,
      delay,
      elapsed: 0,
    };
    this.timers.push(timer);
    return timer;
  }

  completeTimer(id: string): WebAPITimer | undefined {
    const idx = this.timers.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    const [timer] = this.timers.splice(idx, 1);
    return timer;
  }

  snapshot(): WebAPITimer[] {
    return this.timers.map(t => ({ ...t }));
  }
}

// --------------- TaskQueue ---------------
export class TaskQueue {
  tasks: QueuedTask[] = [];

  enqueue(task: QueuedTask) {
    this.tasks.push(task);
  }

  dequeue(): QueuedTask | undefined {
    return this.tasks.shift();
  }

  isEmpty(): boolean {
    return this.tasks.length === 0;
  }

  snapshot(): QueuedTask[] {
    return this.tasks.map(t => ({ ...t }));
  }
}

// --------------- MicrotaskQueue ---------------
export class MicrotaskQueue {
  tasks: QueuedTask[] = [];

  enqueue(task: QueuedTask) {
    this.tasks.push(task);
  }

  dequeue(): QueuedTask | undefined {
    return this.tasks.shift();
  }

  isEmpty(): boolean {
    return this.tasks.length === 0;
  }

  snapshot(): QueuedTask[] {
    return this.tasks.map(t => ({ ...t }));
  }
}

// --------------- EventLoop (state only) ---------------
export class EventLoop {
  phase: EventLoopPhase = 'idle';

  setPhase(phase: EventLoopPhase) {
    this.phase = phase;
  }

  snapshot(): EventLoopPhase {
    return this.phase;
  }
}

// --------------- RuntimeEnvironment (bundles all runtime components) ---------------
export class RuntimeEnvironment {
  callStack = new CallStack();
  heap = new Heap();
  webAPIs = new WebAPIs();
  taskQueue = new TaskQueue();
  microtaskQueue = new MicrotaskQueue();
  eventLoop = new EventLoop();
  output: string[] = [];

  snapshot(currentLine: number | null): RuntimeSnapshot {
    return {
      callStack: this.callStack.snapshot(),
      heap: this.heap.snapshot(),
      webAPIs: this.webAPIs.snapshot(),
      taskQueue: this.taskQueue.snapshot(),
      microtaskQueue: this.microtaskQueue.snapshot(),
      eventLoopPhase: this.eventLoop.snapshot(),
      output: [...this.output],
      currentLine,
    };
  }
}

export { uid };
