export const UPGRADE_DEFS = [
  { id: 'intern',       baseLoc: 0.5,  baseCost: 15,     emoji: '👶', name: 'Intern',            flavor: 'Writes code. Sometimes correct.', minLevel: 1 },
  { id: 'stackoverflow', baseLoc: 2,   baseCost: 100,    emoji: '📋', name: 'Stack Overflow',    flavor: 'Copy. Paste. Ship it.', minLevel: 1 },
  { id: 'devops',       baseLoc: 5,    baseCost: 500,    emoji: '⚙️', name: 'DevOps Pipeline',   flavor: 'Deploys bugs to production automatically.', minLevel: 5 },
  { id: 'claude',       baseLoc: 10,   baseCost: 1000,   emoji: '🤖', name: 'Claude Code',       flavor: 'Writes code while you sleep.', minLevel: 1 },
  { id: 'senior',       baseLoc: 25,   baseCost: 5000,   emoji: '🧓', name: 'Senior Dev',        flavor: 'Refactors everything. Twice.', minLevel: 1 },
  { id: 'codewizard',   baseLoc: 50,   baseCost: 10000,  emoji: '🧙', name: 'Code Wizard',       flavor: 'Conjures features from thin air. Sometimes they work.', minLevel: 10 },
  { id: 'opensource',   baseLoc: 100,  baseCost: 25000,  emoji: '🌐', name: 'Open Source Army',  flavor: '10,000 contributors. 3 maintainers.', minLevel: 1 },
  { id: 'quantum',      baseLoc: 250,  baseCost: 75000,  emoji: '⚛️', name: 'Quantum Computer',  flavor: 'Simultaneously ships and breaks production.', minLevel: 20 },
  { id: 'datacenter',   baseLoc: 500,  baseCost: 100000, emoji: '🏢', name: 'AI Datacenter',     flavor: "The cloud is just someone else's GPU.", minLevel: 1 },
];

const COST_SCALE = 1.15;

export function getUpgradeCost(def, owned) {
  return Math.floor(def.baseCost * Math.pow(COST_SCALE, owned));
}

export function getAutoRate(state) {
  let total = 0;
  for (const def of UPGRADE_DEFS) {
    const count = state.upgrades[def.id] || 0;
    total += def.baseLoc * count;
  }

  // Automation skill: +10% per level
  total *= 1 + state.skills.codeReview * 0.1;

  // Monitor bonus
  const mon = state.equipment.monitor;
  if (mon === 'ultrawide') total *= 1.15;
  else if (mon === 'triple') total *= 1.25;
  else if (mon === 'vr') total *= 1.35;

  // Hunger penalty
  if (state.needs.hunger < 20) total *= 0.5;

  // Prestige multiplier
  total *= state.prestigeMultiplier || 1;

  return total;
}

export function buyUpgrade(state, upgradeId) {
  const def = UPGRADE_DEFS.find((u) => u.id === upgradeId);
  if (!def) return false;
  const owned = state.upgrades[def.id] || 0;
  let cost = getUpgradeCost(def, owned);

  // Happiness penalty: 1.5x cost below 10
  if (state.needs.happiness < 10) cost *= 1.5;

  if (state.loc < cost) return false;
  state.loc -= cost;
  state.upgrades[def.id] = owned + 1;
  return true;
}

export function getEffectiveCost(state, def) {
  let cost = getUpgradeCost(def, state.upgrades[def.id] || 0);
  if (state.needs.happiness < 10) cost *= 1.5;
  return Math.floor(cost);
}
