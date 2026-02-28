import type { CodeExample } from '../types/simulation';

export const CODE_EXAMPLES: CodeExample[] = [
  {
    id: 'basic-vars',
    title: 'Variables & Operations',
    description: 'Basic variable declarations and arithmetic',
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
    id: 'closures',
    title: 'Closures',
    description: 'Functions that capture variables from outer scope',
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
    id: 'settimeout',
    title: 'setTimeout',
    description: 'Async timer with Web API and Task Queue',
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
    id: 'event-loop',
    title: 'Event Loop - Full Demo',
    description: 'setTimeout vs Promise ordering',
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
    id: 'recursion',
    title: 'Recursion',
    description: 'Recursive function building up the call stack',
    category: 'functions',
    code: `function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

const result = factorial(5);
console.log("5! =", result);`,
  },
  {
    id: 'control-flow',
    title: 'Conditionals & Loops',
    description: 'if/else statements and for loops',
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
];

export function getExamplesByCategory() {
  const categories: Record<string, CodeExample[]> = {};
  for (const ex of CODE_EXAMPLES) {
    if (!categories[ex.category]) categories[ex.category] = [];
    categories[ex.category].push(ex);
  }
  return categories;
}

export function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    basics: 'Basics',
    functions: 'Functions',
    closures: 'Closures',
    async: 'Async',
    promises: 'Promises',
    'event-loop': 'Event Loop',
  };
  return labels[cat] ?? cat;
}
