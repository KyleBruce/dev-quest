export const MILESTONE_DEFS = [
  // LoC milestones
  { id: 'loc_100',    category: 'loc',      threshold: 100,    name: 'Hello World',        desc: 'Write 100 Lines of Code' },
  { id: 'loc_1k',     category: 'loc',      threshold: 1000,   name: 'Script Kiddie',      desc: 'Write 1,000 Lines of Code' },
  { id: 'loc_10k',    category: 'loc',      threshold: 10000,  name: 'Code Monkey',        desc: 'Write 10,000 Lines of Code' },
  { id: 'loc_100k',   category: 'loc',      threshold: 100000, name: 'Software Engineer',  desc: 'Write 100,000 Lines of Code' },
  { id: 'loc_1m',     category: 'loc',      threshold: 1000000, name: 'Code Legend',       desc: 'Write 1,000,000 Lines of Code' },
  // Level milestones
  { id: 'level_5',    category: 'level',    threshold: 5,      name: 'Getting Serious',    desc: 'Reach Level 5' },
  { id: 'level_10',   category: 'level',    threshold: 10,     name: 'Double Digits',      desc: 'Reach Level 10' },
  { id: 'level_20',   category: 'level',    threshold: 20,     name: 'Veteran',            desc: 'Reach Level 20' },
  { id: 'level_50',   category: 'level',    threshold: 50,     name: 'Legendary Dev',      desc: 'Reach Level 50' },
  // Upgrades milestones
  { id: 'upgrades_5',   category: 'upgrades', threshold: 5,    name: 'Team Builder',       desc: 'Buy 5 total upgrades' },
  { id: 'upgrades_25',  category: 'upgrades', threshold: 25,   name: 'Hiring Spree',       desc: 'Buy 25 total upgrades' },
  { id: 'upgrades_100', category: 'upgrades', threshold: 100,  name: 'Corporate Empire',   desc: 'Buy 100 total upgrades' },
  // Prestige milestones
  { id: 'prestige_1', category: 'prestige', threshold: 1,      name: 'Rewriter',           desc: 'Prestige for the first time' },
  // Kill milestones
  { id: 'kills_1',    category: 'kills',    threshold: 1,      name: 'Bug Squasher',       desc: 'Defeat your first enemy' },
  { id: 'kills_10',   category: 'kills',    threshold: 10,     name: 'Exterminator',       desc: 'Defeat 10 enemies' },
  { id: 'kills_50',   category: 'kills',    threshold: 50,     name: 'Bug Genocide',       desc: 'Defeat 50 enemies' },
];

export function getMilestoneValue(state, milestone) {
  switch (milestone.category) {
    case 'loc':      return state.totalLoc || 0;
    case 'level':    return state.level || 1;
    case 'upgrades': {
      let total = 0;
      for (const count of Object.values(state.upgrades || {})) total += count;
      return total;
    }
    case 'prestige': return state.prestigeCount || 0;
    case 'kills':    return state.enemiesDefeated || 0;
    default:         return 0;
  }
}

export function checkMilestones(state) {
  if (!state.milestones) state.milestones = {};
  const newlyAchieved = [];
  for (const def of MILESTONE_DEFS) {
    if (state.milestones[def.id]) continue;
    if (getMilestoneValue(state, def) >= def.threshold) {
      state.milestones[def.id] = Date.now();
      newlyAchieved.push(def);
    }
  }
  return newlyAchieved;
}
