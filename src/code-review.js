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
