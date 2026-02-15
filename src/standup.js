// Standup Roulette Minigame
import { ENEMY_DEFS } from './enemies.js';

export const STANDUP_PROMPTS = [
  {
    task: 'Refactored the authentication module',
    buzzwords: ['fixed bugs', 'updated tests', 'added logging', 'leverage synergies', 'aligned stakeholders', 'circled back'],
  },
  {
    task: 'Fixed a production outage at 3am',
    buzzwords: ['checked logs', 'restarted services', 'wrote postmortem', 'synergized efforts', 'pivoted strategy', 'drove consensus'],
  },
  {
    task: 'Reviewed 12 pull requests',
    buzzwords: ['provided feedback', 'caught a bug', 'suggested improvements', 'shifted paradigm', 'unlocked value', 'disrupted workflow'],
  },
  {
    task: 'Updated the CI/CD pipeline',
    buzzwords: ['added caching', 'fixed flaky tests', 'optimized flow', 'blue-sky thinking', 'boiled the ocean', 'moved goalposts'],
  },
  {
    task: 'Migrated database to new schema',
    buzzwords: ['ran migrations', 'wrote backfills', 'tested rollback', 'ecosystem leverage', 'ideated solutions', 'created bandwidth'],
  },
  {
    task: 'Onboarded a new team member',
    buzzwords: ['paired programming', 'wrote docs', 'shared context', 'core competency', 'proactive synergy', 'holistic approach'],
  },
  {
    task: 'Debugged memory leak in production',
    buzzwords: ['profiled heap', 'found the leak', 'deployed fix', 'thought leadership', 'paradigm shift', 'deep dive'],
  },
  {
    task: 'Shipped the new search feature',
    buzzwords: ['indexed data', 'wrote tests', 'updated API', 'cross-pollinated', 'leveraged learnings', 'actioned insights'],
  },
  {
    task: 'Resolved merge conflicts in release',
    buzzwords: ['resolved conflicts', 'ran CI', 'merged cleanly', 'circle back offline', 'value-add delta', 'strategic alignment'],
  },
  {
    task: 'Upgraded framework to latest version',
    buzzwords: ['bumped deps', 'ran test suite', 'fixed breaking changes', 'double-clicked on that', 'net-net impact', 'radical candor'],
  },
  {
    task: 'Set up monitoring dashboards',
    buzzwords: ['added alerts', 'grafana panels', 'tracked SLOs', 'open the kimono', 'moved the cheese', 'low-hanging fruit'],
  },
  {
    task: 'Wrote API documentation',
    buzzwords: ['documented endpoints', 'added examples', 'generated types', 'synergy matrix', 'growth hacking', 'ideation session'],
  },
  {
    task: 'Optimized slow database queries',
    buzzwords: ['added indexes', 'analyzed EXPLAIN', 'fixed N+1', 'bandwidth creation', 'boiled ocean', 'vertical integration'],
  },
  {
    task: 'Implemented rate limiting',
    buzzwords: ['throttled endpoints', 'wrote middleware', 'added backoff', 'thought partner', 'disrupted space', 'north star metric'],
  },
  {
    task: 'Fixed accessibility issues',
    buzzwords: ['added aria labels', 'keyboard navigation', 'color contrast', 'ecosystem play', 'synergistic pivot', '360 review'],
  },
];

export function maybeSpawnStandup(state) {
  if (state.napUntil && Date.now() < state.napUntil) return false;

  if (!state.standupQueue) state.standupQueue = [];
  if (state.standupQueue.length >= 3) return false;

  const chance = 0.015; // 1.5% per tick
  if (Math.random() < chance) {
    const prompt = STANDUP_PROMPTS[Math.floor(Math.random() * STANDUP_PROMPTS.length)];
    state.standupQueue.push({ prompt });
    return true;
  }
  return false;
}

export function startStandup(state) {
  if (!state.standupQueue || state.standupQueue.length === 0) return false;
  if (state.standup) return false; // one already active

  const queued = state.standupQueue.shift();
  state.standup = {
    prompt: queued.prompt,
    startTime: Date.now(),
    timeLimit: 15000,
    selected: [],
  };
  return true;
}

export function toggleBuzzword(state, index) {
  if (!state.standup) return;
  const sel = state.standup.selected;
  const pos = sel.indexOf(index);
  if (pos === -1) {
    sel.push(index);
  } else {
    sel.splice(pos, 1);
  }
}

export function submitStandup(state) {
  if (!state.standup) return null;

  const count = state.standup.selected.length;
  const levelScale = 1 + (state.level - 1) * 0.1;
  const baseXp = 30;
  const baseLoc = 60;

  let mult;
  let managerSpawned = false;
  let message;

  if (count === 0) {
    mult = 0;
    message = 'Awkward silence.';
  } else if (count === 1) {
    mult = 0.5;
    message = 'Brief but acceptable.';
  } else if (count <= 3) {
    mult = 1;
    message = 'Perfect standup!';
  } else if (count === 4) {
    mult = 0.5;
    message = 'Getting a bit wordy...';
  } else {
    mult = 0;
    message = 'Too much corporate speak!';
    // Spawn manager enemy
    if (!state.enemy) {
      const managerDef = ENEMY_DEFS[0]; // Middle Manager
      state.enemy = { ...managerDef, currentHp: managerDef.hp };
      managerSpawned = true;
    }
  }

  const xp = Math.floor(baseXp * mult * levelScale);
  const loc = Math.floor(baseLoc * mult * levelScale);

  state.xp += xp;
  state.loc += loc;
  state.totalLoc += loc;

  state.standup = null;

  return { count, xp, loc, managerSpawned, message };
}

export function skipStandup(state) {
  state.standup = null;
}

export function isStandupActive(state) {
  if (!state.standup) return false;

  if (Date.now() - state.standup.startTime > state.standup.timeLimit) {
    state.standup = null;
    return false;
  }

  return true;
}
