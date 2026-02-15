import './style.css';
import { initState, startGameLoop, calculateOfflineEarnings } from './game.js';
import { doClick, canClick } from './clicker.js';
import { feedItem } from './tamagotchi.js';
import { buyUpgrade } from './upgrades.js';
import { hitEnemy } from './enemies.js';
import { spendSkillPoint, buyEquipment } from './rpg.js';
import { doPrestige } from './prestige.js';
import { saveGame } from './save.js';
import { sfxClick } from './sound.js';
import { initUI, updateAll, updateEnemy, showClickFloat, showEnemyHit, showEnemyDefeated, showEnemyDamage, showLevelUp, fullRerender, showCodeReviewResult, showStandupResult, showWelcomeBack, showMilestone, updateEnemyWarning } from './ui.js';
import { shouldShowOnboarding, startOnboarding } from './onboarding.js';
import { answerCodeReview, skipCodeReview, startCodeReview } from './code-review.js';
import { startStandup, submitStandup, skipStandup, toggleBuzzword } from './standup.js';
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
  startCodeReview: () => startCodeReview(state),
  startStandup: () => startStandup(state),
  submitStandup: () => submitStandup(state),
  skipStandup: () => skipStandup(state),
  toggleBuzzword: (i) => toggleBuzzword(state, i),
  promote: () => promote(state),
  hireTeamMember: () => hireTeamMember(state),
};

// Init UI
initUI(state, handlers);

// Create debug panel
createDebugPanel(state, updateAll);

// Check for offline earnings
const offlineEarnings = calculateOfflineEarnings(state);
if (offlineEarnings) {
  showWelcomeBack(offlineEarnings);
}

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

// Code review start button
document.getElementById('code-review-btn').addEventListener('click', () => {
  if (startCodeReview(state)) {
    updateAll();
  }
});

// Standup start button
document.getElementById('standup-btn').addEventListener('click', () => {
  if (startStandup(state)) {
    updateAll();
  }
});

// Standup skip button
document.getElementById('standup-skip').addEventListener('click', () => {
  skipStandup(state);
  updateAll();
});

// Standup submit button
document.getElementById('standup-submit').addEventListener('click', () => {
  const result = submitStandup(state);
  showStandupResult(result);
  updateAll();
});

// Game loop
startGameLoop(state, (info) => {
  updateAll();
  if (info.leveled) { showLevelUp(); fullRerender(); }
  if (info.dmg > 0) showEnemyDamage();
  if (info.newMilestones) {
    for (const m of info.newMilestones) showMilestone(m);
  }
  updateEnemyWarning(info.enemyWarning);
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
