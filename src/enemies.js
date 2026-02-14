export const ENEMY_DEFS = [
  { id: 'manager',    name: 'Middle Manager',    emoji: '👔', hp: 5,  dps: 10, xp: 15,  flavor: 'Requests a meeting about the meeting.' },
  { id: 'it',         name: 'IT Department',      emoji: '🖥️', hp: 10, dps: 20, xp: 30,  flavor: 'Your access has been revoked.' },
  { id: 'scopecreep', name: 'Scope Creep Goblin', emoji: '👺', hp: 8,  dps: 15, xp: 25,  flavor: 'Just one more feature...' },
  { id: 'legacy',     name: 'Legacy Code Dragon', emoji: '🐉', hp: 30, dps: 50, xp: 100, flavor: 'Written in COBOL. By a wizard. In 1987.' },
  { id: 'deploy',     name: 'Deployment Demon',   emoji: '😈', hp: 15, dps: 30, xp: 50,  flavor: 'It worked on my machine.' },
  { id: 'refactorer', name: 'The Refactorer',     emoji: '🔧', hp: 20, dps: 40, xp: 75,  flavor: 'Rewrites your code in Rust. Uninvited.' },
];

const SPAWN_MIN = 30; // seconds
const SPAWN_MAX = 90;

export function maybeSpawnEnemy(state) {
  if (state.enemy) return; // already fighting
  state.enemyTimer = (state.enemyTimer || 0) + 1;
  if (state.enemyTimer < state.nextEnemyAt) return;

  // Pick random enemy, weighted toward easier ones early on
  const pool = ENEMY_DEFS.filter((e) => {
    if (e.id === 'legacy' && state.level < 3) return false;
    if (e.id === 'refactorer' && state.level < 2) return false;
    return true;
  });
  const def = pool[Math.floor(Math.random() * pool.length)];

  state.enemy = {
    ...def,
    currentHp: def.hp,
  };
  state.enemyTimer = 0;
  state.nextEnemyAt = SPAWN_MIN + Math.floor(Math.random() * (SPAWN_MAX - SPAWN_MIN));
}

export function hitEnemy(state) {
  if (!state.enemy) return null;
  state.enemy.currentHp -= 1;
  if (state.enemy.currentHp <= 0) {
    return defeatEnemy(state);
  }
  return null;
}

function defeatEnemy(state) {
  const defeated = state.enemy;
  state.xp += defeated.xp;
  state.enemy = null;
  return defeated;
}

export function enemyDamage(state) {
  if (!state.enemy) return 0;
  let dmg = state.enemy.dps;
  // Bug Resistance skill
  dmg *= 1 - state.skills.bugResistance * 0.1;
  dmg = Math.max(0, dmg);
  state.loc = Math.max(0, state.loc - dmg);
  return dmg;
}

export function initEnemyTimer(state) {
  if (!state.nextEnemyAt) {
    state.nextEnemyAt = SPAWN_MIN + Math.floor(Math.random() * (SPAWN_MAX - SPAWN_MIN));
  }
}
