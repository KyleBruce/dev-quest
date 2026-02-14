// Code Review Minigame

const CODE_REVIEW_QUESTIONS = [
  {
    title: 'Missing Null Check',
    code: 'function getUser(id) {\n  return users[id].name;\n}',
    options: [
      { text: 'Ship it!', correct: false },
      { text: 'Add null check for users[id]', correct: true },
      { text: 'Use var instead of function', correct: false },
    ],
    reward: { xp: 50, loc: 100 }
  },
  {
    title: 'Infinite Loop',
    code: 'let i = 0;\nwhile (i < 10) {\n  console.log(i);\n}',
    options: [
      { text: 'Looks good', correct: false },
      { text: 'Missing i++ increment', correct: true },
      { text: 'Should use for loop', correct: false },
    ],
    reward: { xp: 40, loc: 80 }
  },
  {
    title: 'Async/Await Error',
    code: 'function loadData() {\n  const data = await fetch(url);\n  return data;\n}',
    options: [
      { text: 'Perfect code', correct: false },
      { text: 'Function must be async', correct: true },
      { text: 'Should use .then() instead', correct: false },
    ],
    reward: { xp: 60, loc: 120 }
  },
  {
    title: 'Memory Leak',
    code: 'setInterval(() => {\n  const data = fetchLargeData();\n  process(data);\n}, 1000);',
    options: [
      { text: 'No issues here', correct: false },
      { text: 'Should store interval ID to clear it', correct: true },
      { text: 'Use setTimeout instead', correct: false },
    ],
    reward: { xp: 70, loc: 150 }
  },
  {
    title: 'Race Condition',
    code: 'let count = 0;\narray.forEach(async item => {\n  count += await process(item);\n});',
    options: [
      { text: 'LGTM', correct: false },
      { text: 'forEach ignores async, use for...of', correct: true },
      { text: 'count should be var', correct: false },
    ],
    reward: { xp: 80, loc: 200 }
  },
  {
    title: 'SQL Injection',
    code: 'const query = `SELECT * FROM users\n  WHERE name = "${userName}"`;\ndb.exec(query);',
    options: [
      { text: 'Approve PR', correct: false },
      { text: 'Use parameterized query', correct: true },
      { text: 'Add semicolon at end', correct: false },
    ],
    reward: { xp: 100, loc: 250 }
  },
  {
    title: 'Type Coercion Bug',
    code: 'function add(a, b) {\n  return a + b;\n}\nadd("5", 3); // expects 8',
    options: [
      { text: 'Works fine', correct: false },
      { text: 'Convert strings to numbers first', correct: true },
      { text: 'Use - instead of +', correct: false },
    ],
    reward: { xp: 50, loc: 100 }
  },
];

export function maybeSpawnCodeReview(state) {
  // Don't spawn during nap or if one is active
  if (state.napUntil && Date.now() < state.napUntil) return false;
  if (state.codeReview) return false;

  // Spawn chance based on Code Review skill
  const baseChance = 0.02; // 2% per tick
  const skillBonus = state.skills.codeReview * 0.01; // +1% per skill level
  const chance = baseChance + skillBonus;

  if (Math.random() < chance) {
    const question = CODE_REVIEW_QUESTIONS[Math.floor(Math.random() * CODE_REVIEW_QUESTIONS.length)];
    state.codeReview = {
      question,
      startTime: Date.now(),
      timeLimit: 30000, // 30 seconds
    };
    return true;
  }
  return false;
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

    result.xp = Math.floor(question.reward.xp * timeBonus);
    result.loc = Math.floor(question.reward.loc * timeBonus);

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
