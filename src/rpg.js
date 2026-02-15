export const TITLES = [
  { level: 1, title: 'Junior Dev' },
  { level: 5, title: 'Mid Dev' },
  { level: 10, title: 'Senior Dev' },
  { level: 20, title: 'Staff Engineer' },
  { level: 35, title: 'Principal Engineer' },
  { level: 50, title: 'CTO' },
  { level: 75, title: 'Tech Demigod' },
];

export const SKILL_DEFS = [
  { id: 'typingSpeed',       name: 'Typing Speed',       emoji: '⌨️', desc: '+10% click power per level', minLevel: 1 },
  { id: 'codeReview',        name: 'Automation',         emoji: '🤖', desc: '+10% auto-output per level', minLevel: 1 },
  { id: 'bugResistance',     name: 'Bug Resistance',     emoji: '🛡️', desc: 'Enemies deal 10% less damage per level', minLevel: 1 },
  { id: 'caffeineMetabolism', name: 'Caffeine Metabolism', emoji: '☕', desc: 'Caffeine decays 15% slower per level', minLevel: 1 },
  { id: 'gitFu',             name: 'Git Fu',             emoji: '🥋', desc: 'Enemies spawn 5% slower per level', minLevel: 10 },
  { id: 'mentalFortitude',   name: 'Mental Fortitude',   emoji: '🧠', desc: 'All needs decay 5% slower per level', minLevel: 20 },
];

export const EQUIPMENT_DEFS = {
  keyboard: [
    { id: 'mechanical', name: 'Mechanical Keyboard', emoji: '⌨️', cost: 50,   desc: '+20% click power', minLevel: 1 },
    { id: 'ergonomic',  name: 'Ergonomic Keyboard',  emoji: '🎹', cost: 80,   desc: '+10% clicks, -10% energy decay', minLevel: 1 },
    { id: 'split',      name: 'Split Keyboard',      emoji: '⌨️', cost: 200,  desc: '+25% click power, -5% energy decay', minLevel: 5 },
  ],
  chair: [
    { id: 'gaming',   name: 'Gaming Chair',  emoji: '🪑', cost: 120,  desc: '-15% happiness decay', minLevel: 1 },
    { id: 'standing', name: 'Standing Desk',  emoji: '🧍', cost: 150,  desc: '-10% energy decay', minLevel: 1 },
    { id: 'herman',   name: 'Herman Miller',  emoji: '💺', cost: 500,  desc: '-20% happiness decay, -15% energy decay', minLevel: 10 },
  ],
  monitor: [
    { id: 'ultrawide', name: 'Ultrawide Monitor', emoji: '🖥️', cost: 300,  desc: '+15% all output', minLevel: 1 },
    { id: 'triple',    name: 'Triple Monitor',    emoji: '🖥️', cost: 800,  desc: '+25% all output', minLevel: 1 },
    { id: 'vr',        name: 'VR Headset',        emoji: '🥽', cost: 2000, desc: '+35% all output, +10% click power', minLevel: 35 },
  ],
};

import { DEBUG_MODE, getDebugXpForLevel } from './debug.js';

export function xpForLevel(level) {
  const debugXp = getDebugXpForLevel(level);
  if (debugXp !== null) return debugXp;
  return Math.floor(100 * Math.pow(1.2, level - 1));
}

export function checkLevelUp(state) {
  const needed = xpForLevel(state.level);
  let leveled = false;
  while (state.xp >= needed && state.xp >= xpForLevel(state.level)) {
    state.xp -= xpForLevel(state.level);
    state.level += 1;
    state.skillPoints += 1;
    leveled = true;
  }
  return leveled;
}

export function getTitle(level) {
  let title = TITLES[0].title;
  for (const t of TITLES) {
    if (level >= t.level) title = t.title;
  }
  return title;
}

export function spendSkillPoint(state, skillId) {
  if (state.skillPoints <= 0) return false;
  if (!(skillId in state.skills)) return false;
  state.skills[skillId] += 1;
  state.skillPoints -= 1;
  return true;
}

export function buyEquipment(state, slot, itemId) {
  const items = EQUIPMENT_DEFS[slot];
  if (!items) return false;
  const item = items.find((i) => i.id === itemId);
  if (!item) return false;
  if (state.equipment[slot] === itemId) return false; // already equipped
  if (state.loc < item.cost) return false;
  state.loc -= item.cost;
  state.equipment[slot] = itemId;
  return true;
}
