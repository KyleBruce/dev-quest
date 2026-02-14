export const NEEDS = ['hunger', 'energy', 'happiness', 'caffeine'];

const DECAY = {
  hunger: 1,
  energy: 1,
  happiness: 1,
  caffeine: 3,
};

export const FEED_ITEMS = [
  // Hunger
  { id: 'pizza', need: 'hunger', amount: 40, cost: 10, emoji: '🍕', label: 'Pizza' },
  { id: 'ramen', need: 'hunger', amount: 25, cost: 5, emoji: '🍜', label: 'Ramen' },
  { id: 'energybar', need: 'hunger', amount: 15, cost: 3, emoji: '🍫', label: 'Energy Bar' },
  // Energy
  { id: 'coffee', need: 'energy', amount: 30, cost: 5, emoji: '☕', label: 'Coffee', alsoCaffeine: 20 },
  { id: 'nap', need: 'energy', amount: 50, cost: 0, emoji: '😴', label: 'Nap', napTime: 15 },
  { id: 'redbull', need: 'energy', amount: 40, cost: 8, emoji: '🥤', label: 'Red Bull', alsoCaffeine: 35 },
  // Happiness
  { id: 'memes', need: 'happiness', amount: 25, cost: 3, emoji: '😂', label: 'Memes' },
  { id: 'duck', need: 'happiness', amount: 5, cost: 0, emoji: '🦆', label: 'Pet Rubber Duck' },
  { id: 'fridaydeploy', need: 'happiness', amount: 50, cost: 15, emoji: '🚀', label: 'Friday Deploy' },
  // Caffeine only
  { id: 'espresso', need: 'caffeine', amount: 45, cost: 7, emoji: '☕', label: 'Espresso Shot' },
];

export function decayNeeds(state) {
  for (const need of NEEDS) {
    let rate = DECAY[need];

    // Equipment modifiers
    if (need === 'energy' && state.equipment.keyboard === 'ergonomic') rate *= 0.9;
    if (need === 'happiness' && state.equipment.chair === 'gaming') rate *= 0.85;
    if (need === 'energy' && state.equipment.chair === 'standing') rate *= 0.9;

    // Caffeine Metabolism skill
    if (need === 'caffeine') rate *= 1 - state.skills.caffeineMetabolism * 0.15;

    state.needs[need] = Math.max(0, state.needs[need] - rate);
  }
}

export function feedItem(state, itemId) {
  const item = FEED_ITEMS.find((i) => i.id === itemId);
  if (!item) return false;
  if (state.loc < item.cost) return false;

  state.loc -= item.cost;
  state.needs[item.need] = Math.min(100, state.needs[item.need] + item.amount);

  if (item.alsoCaffeine) {
    state.needs.caffeine = Math.min(100, state.needs.caffeine + item.alsoCaffeine);
  }

  // Nap: set a nap timer (handled in game loop)
  if (item.napTime) {
    state.napUntil = Date.now() + item.napTime * 1000;
  }

  return true;
}
