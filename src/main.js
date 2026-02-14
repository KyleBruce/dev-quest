import './style.css';
import { initState, startGameLoop } from './game.js';
import { doClick, canClick } from './clicker.js';
import { feedItem } from './tamagotchi.js';
import { buyUpgrade } from './upgrades.js';
import { hitEnemy } from './enemies.js';
import { spendSkillPoint, buyEquipment } from './rpg.js';
import { doPrestige } from './prestige.js';
import { saveGame } from './save.js';
import { sfxClick } from './sound.js';
import { initUI, updateAll, updateEnemy, showClickFloat, showEnemyHit, showEnemyDefeated, showEnemyDamage, showLevelUp, fullRerender, showCodeReviewResult, showCodeReviewSpawned } from './ui.js';
import { shouldShowOnboarding, startOnboarding } from './onboarding.js';
import { answerCodeReview, skipCodeReview } from './code-review.js';
import { promote, hireTeamMember } from './career.js';
import { DEBUG_MODE, applyDebugModifiers, createDebugPanel } from './debug.js';

// Init state
const state = initState();

// Apply debug modifiers
applyDebugModifiers(state);

// Event handlers passed to UI
const handlers = {
  buyUpgrade: (id) => buyUpgrade(state, id),
  feedItem: (id) => feedItem(state, id),
  spendSkillPoint: (id) => spendSkillPoint(state, id),
  buyEquipment: (slot, id) => buyEquipment(state, slot, id),
  prestige: () => doPrestige(state),
  answerCodeReview: (index) => answerCodeReview(state, index),
  promote: () => promote(state),
  hireTeamMember: () => hireTeamMember(state),
};

// Init UI
initUI(state, handlers);

// Create debug panel
createDebugPanel(state, updateAll);

// Main click button
document.getElementById('click-btn').addEventListener('click', () => {
  if (state.napUntil && Date.now() < state.napUntil) return;
  const amount = doClick(state);
  if (amount > 0) {
    sfxClick();
    showClickFloat(amount);
    updateAll();
  }
});

// Enemy fight button
document.getElementById('enemy-btn').addEventListener('click', () => {
  showEnemyHit();
  const defeated = hitEnemy(state);
  updateEnemy();
  if (defeated) {
    showEnemyDefeated(defeated);
    updateAll();
  }
});

// Code review skip button
document.getElementById('code-review-skip').addEventListener('click', () => {
  skipCodeReview(state);
  updateAll();
});

// Game loop
startGameLoop(state, (info) => {
  updateAll();
  if (info.leveled) showLevelUp();
  if (info.dmg > 0) showEnemyDamage();
  if (info.codeReviewSpawned) showCodeReviewSpawned();
});

// Onboarding
if (shouldShowOnboarding(state)) {
  startOnboarding(() => {
    state.onboardingDone = true;
    saveGame(state);
  });
}

// Save on page hide
document.addEventListener('visibilitychange', () => {
  if (document.hidden) saveGame(state);
});

// PWA service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
