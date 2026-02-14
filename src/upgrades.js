export const UPGRADE_DEFS = [
  { id: 'intern',       baseLoc: 0.5,  baseCost: 15,     emoji: '👶', name: 'Intern',            flavor: 'Writes code. Sometimes correct.' },
  { id: 'stackoverflow', baseLoc: 2,   baseCost: 100,    emoji: '📋', name: 'Stack Overflow',    flavor: 'Copy. Paste. Ship it.' },
  { id: 'claude',       baseLoc: 10,   baseCost: 1000,   emoji: '🤖', name: 'Claude Code',       flavor: 'Writes code while you sleep.' },
  { id: 'senior',       baseLoc: 25,   baseCost: 5000,   emoji: '🧓', name: 'Senior Dev',        flavor: 'Refactors everything. Twice.' },
  { id: 'opensource',   baseLoc: 100,  baseCost: 25000,  emoji: '🌐', name: 'Open Source Army',  flavor: '10,000 contributors. 3 maintainers.' },
  { id: 'datacenter',   baseLoc: 500,  baseCost: 100000, emoji: '🏢', name: 'AI Datacenter',     flavor: "The cloud is just someone else's GPU." },
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

  // Hunger penalty
  if (state.needs.hunger < 30) total *= 0.5;

  // Prestige multiplier
  total *= state.prestigeMultiplier || 1;

  return total;
}

export function buyUpgrade(state, upgradeId) {
  const def = UPGRADE_DEFS.find((u) => u.id === upgradeId);
  if (!def) return false;
  const owned = state.upgrades[def.id] || 0;
  let cost = getUpgradeCost(def, owned);

  // Happiness penalty: 2x cost below 20
  if (state.needs.happiness < 20) cost *= 2;

  if (state.loc < cost) return false;
  state.loc -= cost;
  state.upgrades[def.id] = owned + 1;
  return true;
}

export function getEffectiveCost(state, def) {
  let cost = getUpgradeCost(def, state.upgrades[def.id] || 0);
  if (state.needs.happiness < 20) cost *= 2;
  return Math.floor(cost);
}
