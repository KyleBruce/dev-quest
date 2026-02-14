// Debug/Testing Mode

export const DEBUG_MODE = false; // Set to true for testing

export function applyDebugModifiers(state) {
  if (!DEBUG_MODE) return;

  // Start with more resources for testing
  if (state.loc < 1000 && state.totalLoc === 0) {
    state.loc = 5000;
    state.totalLoc = 5000;
  }
}

export function createDebugPanel(state, updateCallback) {
  if (!DEBUG_MODE) return;

  const panel = document.createElement('div');
  panel.id = 'debug-panel';
  panel.innerHTML = `
    <div class="debug-header">🐛 Debug Mode</div>
    <div class="debug-buttons">
      <button id="debug-level-up">+10 Levels</button>
      <button id="debug-add-loc">+10k LoC</button>
      <button id="debug-code-review">Trigger Code Review</button>
      <button id="debug-add-xp">+1000 XP</button>
      <button id="debug-max-needs">Max Needs</button>
      <button id="debug-add-skillpoints">+5 Skill Points</button>
    </div>
  `;
  document.getElementById('app').appendChild(panel);

  // Wire up debug buttons
  document.getElementById('debug-level-up').addEventListener('click', () => {
    state.level += 10;
    state.skillPoints += 10;
    updateCallback();
  });

  document.getElementById('debug-add-loc').addEventListener('click', () => {
    state.loc += 10000;
    state.totalLoc += 10000;
    updateCallback();
  });

  document.getElementById('debug-code-review').addEventListener('click', () => {
    // Manually add a code review to the queue
    if (!state.codeReviewQueue) state.codeReviewQueue = [];
    const questions = [
      { title: 'Debug Test', code: 'int x = 0;\nprintf("%d", x);', options: [
        { text: 'Ship it!', correct: false },
        { text: 'Looks correct', correct: true },
        { text: 'Needs malloc', correct: false },
      ], reward: { xp: 50, loc: 100 } }
    ];
    state.codeReviewQueue.push({ question: questions[0] });
    updateCallback();
  });

  document.getElementById('debug-add-xp').addEventListener('click', () => {
    state.xp += 1000;
    updateCallback();
  });

  document.getElementById('debug-max-needs').addEventListener('click', () => {
    state.needs.hunger = 100;
    state.needs.energy = 100;
    state.needs.happiness = 100;
    state.needs.caffeine = 50;
    updateCallback();
  });

  document.getElementById('debug-add-skillpoints').addEventListener('click', () => {
    state.skillPoints += 5;
    updateCallback();
  });
}

// Faster XP requirements for testing
export function getDebugXpForLevel(level) {
  if (!DEBUG_MODE) return null;
  return Math.floor(50 * Math.pow(1.15, level - 1)); // Much faster than normal
}

// Higher code review spawn rate for testing
export function getDebugCodeReviewChance() {
  if (!DEBUG_MODE) return null;
  return 0.15; // 15% per tick instead of 2%
}
