import type { CodeExample } from '../types/simulation';

export const CODE_EXAMPLES: CodeExample[] = [
  // ─── Basics ───────────────────────────────────────────────
  {
    id: 'basic-vars',
    title: 'Variables & Operations',
    description: 'const/let declarations, arithmetic and string operations',
    category: 'basics',
    code: `const x = 10;
const y = 20;
const sum = x + y;
console.log("Sum:", sum);

let greeting = "Hello";
greeting = greeting + " World";
console.log(greeting);`,
  },
  {
    id: 'control-flow',
    title: 'Conditionals & Loops',
    description: 'if/else branching and for loop accumulation',
    category: 'basics',
    code: `let total = 0;

for (let i = 1; i <= 5; i++) {
  total = total + i;
}

if (total > 10) {
  console.log("Total is large:", total);
} else {
  console.log("Total is small:", total);
}`,
  },
  {
    id: 'while-loop',
    title: 'While Loop & Counters',
    description: 'While loop with a running counter and early exit condition',
    category: 'basics',
    code: `let count = 0;
let power = 1;

while (power < 100) {
  power = power * 2;
  count = count + 1;
}

console.log("Doublings needed:", count);
console.log("Final power:", power);`,
  },

  // ─── Functions ────────────────────────────────────────────
  {
    id: 'functions',
    title: 'Function Calls',
    description: 'Function declarations, calls, and return values',
    category: 'functions',
    code: `function multiply(a, b) {
  const result = a * b;
  return result;
}

function square(n) {
  return multiply(n, n);
}

const val = square(5);
console.log("5 squared =", val);`,
  },
  {
    id: 'recursion',
    title: 'Recursion — Factorial',
    description: 'Watch the call stack grow and unwind during recursive calls',
    category: 'functions',
    code: `function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  const sub = factorial(n - 1);
  const result = n * sub;
  return result;
}

const answer = factorial(5);
console.log("5! =", answer);`,
  },
  {
    id: 'fibonacci',
    title: 'Recursion — Fibonacci',
    description: 'Fibonacci via double recursion — see branching call stacks',
    category: 'functions',
    code: `function fib(n) {
  if (n <= 1) {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}

console.log("fib(0) =", fib(0));
console.log("fib(1) =", fib(1));
console.log("fib(5) =", fib(5));`,
  },
  {
    id: 'higher-order',
    title: 'Higher-Order Functions',
    description: 'Functions that accept other functions as arguments',
    category: 'functions',
    code: `function applyTwice(fn, value) {
  return fn(fn(value));
}

function addThree(x) {
  return x + 3;
}

function double(x) {
  return x * 2;
}

const result1 = applyTwice(addThree, 10);
console.log("applyTwice(addThree, 10) =", result1);

const result2 = applyTwice(double, 3);
console.log("applyTwice(double, 3) =", result2);`,
  },

  // ─── Closures ─────────────────────────────────────────────
  {
    id: 'closures',
    title: 'Closures — Counter',
    description: 'Functions that capture and mutate outer scope variables',
    category: 'closures',
    code: `function createCounter() {
  let count = 0;
  function increment() {
    count = count + 1;
    return count;
  }
  return increment;
}

const counter = createCounter();
console.log(counter());
console.log(counter());
console.log(counter());`,
  },
  {
    id: 'closure-adder',
    title: 'Closures — Adder Factory',
    description: 'Factory that creates specialized adder functions via closures',
    category: 'closures',
    code: `function makeAdder(x) {
  function add(y) {
    return x + y;
  }
  return add;
}

const add5 = makeAdder(5);
const add10 = makeAdder(10);

console.log("add5(3) =", add5(3));
console.log("add10(3) =", add10(3));
console.log("add5(add10(2)) =", add5(add10(2)));`,
  },
  {
    id: 'closure-memoize',
    title: 'Memoization',
    description: 'Cache expensive results using a closure over a result map',
    category: 'closures',
    code: `function createMemoizedDouble() {
  let callCount = 0;

  function memoDouble(n) {
    callCount = callCount + 1;
    const result = n * 2;
    console.log("Computing double of", n, "=", result);
    return result;
  }

  function getCallCount() {
    return callCount;
  }

  return memoDouble;
}

const doubleFn = createMemoizedDouble();
console.log(doubleFn(4));
console.log(doubleFn(7));
console.log(doubleFn(4));`,
  },

  // ─── Objects ──────────────────────────────────────────────
  {
    id: 'objects-basics',
    title: 'Objects & Heap',
    description: 'Object creation, property access, and heap allocation',
    category: 'objects',
    code: `const person = {
  name: "Alice",
  age: 30
};

function greet(obj) {
  const msg = "Hello, " + obj.name;
  return msg;
}

const message = greet(person);
console.log(message);`,
  },
  {
    id: 'objects-constructor',
    title: 'Constructor Functions',
    description: 'Creating multiple objects from constructor functions',
    category: 'objects',
    code: `function createPerson(name, age) {
  const obj = { name: name, age: age };
  return obj;
}

function describeAge(person) {
  if (person.age >= 18) {
    return person.name + " is an adult";
  }
  return person.name + " is a minor";
}

const alice = createPerson("Alice", 30);
const bob = createPerson("Bob", 15);

console.log(describeAge(alice));
console.log(describeAge(bob));`,
  },

  // ─── Arrays ───────────────────────────────────────────────
  {
    id: 'arrays-basics',
    title: 'Arrays & Heap',
    description: 'Array creation and iteration stored in the heap',
    category: 'arrays',
    code: `const nums = [10, 20, 30, 40, 50];
let sum = 0;

for (let i = 0; i < 5; i++) {
  sum = sum + nums[i];
}

const avg = sum / 5;
console.log("Sum:", sum);
console.log("Average:", avg);`,
  },

  // ─── Async ────────────────────────────────────────────────
  {
    id: 'settimeout',
    title: 'setTimeout — Basic',
    description: 'Async timer registered in Web APIs, moved to Task Queue',
    category: 'async',
    code: `console.log("Start");

setTimeout(function timer1() {
  console.log("Timer 1 done");
}, 1000);

setTimeout(function timer2() {
  console.log("Timer 2 done");
}, 500);

console.log("End");`,
  },
  {
    id: 'settimeout-zero',
    title: 'setTimeout(0) vs Sync Code',
    description: 'Demonstrates that setTimeout(0) still runs after all sync code',
    category: 'async',
    code: `console.log("1 — sync start");

setTimeout(function deferred() {
  console.log("4 — setTimeout(0) fires last");
}, 0);

console.log("2 — still sync");

function syncWork() {
  console.log("3 — sync function runs before timer");
}

syncWork();`,
  },

  // ─── Promises ─────────────────────────────────────────────
  {
    id: 'promises',
    title: 'Promise.resolve & .then',
    description: 'Microtask queue with Promise chains',
    category: 'promises',
    code: `console.log("Script start");

Promise.resolve("resolved value").then(function onFulfilled(val) {
  console.log("Promise:", val);
});

console.log("Script end");`,
  },
  {
    id: 'promise-chain',
    title: 'Promise Chain',
    description: 'Chaining .then() microtasks to sequence async operations',
    category: 'promises',
    code: `console.log("A — sync start");

Promise.resolve(1)
  .then(function step1(val) {
    console.log("C — step1 got:", val);
    return val + 1;
  })
  .then(function step2(val) {
    console.log("D — step2 got:", val);
  });

console.log("B — sync end");`,
  },
  {
    id: 'promise-new',
    title: 'new Promise(executor)',
    description: 'Executor runs synchronously; .then callbacks are microtasks',
    category: 'promises',
    code: `console.log("1 — start");

const p = new Promise(function executor(resolve) {
  console.log("2 — executor runs sync");
  resolve("ok");
});

p.then(function done(val) {
  console.log("4 — resolved:", val);
});

console.log("3 — after creating promise");`,
  },

  // ─── Event Loop ───────────────────────────────────────────
  {
    id: 'event-loop',
    title: 'Event Loop — Full Demo',
    description: 'setTimeout vs Promise microtask ordering',
    category: 'event-loop',
    code: `console.log("1: Script start");

setTimeout(function timeout() {
  console.log("4: setTimeout callback");
}, 0);

Promise.resolve().then(function promise() {
  console.log("3: Promise microtask");
});

console.log("2: Script end");`,
  },
  {
    id: 'event-loop-complex',
    title: 'Event Loop — Microtasks First',
    description: 'Multiple timers and promises — microtasks always run before macrotasks',
    category: 'event-loop',
    code: `console.log("sync: start");

setTimeout(function timer1() {
  console.log("macrotask: timer1");
}, 0);

Promise.resolve().then(function micro1() {
  console.log("microtask: micro1");
}).then(function micro2() {
  console.log("microtask: micro2 (chained)");
});

setTimeout(function timer2() {
  console.log("macrotask: timer2");
}, 0);

console.log("sync: end");`,
  },

  // ─── Advanced Async ───────────────────────────────────────
  {
    id: 'callback-hell',
    title: 'Callback Hell',
    description: 'Nested setTimeout callbacks — the "pyramid of doom" pattern',
    category: 'advanced-async',
    code: `console.log("Step 0: begin");

setTimeout(function step1() {
  console.log("Step 1: fetch user");

  setTimeout(function step2() {
    console.log("Step 2: fetch orders");

    setTimeout(function step3() {
      console.log("Step 3: fetch items (callback hell)");
    }, 100);
  }, 200);
}, 300);`,
  },
  {
    id: 'promise-vs-callback',
    title: 'Promises vs Callbacks',
    description: 'Side-by-side visualization of callback vs Promise-based patterns',
    category: 'advanced-async',
    code: `console.log("start");

// Callback approach (macrotask)
setTimeout(function callbackFetch() {
  console.log("callback: data loaded");
}, 0);

// Promise approach (microtask — runs BEFORE the callback)
Promise.resolve("data").then(function promiseFetch(data) {
  console.log("promise: data loaded");
});

console.log("end — watch the order!");`,
  },
];

export function getExamplesByCategory() {
  const order = [
    'basics',
    'functions',
    'closures',
    'objects',
    'arrays',
    'async',
    'promises',
    'event-loop',
    'advanced-async',
  ];
  const categories: Record<string, CodeExample[]> = {};
  for (const ex of CODE_EXAMPLES) {
    if (!categories[ex.category]) categories[ex.category] = [];
    categories[ex.category].push(ex);
  }
  // Return in specified order
  const ordered: Record<string, CodeExample[]> = {};
  for (const cat of order) {
    if (categories[cat]) ordered[cat] = categories[cat];
  }
  // Append any remaining unlisted categories
  for (const [cat, exs] of Object.entries(categories)) {
    if (!ordered[cat]) ordered[cat] = exs;
  }
  return ordered;
}

export function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    basics: '🔤 Basics',
    functions: '⚙️ Functions',
    closures: '🔒 Closures',
    objects: '📦 Objects',
    arrays: '📋 Arrays',
    async: '⏱️ Async / Timers',
    promises: '🤝 Promises',
    'event-loop': '🔄 Event Loop',
    'advanced-async': '🚀 Advanced Async',
  };
  return labels[cat] ?? cat;
}
