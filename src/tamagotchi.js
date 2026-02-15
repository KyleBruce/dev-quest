export const NEEDS = ['hunger', 'energy', 'happiness', 'caffeine'];

const DECAY = {
  hunger: 0.6,
  energy: 0.6,
  happiness: 0.6,
  caffeine: 2,
};

export const FEED_ITEMS = [
  // Hunger
  { id: 'pizza', need: 'hunger', amount: 40, cost: 10, emoji: '🍕', label: 'Pizza', minLevel: 1 },
  { id: 'ramen', need: 'hunger', amount: 25, cost: 5, emoji: '🍜', label: 'Ramen', minLevel: 1 },
  { id: 'energybar', need: 'hunger', amount: 15, cost: 3, emoji: '🍫', label: 'Energy Bar', minLevel: 1 },
  // Energy
  { id: 'coffee', need: 'energy', amount: 30, cost: 5, emoji: '☕', label: 'Coffee', alsoCaffeine: 20, minLevel: 1 },
  { id: 'nap', need: 'energy', amount: 50, cost: 0, emoji: '😴', label: 'Nap', napTime: 15, minLevel: 1 },
  { id: 'redbull', need: 'energy', amount: 40, cost: 8, emoji: '🥤', label: 'Red Bull', alsoCaffeine: 35, minLevel: 1 },
  // Happiness
  { id: 'memes', need: 'happiness', amount: 25, cost: 3, emoji: '😂', label: 'Memes', minLevel: 1 },
  { id: 'duck', need: 'happiness', amount: 5, cost: 0, emoji: '🦆', label: 'Pet Rubber Duck', minLevel: 1 },
  { id: 'fridaydeploy', need: 'happiness', amount: 50, cost: 15, emoji: '🚀', label: 'Friday Deploy', minLevel: 1 },
  // Caffeine only
  { id: 'espresso', need: 'caffeine', amount: 45, cost: 7, emoji: '☕', label: 'Espresso Shot', minLevel: 1 },
  // Level-gated
  { id: 'matcha', need: 'energy', amount: 35, cost: 6, emoji: '🍵', label: 'Matcha Latte', alsoCaffeine: 25, minLevel: 5 },
  { id: 'pizzaparty', need: 'happiness', amount: 60, cost: 25, emoji: '🎉', label: 'Pizza Party', minLevel: 10 },
  { id: 'nappod', need: 'energy', amount: 80, cost: 12, emoji: '🛌', label: 'Nap Pod', napTime: 8, minLevel: 20 },
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

    // Split keyboard: -5% energy decay
    if (need === 'energy' && state.equipment.keyboard === 'split') rate *= 0.95;

    // Herman Miller: -20% happiness decay, -15% energy decay
    if (need === 'happiness' && state.equipment.chair === 'herman') rate *= 0.80;
    if (need === 'energy' && state.equipment.chair === 'herman') rate *= 0.85;

    // Mental Fortitude skill: -5% all decay per level
    if (state.skills.mentalFortitude > 0) rate *= 1 - state.skills.mentalFortitude * 0.05;

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
