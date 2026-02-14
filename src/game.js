import { decayNeeds } from './tamagotchi.js';
import { getAutoRate } from './upgrades.js';
import { maybeSpawnEnemy, enemyDamage, initEnemyTimer } from './enemies.js';
import { checkLevelUp } from './rpg.js';
import { saveGame, loadGame } from './save.js';
import { maybeSpawnCodeReview } from './code-review.js';

export function createDefaultState() {
  return {
    loc: 0,
    totalLoc: 0,
    needs: { hunger: 100, energy: 100, happiness: 100, caffeine: 0 },
    upgrades: {},
    level: 1,
    xp: 0,
    skillPoints: 0,
    skills: { typingSpeed: 0, codeReview: 0, bugResistance: 0, caffeineMetabolism: 0 },
    equipment: { keyboard: null, chair: null, monitor: null },
    enemy: null,
    enemyTimer: 0,
    nextEnemyAt: 0,
    napUntil: 0,
    tickCount: 0,
    prestigeCount: 0,
    prestigeMultiplier: 1,
    onboardingDone: false,
    // Code Review
    codeReview: null,
    codeReviewsEnabled: false, // Toggle for code review spawning
    // Career Progression
    careerStage: 'junior',
    projects: 0,
    products: 0,
    companyValue: 0,
    teamSize: 1,
    teams: 1,
    employees: 1,
  };
}

export function initState() {
  const saved = loadGame();
  if (saved) {
    // Merge with defaults so new keys are present
    const def = createDefaultState();
    return { ...def, ...saved, needs: { ...def.needs, ...saved.needs }, skills: { ...def.skills, ...saved.skills }, equipment: { ...def.equipment, ...saved.equipment }, upgrades: { ...saved.upgrades } };
  }
  return createDefaultState();
}

export function tick(state, onUpdate) {
  state.tickCount += 1;

  // Nap check
  const napping = state.napUntil && Date.now() < state.napUntil;

  // 1. Decay needs
  decayNeeds(state);

  // 2. Auto-click output
  if (!napping) {
    const autoRate = getAutoRate(state);
    state.loc += autoRate;
    state.totalLoc += autoRate;
  }

  // 3. Maybe spawn enemy
  maybeSpawnEnemy(state);

  // 4. Enemy damage
  const dmg = enemyDamage(state);

  // 5. Level up
  const leveled = checkLevelUp(state);

  // 6. Maybe spawn code review
  const codeReviewSpawned = maybeSpawnCodeReview(state);

  // 7. Auto-save every 30 ticks
  if (state.tickCount % 30 === 0) {
    saveGame(state);
  }

  // 8. Return info for UI
  return { napping, dmg, leveled, codeReviewSpawned };
}

export function startGameLoop(state, onTick) {
  initEnemyTimer(state);
  return setInterval(() => {
    const info = tick(state, onTick);
    onTick(info);
  }, 1000);
}
