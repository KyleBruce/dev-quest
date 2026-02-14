// Code Review Minigame
import { DEBUG_MODE, getDebugCodeReviewChance } from './debug.js';

const CODE_REVIEW_QUESTIONS = [
  {
    title: 'Buffer Overflow',
    code: 'char buffer[10];\nstrcpy(buffer, user_input);',
    options: [
      { text: 'Ship it!', correct: false },
      { text: 'Use strncpy with size limit', correct: true },
      { text: 'Make buffer bigger', correct: false },
    ],
    reward: { xp: 50, loc: 100 }
  },
  {
    title: 'Missing Null Terminator',
    code: 'char str[5];\nfor(int i = 0; i < 5; i++)\n  str[i] = \'a\';',
    options: [
      { text: 'Looks good', correct: false },
      { text: 'Need str[4] = \'\\0\'', correct: true },
      { text: 'Should use malloc', correct: false },
    ],
    reward: { xp: 40, loc: 80 }
  },
  {
    title: 'Memory Leak',
    code: 'void foo() {\n  int *ptr = malloc(100);\n  ptr[0] = 42;\n}',
    options: [
      { text: 'Perfect code', correct: false },
      { text: 'Missing free(ptr)', correct: true },
      { text: 'Should use calloc', correct: false },
    ],
    reward: { xp: 60, loc: 120 }
  },
  {
    title: 'Uninitialized Variable',
    code: 'int sum;\nfor(int i = 0; i < 10; i++)\n  sum += i;',
    options: [
      { text: 'No issues here', correct: false },
      { text: 'sum must be initialized to 0', correct: true },
      { text: 'Use sum = malloc(sizeof(int))', correct: false },
    ],
    reward: { xp: 70, loc: 150 }
  },
  {
    title: 'Dangling Pointer',
    code: 'int *ptr = malloc(10);\nfree(ptr);\n*ptr = 5;',
    options: [
      { text: 'LGTM', correct: false },
      { text: 'Using ptr after free() is undefined', correct: true },
      { text: 'Just need ptr = NULL first', correct: false },
    ],
    reward: { xp: 80, loc: 200 }
  },
  {
    title: 'Array Out of Bounds',
    code: 'int arr[10];\nfor(int i = 0; i <= 10; i++)\n  arr[i] = i;',
    options: [
      { text: 'Approve PR', correct: false },
      { text: 'Change i <= 10 to i < 10', correct: true },
      { text: 'Make array bigger', correct: false },
    ],
    reward: { xp: 100, loc: 250 }
  },
  {
    title: 'Integer Overflow',
    code: 'int a = 2147483647;\nint b = a + 1;\nprintf("%d", b);',
    options: [
      { text: 'Works fine, prints 2147483648', correct: false },
      { text: 'Undefined behavior, integer overflow', correct: true },
      { text: 'Just use float instead', correct: false },
    ],
    reward: { xp: 50, loc: 100 }
  },
  {
    title: 'Pointer Arithmetic Error',
    code: 'int arr[5] = {1,2,3,4,5};\nint *p = arr;\nprintf("%d", *(p + 5));',
    options: [
      { text: 'Prints 5', correct: false },
      { text: 'Out of bounds access', correct: true },
      { text: 'Need p = &arr first', correct: false },
    ],
    reward: { xp: 90, loc: 180 }
  },
  {
    title: 'Format String Vulnerability',
    code: 'char *user = get_input();\nprintf(user);',
    options: [
      { text: 'Safe and simple', correct: false },
      { text: 'Use printf("%s", user)', correct: true },
      { text: 'Use puts(user) instead', correct: false },
    ],
    reward: { xp: 120, loc: 240 }
  },
  {
    title: 'Double Free',
    code: 'int *p = malloc(10);\nfree(p);\nfree(p);',
    options: [
      { text: 'Harmless, just frees twice', correct: false },
      { text: 'Undefined behavior, double free', correct: true },
      { text: 'Should be free(&p)', correct: false },
    ],
    reward: { xp: 110, loc: 220 }
  },

  // --- JavaScript ---
  {
    title: 'Equality Gotcha',
    code: 'if (x == 0) {\n  console.log("falsy!");\n}',
    options: [
      { text: 'Works perfectly', correct: false },
      { text: 'Use === to avoid type coercion', correct: true },
      { text: 'Should use .equals()', correct: false },
    ],
    reward: { xp: 40, loc: 80 }
  },
  {
    title: 'Callback Hell',
    code: 'getData(function(a) {\n  getMore(a, function(b) {\n    save(b, function(c) {});\n  });\n});',
    options: [
      { text: 'Clean and readable', correct: false },
      { text: 'Refactor to async/await', correct: true },
      { text: 'Add more callbacks', correct: false },
    ],
    reward: { xp: 60, loc: 120 }
  },
  {
    title: 'Variable Hoisting',
    code: 'console.log(x);\nvar x = 5;',
    options: [
      { text: 'Prints 5', correct: false },
      { text: 'Prints undefined due to hoisting', correct: true },
      { text: 'Throws ReferenceError', correct: false },
    ],
    reward: { xp: 50, loc: 100 }
  },
  {
    title: 'Missing Await',
    code: 'async function save() {\n  const data = fetch("/api");\n  return data.json();\n}',
    options: [
      { text: 'Looks correct', correct: false },
      { text: 'Need await on fetch()', correct: true },
      { text: 'Remove async keyword', correct: false },
    ],
    reward: { xp: 70, loc: 150 }
  },
  {
    title: 'Closure Trap',
    code: 'for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100);\n}',
    options: [
      { text: 'Prints 0, 1, 2', correct: false },
      { text: 'Prints 3, 3, 3 — use let instead', correct: true },
      { text: 'Prints undefined 3 times', correct: false },
    ],
    reward: { xp: 80, loc: 160 }
  },
  {
    title: 'Prototype Pollution',
    code: 'function merge(target, src) {\n  for (let key in src)\n    target[key] = src[key];\n}',
    options: [
      { text: 'Standard merge pattern', correct: false },
      { text: 'Check hasOwnProperty to prevent pollution', correct: true },
      { text: 'Use Object.assign instead', correct: false },
    ],
    reward: { xp: 100, loc: 200 }
  },
  {
    title: 'Accidental Global',
    code: 'function calc() {\n  result = 42;\n  return result;\n}',
    options: [
      { text: 'Returns 42, all good', correct: false },
      { text: 'Missing let/const — creates global', correct: true },
      { text: 'Should use var instead', correct: false },
    ],
    reward: { xp: 50, loc: 100 }
  },
  {
    title: 'Array Reference Bug',
    code: 'const a = [1, 2, 3];\nconst b = a;\nb.push(4);',
    options: [
      { text: 'a is still [1,2,3]', correct: false },
      { text: 'a is now [1,2,3,4] — use spread to copy', correct: true },
      { text: 'Throws TypeError, const array', correct: false },
    ],
    reward: { xp: 60, loc: 120 }
  },
  {
    title: 'parseInt Surprise',
    code: 'const nums = ["1","2","3"];\nconst result = nums.map(parseInt);',
    options: [
      { text: 'Returns [1, 2, 3]', correct: false },
      { text: 'Returns [1, NaN, NaN] — use Number()', correct: true },
      { text: 'Throws TypeError', correct: false },
    ],
    reward: { xp: 90, loc: 180 }
  },
  {
    title: 'Floating Point',
    code: 'if (0.1 + 0.2 === 0.3) {\n  console.log("equal!");\n}',
    options: [
      { text: 'Prints "equal!"', correct: false },
      { text: 'Never prints — floating point imprecision', correct: true },
      { text: 'Syntax error', correct: false },
    ],
    reward: { xp: 50, loc: 100 }
  },

  // --- Python ---
  {
    title: 'Mutable Default Arg',
    code: 'def add_item(item, lst=[]):\n    lst.append(item)\n    return lst',
    options: [
      { text: 'Works as expected', correct: false },
      { text: 'Default list is shared across calls', correct: true },
      { text: 'Should use tuple instead', correct: false },
    ],
    reward: { xp: 70, loc: 150 }
  },
  {
    title: 'Late Binding Closure',
    code: 'funcs = [lambda: i\n         for i in range(3)]',
    options: [
      { text: 'Returns [0, 1, 2]', correct: false },
      { text: 'All return 2 — late binding', correct: true },
      { text: 'Throws NameError', correct: false },
    ],
    reward: { xp: 80, loc: 160 }
  },
  {
    title: 'Bare Except',
    code: 'try:\n    do_stuff()\nexcept:\n    pass',
    options: [
      { text: 'Safe error handling', correct: false },
      { text: 'Catches everything including KeyboardInterrupt', correct: true },
      { text: 'Should use finally instead', correct: false },
    ],
    reward: { xp: 50, loc: 100 }
  },
  {
    title: 'Is vs ==',
    code: 'a = 1000\nb = 1000\nprint(a is b)',
    options: [
      { text: 'Always True', correct: false },
      { text: 'Use == for value comparison, not is', correct: true },
      { text: 'Throws TypeError', correct: false },
    ],
    reward: { xp: 40, loc: 80 }
  },
  {
    title: 'Shadowed Builtin',
    code: 'list = [1, 2, 3]\ndata = list("hello")',
    options: [
      { text: 'Creates ["h","e","l","l","o"]', correct: false },
      { text: 'TypeError — list was shadowed', correct: true },
      { text: 'Need to import list first', correct: false },
    ],
    reward: { xp: 60, loc: 120 }
  },
  {
    title: 'Unintended Reference',
    code: 'matrix = [[0]*3] * 3\nmatrix[0][0] = 1',
    options: [
      { text: 'Only matrix[0][0] is 1', correct: false },
      { text: 'All rows share the same list', correct: true },
      { text: 'IndexError', correct: false },
    ],
    reward: { xp: 90, loc: 180 }
  },
  {
    title: 'String Immutability',
    code: 's = "hello"\ns[0] = "H"',
    options: [
      { text: 'Changes s to "Hello"', correct: false },
      { text: 'TypeError — strings are immutable', correct: true },
      { text: 'Need to use s.replace()', correct: false },
    ],
    reward: { xp: 40, loc: 80 }
  },
  {
    title: 'Scope Trap',
    code: 'x = 10\ndef foo():\n    x += 1\n    return x',
    options: [
      { text: 'Returns 11', correct: false },
      { text: 'UnboundLocalError — need global or nonlocal', correct: true },
      { text: 'Returns 10', correct: false },
    ],
    reward: { xp: 70, loc: 140 }
  },
  {
    title: 'Chained Comparison',
    code: 'x = 5\nprint(1 < x > 3)',
    options: [
      { text: 'Syntax error', correct: false },
      { text: 'True — Python chains comparisons', correct: true },
      { text: 'False', correct: false },
    ],
    reward: { xp: 50, loc: 100 }
  },
  {
    title: 'Dictionary Iteration',
    code: 'data = {"a": 1, "b": 2}\nfor k, v in data:\n    print(k, v)',
    options: [
      { text: 'Prints key-value pairs', correct: false },
      { text: 'Need data.items() to unpack pairs', correct: true },
      { text: 'Need enumerate(data)', correct: false },
    ],
    reward: { xp: 60, loc: 120 }
  },

  // --- SQL ---
  {
    title: 'SQL Injection',
    code: 'query = "SELECT * FROM users\n  WHERE name = \'" + input + "\'";',
    options: [
      { text: 'Simple and efficient', correct: false },
      { text: 'Use parameterized queries', correct: true },
      { text: 'Just escape the quotes', correct: false },
    ],
    reward: { xp: 100, loc: 200 }
  },
  {
    title: 'SELECT *',
    code: 'SELECT * FROM orders\n  JOIN products\n  JOIN users;',
    options: [
      { text: 'Gets all the data we need', correct: false },
      { text: 'Select only needed columns', correct: true },
      { text: 'Add more JOINs', correct: false },
    ],
    reward: { xp: 40, loc: 80 }
  },
  {
    title: 'Missing WHERE',
    code: 'UPDATE users\n  SET role = \'admin\';',
    options: [
      { text: 'Promotes one user to admin', correct: false },
      { text: 'Updates ALL rows — needs WHERE clause', correct: true },
      { text: 'Should use INSERT instead', correct: false },
    ],
    reward: { xp: 120, loc: 250 }
  },
  {
    title: 'NULL Comparison',
    code: 'SELECT * FROM users\n  WHERE email != NULL;',
    options: [
      { text: 'Returns users with emails', correct: false },
      { text: 'Use IS NOT NULL instead', correct: true },
      { text: 'Use <> NULL', correct: false },
    ],
    reward: { xp: 50, loc: 100 }
  },
  {
    title: 'GROUP BY Error',
    code: 'SELECT name, COUNT(*)\n  FROM orders;',
    options: [
      { text: 'Counts all orders per name', correct: false },
      { text: 'Need GROUP BY name', correct: true },
      { text: 'Use SUM instead', correct: false },
    ],
    reward: { xp: 60, loc: 120 }
  },
  {
    title: 'N+1 Query',
    code: 'for user in users:\n  db.query("SELECT * FROM orders\n    WHERE user_id=" + user.id)',
    options: [
      { text: 'Gets orders for each user', correct: false },
      { text: 'Use a single JOIN query instead', correct: true },
      { text: 'Add an index', correct: false },
    ],
    reward: { xp: 90, loc: 180 }
  },
  {
    title: 'DELETE Without WHERE',
    code: 'DELETE FROM sessions;',
    options: [
      { text: 'Cleans up old sessions', correct: false },
      { text: 'Deletes ALL sessions — add WHERE clause', correct: true },
      { text: 'Use DROP TABLE instead', correct: false },
    ],
    reward: { xp: 110, loc: 220 }
  },
  {
    title: 'Implicit Cross Join',
    code: 'SELECT * FROM a, b\n  WHERE a.x = 1;',
    options: [
      { text: 'Filters table a correctly', correct: false },
      { text: 'Creates a cross join — use explicit JOIN', correct: true },
      { text: 'Need to alias the tables', correct: false },
    ],
    reward: { xp: 70, loc: 140 }
  },
  {
    title: 'LIKE Without Index',
    code: 'SELECT * FROM products\n  WHERE name LIKE \'%widget%\';',
    options: [
      { text: 'Fast text search', correct: false },
      { text: 'Leading wildcard prevents index use', correct: true },
      { text: 'Use = instead of LIKE', correct: false },
    ],
    reward: { xp: 80, loc: 160 }
  },
  {
    title: 'OR vs UNION',
    code: 'SELECT * FROM logs\n  WHERE status = \'error\'\n  OR user_id = 42;',
    options: [
      { text: 'Efficient query', correct: false },
      { text: 'OR can prevent index use — consider UNION', correct: true },
      { text: 'Use AND instead', correct: false },
    ],
    reward: { xp: 70, loc: 140 }
  },
];

export function maybeSpawnCodeReview(state) {
  // Don't spawn if disabled
  if (!state.codeReviewsEnabled) return false;

  // Don't spawn during nap
  if (state.napUntil && Date.now() < state.napUntil) return false;

  // Cap queue at 5
  if (!state.codeReviewQueue) state.codeReviewQueue = [];
  if (state.codeReviewQueue.length >= 5) return false;

  // Spawn chance based on Code Review skill
  let baseChance = 0.005; // 0.5% per tick
  const debugChance = getDebugCodeReviewChance();
  if (debugChance !== null) baseChance = debugChance;

  const skillBonus = state.skills.codeReview * 0.01; // +1% per skill level
  const chance = baseChance + skillBonus;

  if (Math.random() < chance) {
    const question = CODE_REVIEW_QUESTIONS[Math.floor(Math.random() * CODE_REVIEW_QUESTIONS.length)];
    state.codeReviewQueue.push({ question });
    return true;
  }
  return false;
}

export function startCodeReview(state) {
  if (!state.codeReviewQueue || state.codeReviewQueue.length === 0) return false;
  if (state.codeReview) return false; // one already active

  const queued = state.codeReviewQueue.shift();
  state.codeReview = {
    question: queued.question,
    startTime: Date.now(),
    timeLimit: 30000, // 30 seconds
  };
  return true;
}

export function answerCodeReview(state, answerIndex) {
  if (!state.codeReview) return null;

  const { question } = state.codeReview;
  const correct = question.options[answerIndex].correct;

  let result = {
    correct,
    xp: 0,
    loc: 0,
    bonus: 1,
  };

  if (correct) {
    // Time bonus: faster = better
    const elapsed = Date.now() - state.codeReview.startTime;
    const timeBonus = Math.max(1, 2 - elapsed / state.codeReview.timeLimit);
    result.bonus = timeBonus;

    // Level scaling: rewards grow with player level
    const levelScale = 1 + (state.level - 1) * 0.15;

    result.xp = Math.floor(question.reward.xp * timeBonus * levelScale);
    result.loc = Math.floor(question.reward.loc * timeBonus * levelScale);

    state.xp += result.xp;
    state.loc += result.loc;
    state.totalLoc += result.loc;
  }

  state.codeReview = null;
  return result;
}

export function skipCodeReview(state) {
  state.codeReview = null;
}

export function isCodeReviewActive(state) {
  if (!state.codeReview) return false;

  // Check if time expired
  if (Date.now() - state.codeReview.startTime > state.codeReview.timeLimit) {
    state.codeReview = null;
    return false;
  }

  return true;
}
