export function getClickPower(state) {
  let power = 2;

  // Keyboard equipment bonus
  const kb = state.equipment.keyboard;
  if (kb === 'mechanical') power *= 1.2;
  else if (kb === 'ergonomic') power *= 1.1;

  // Monitor bonus (all output)
  const mon = state.equipment.monitor;
  if (mon === 'ultrawide') power *= 1.15;
  else if (mon === 'triple') power *= 1.25;

  // Caffeine bonus: +50% above 70
  if (state.needs.caffeine > 70) power *= 1.5;

  // Hunger penalty: halved below 30
  if (state.needs.hunger < 20) power *= 0.5;

  // Typing Speed skill: +10% per level
  power *= 1 + state.skills.typingSpeed * 0.1;

  // Prestige multiplier
  power *= state.prestigeMultiplier || 1;

  return power;
}

export function canClick(state) {
  return state.needs.energy >= 5;
}

export function doClick(state) {
  if (!canClick(state)) return 0;
  const power = getClickPower(state);
  state.loc += power;
  state.totalLoc += power;
  return power;
}
