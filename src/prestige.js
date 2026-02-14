const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Haskell',
  'Kotlin', 'Swift', 'Zig', 'Elixir', 'C#', 'Clojure', 'Scala',
  'Ruby', 'Lua', 'OCaml', 'Erlang', 'Nim', 'Crystal', 'Julia',
];

// Minimum totalLoc to prestige (scales with prestige count)
export function getPrestigeCost(prestigeCount) {
  return Math.floor(50000 * Math.pow(2.0, prestigeCount));
}

// Multiplier from prestige: each prestige gives +50% compounding
export function getPrestigeMultiplier(prestigeCount) {
  return Math.pow(1.5, prestigeCount);
}

export function getPrestigeLanguage(prestigeCount) {
  return LANGUAGES[prestigeCount % LANGUAGES.length];
}

export function canPrestige(state) {
  return state.totalLoc >= getPrestigeCost(state.prestigeCount || 0);
}

export function doPrestige(state) {
  if (!canPrestige(state)) return false;

  state.prestigeCount = (state.prestigeCount || 0) + 1;
  state.prestigeMultiplier = getPrestigeMultiplier(state.prestigeCount);

  // Reset progress
  state.loc = 0;
  state.totalLoc = 0;
  state.needs = { hunger: 100, energy: 100, happiness: 100, caffeine: 0 };
  state.upgrades = {};
  state.level = 1;
  state.xp = 0;
  state.skillPoints = 0;
  state.skills = { typingSpeed: 0, codeReview: 0, bugResistance: 0, caffeineMetabolism: 0 };
  state.equipment = { keyboard: null, chair: null, monitor: null };
  state.enemy = null;
  state.enemyTimer = 0;
  state.nextEnemyAt = 0;
  state.napUntil = 0;
  state.tickCount = 0;

  // Reset career progression
  state.careerStage = 'junior';
  state.projects = 0;
  state.products = 0;
  state.companyValue = 0;
  state.teamSize = 1;
  state.teams = 1;
  state.employees = 1;

  return true;
}
