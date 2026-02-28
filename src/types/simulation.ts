export type StepType =
  | 'program_start'
  | 'declaration'
  | 'assignment'
  | 'expression'
  | 'function_call'
  | 'function_return'
  | 'condition_check'
  | 'loop_iteration'
  | 'web_api_register'
  | 'web_api_complete'
  | 'queue_macrotask'
  | 'dequeue_macrotask'
  | 'queue_microtask'
  | 'dequeue_microtask'
  | 'event_loop_tick'
  | 'promise_create'
  | 'promise_resolve'
  | 'promise_reject'
  | 'console_log'
  | 'program_end';

export interface StackFrame {
  id: string;
  name: string;
  type: 'global' | 'function';
  variables: Record<string, RuntimeValue>;
  line: number;
}

export interface HeapObject {
  id: string;
  type: 'object' | 'array' | 'function' | 'promise';
  label: string;
  properties: Record<string, RuntimeValue>;
  promiseState?: 'pending' | 'fulfilled' | 'rejected';
  promiseValue?: RuntimeValue;
}

export interface WebAPITimer {
  id: string;
  type: 'timeout' | 'interval';
  callbackName: string;
  delay: number;
  elapsed: number;
}

export interface QueuedTask {
  id: string;
  label: string;
  callbackName: string;
  type: 'timer' | 'promise_then' | 'promise_catch' | 'microtask';
}

export type EventLoopPhase = 'idle' | 'callStack' | 'microtasks' | 'macrotask' | 'checking';

export type RuntimeValue =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'undefined'; value: undefined }
  | { type: 'null'; value: null }
  | { type: 'reference'; heapId: string; label: string }
  | { type: 'function'; name: string; heapId: string };

export interface RuntimeSnapshot {
  callStack: StackFrame[];
  heap: Record<string, HeapObject>;
  webAPIs: WebAPITimer[];
  taskQueue: QueuedTask[];
  microtaskQueue: QueuedTask[];
  eventLoopPhase: EventLoopPhase;
  output: string[];
  currentLine: number | null;
}

export interface Step {
  id: number;
  type: StepType;
  description: string;
  line: number | null;
  snapshot: RuntimeSnapshot;
  highlight?: {
    component: 'callStack' | 'heap' | 'webAPI' | 'taskQueue' | 'microtaskQueue' | 'eventLoop' | 'output';
    itemId?: string;
  };
}

export interface SimulationResult {
  steps: Step[];
  error?: string;
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  code: string;
  category: 'basics' | 'functions' | 'closures' | 'async' | 'promises' | 'event-loop';
}
