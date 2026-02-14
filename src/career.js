// Career Progression System

export const CAREER_STAGES = [
  {
    id: 'junior',
    name: 'Junior Dev',
    minLevel: 1,
    currency: 'LoC',
    emoji: '🧑‍💻',
  },
  {
    id: 'senior',
    name: 'Senior Dev',
    minLevel: 10,
    currency: 'Projects',
    emoji: '👨‍💼',
    unlockMessage: 'You can now promote to Senior Dev! Manage a team and work on complete projects.',
  },
  {
    id: 'lead',
    name: 'Tech Lead',
    minLevel: 25,
    currency: 'Products',
    emoji: '🎯',
    unlockMessage: 'Tech Lead unlocked! Oversee multiple teams and ship products.',
  },
  {
    id: 'cto',
    name: 'CTO',
    minLevel: 50,
    currency: 'Company Value',
    emoji: '👑',
    unlockMessage: 'CTO position available! Build your tech empire.',
  },
];

export function getCurrentStage(state) {
  const careerStage = state.careerStage || 'junior';
  return CAREER_STAGES.find(s => s.id === careerStage) || CAREER_STAGES[0];
}

export function getNextStage(state) {
  const current = getCurrentStage(state);
  const currentIndex = CAREER_STAGES.findIndex(s => s.id === current.id);
  if (currentIndex === -1 || currentIndex >= CAREER_STAGES.length - 1) return null;
  return CAREER_STAGES[currentIndex + 1];
}

export function canPromote(state) {
  const next = getNextStage(state);
  if (!next) return false;
  return state.level >= next.minLevel;
}

export function promote(state) {
  if (!canPromote(state)) return false;

  const current = getCurrentStage(state);
  const next = getNextStage(state);

  // Convert currency to next tier
  const conversionRate = getConversionRate(current.id);
  const converted = Math.floor(state.loc / conversionRate);

  // Initialize new currency
  if (!state.projects && next.id === 'senior') {
    state.projects = converted;
    state.teamSize = 1; // Start with yourself
  } else if (!state.products && next.id === 'lead') {
    state.products = converted;
    state.teams = 1;
  } else if (!state.companyValue && next.id === 'cto') {
    state.companyValue = converted;
    state.employees = state.teamSize || 1;
  }

  // Keep some LoC for buying items
  state.loc = Math.floor(state.loc * 0.1);

  // Update career stage
  state.careerStage = next.id;

  // Keep all equipment, skills, upgrades
  return true;
}

function getConversionRate(fromStage) {
  const rates = {
    junior: 10000,  // 10k LoC = 1 Project
    senior: 50000,  // 50k Projects = 1 Product
    lead: 100000,   // 100k Products = 1 Company Value
  };
  return rates[fromStage] || 10000;
}

// Equipment + prestige multiplier for career currency generation
export function getCareerMultiplier(state) {
  let multiplier = 1;
  if (state.equipment.keyboard === 'mechanical') multiplier *= 1.2;
  if (state.equipment.keyboard === 'ergonomic') multiplier *= 1.1;
  if (state.equipment.monitor === 'ultrawide') multiplier *= 1.15;
  if (state.equipment.monitor === 'triple') multiplier *= 1.25;
  multiplier *= state.prestigeMultiplier || 1;
  return multiplier;
}

// Returns { key, currency, rate } for passive career currency generation, or null
export function getCareerRate(state) {
  const stage = getCurrentStage(state);
  const multiplier = getCareerMultiplier(state);

  if (stage.id === 'senior') {
    return { key: 'projects', currency: 'Projects', rate: (state.teamSize || 1) * 0.3 * multiplier };
  } else if (stage.id === 'lead') {
    return { key: 'products', currency: 'Products', rate: (state.teams || 1) * 0.06 * multiplier };
  } else if (stage.id === 'cto') {
    return { key: 'companyValue', currency: 'Company Value', rate: (state.employees || 1) * 0.015 * multiplier };
  }
  return null;
}

export function hireTeamMember(state) {
  const stage = getCurrentStage(state);
  if (stage.id === 'junior') return false;

  const currentSize = state.teamSize || 1;
  const cost = getHireCost(currentSize);

  if (stage.id === 'senior' && state.projects >= cost) {
    state.projects -= cost;
    state.teamSize = currentSize + 1;
    return true;
  } else if (stage.id === 'lead' && state.products >= cost) {
    state.products -= cost;
    state.teams = (state.teams || 1) + 1;
    return true;
  } else if (stage.id === 'cto' && state.companyValue >= cost) {
    state.companyValue -= cost;
    state.employees = (state.employees || 1) + 5;
    return true;
  }

  return false;
}

function getHireCost(currentSize) {
  return Math.floor(10 * Math.pow(1.5, currentSize));
}

export function getHireButtonText(state) {
  const stage = getCurrentStage(state);
  const currentSize = state.teamSize || 1;
  const cost = getHireCost(currentSize);

  if (stage.id === 'senior') {
    return `Hire Developer (${cost} Projects)`;
  } else if (stage.id === 'lead') {
    return `Hire Team (${cost} Products)`;
  } else if (stage.id === 'cto') {
    return `Expand Company (${cost} Value)`;
  }
  return '';
}
