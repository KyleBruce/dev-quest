import { FEED_ITEMS } from './tamagotchi.js';
import { UPGRADE_DEFS, getEffectiveCost, getAutoRate } from './upgrades.js';
import { getClickPower, canClick } from './clicker.js';
import { SKILL_DEFS, EQUIPMENT_DEFS, getTitle, xpForLevel } from './rpg.js';
import { canPrestige, getPrestigeCost, getPrestigeMultiplier, getPrestigeLanguage } from './prestige.js';
import { sfxBuy, sfxFeed, sfxEnemyHit, sfxEnemyDefeat, sfxEnemySpawn, sfxLevelUp, sfxPrestige } from './sound.js';

let state;
let handlers = {};
let lastEnemyId = null;

const CODE_SNIPPETS = [
  'console.log("hello")',
  'if (bugs === 0)',
  'return 42;',
  'npm install',
  'git push --force',
  '// TODO: fix later',
  'const x = await',
  'while (true) {}',
  'catch (e) { }',
  '/** @deprecated */',
  'rm -rf node_modules',
  'docker compose up',
  'SELECT * FROM',
  '.filter(Boolean)',
  'async function*',
  'throw new Error()',
];

export function initUI(gameState, eventHandlers) {
  state = gameState;
  handlers = eventHandlers;
  renderShop();
  renderItems();
  renderSkills();
  renderEquipment();
  renderPrestige();
  setupTabs();
  updateAll();
}

function $(id) { return document.getElementById(id); }

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toLocaleString();
}

// --- Tabs ---
function setupTabs() {
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      $('panel-' + btn.dataset.tab).classList.add('active');
    });
  });
}

// --- Update all UI ---
export function updateAll() {
  updateHeader();
  updateLoC();
  updateNeeds();
  updateShopAffordability();
  updateItemAffordability();
  updateSkills();
  updateEquipment();
  updateEnemy();
  updateBurnout();
  updatePrestige();
}

function updateHeader() {
  const title = getTitle(state.level);
  $('char-title').textContent = `"${title}"`;
  $('char-level').textContent = `Lv.${state.level}`;
  const needed = xpForLevel(state.level);
  const pct = Math.min(100, (state.xp / needed) * 100);
  $('xp-bar').style.width = pct + '%';
  $('xp-text').textContent = `XP: ${Math.floor(state.xp)}/${needed}`;

  // Prestige badge
  let badge = document.querySelector('.prestige-badge');
  if (state.prestigeCount > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'prestige-badge';
      document.querySelector('.char-info').appendChild(badge);
    }
    badge.textContent = `${state.prestigeMultiplier.toFixed(1)}x`;
  } else if (badge) {
    badge.remove();
  }
}

function updateLoC() {
  $('loc-count').textContent = fmt(state.loc);
  const rate = getAutoRate(state);
  $('auto-rate').textContent = `+${rate.toFixed(1)} LoC/sec`;
}

function updateNeeds() {
  for (const need of ['hunger', 'energy', 'happiness', 'caffeine']) {
    const val = Math.floor(state.needs[need]);
    $('bar-' + need).style.width = val + '%';
    $('val-' + need).textContent = val;

    const el = document.querySelector(`[data-need="${need}"]`);
    const critical =
      (need === 'hunger' && val < 30) ||
      (need === 'energy' && val < 10) ||
      (need === 'happiness' && val < 20);
    const low =
      (need === 'hunger' && val < 50 && val >= 30) ||
      (need === 'energy' && val < 30 && val >= 10) ||
      (need === 'happiness' && val < 40 && val >= 20);
    el.classList.toggle('critical', critical);
    el.classList.toggle('low', low);
  }
}

function updateBurnout() {
  $('click-btn').classList.toggle('burnout', !canClick(state));
  if (!canClick(state)) {
    $('click-btn').textContent = '😵 BURNOUT!';
  } else if (state.napUntil && Date.now() < state.napUntil) {
    $('click-btn').textContent = '😴 Napping...';
  } else {
    $('click-btn').textContent = 'TAP TO CODE';
  }
}

// --- Shop (Upgrades) ---
function renderShop() {
  const panel = $('panel-shop');
  panel.innerHTML = '<div class="panel-header">Auto-coders</div>';
  for (const def of UPGRADE_DEFS) {
    const row = document.createElement('div');
    row.className = 'shop-row';
    row.dataset.id = def.id;
    row.innerHTML = `
      <span class="row-icon">${def.emoji}</span>
      <div class="row-info">
        <div class="row-name">${def.name} <span class="row-owned">(×${state.upgrades[def.id] || 0})</span></div>
        <div class="row-desc">${def.flavor}</div>
      </div>
      <div class="row-cost">${fmt(getEffectiveCost(state, def))} LoC</div>
    `;
    row.addEventListener('click', () => {
      if (handlers.buyUpgrade(def.id)) {
        sfxBuy();
        flashRow(row);
        renderShop();
        updateAll();
        notify(`Hired ${def.name}!`);
      }
    });
    panel.appendChild(row);
  }
  updateShopAffordability();
}

function updateShopAffordability() {
  for (const def of UPGRADE_DEFS) {
    const row = document.querySelector(`.shop-row[data-id="${def.id}"]`);
    if (!row) continue;
    const cost = getEffectiveCost(state, def);
    row.classList.toggle('cannot-afford', state.loc < cost);
    row.querySelector('.row-owned').textContent = `(×${state.upgrades[def.id] || 0})`;
    row.querySelector('.row-cost').textContent = `${fmt(cost)} LoC`;
  }
}

// --- Items (Feed) ---
function renderItems() {
  const panel = $('panel-items');
  panel.innerHTML = '<div class="panel-header">Feed your dev</div>';
  for (const item of FEED_ITEMS) {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.id = item.id;
    const costText = item.cost > 0 ? `${item.cost} LoC` : 'Free';
    row.innerHTML = `
      <span class="row-icon">${item.emoji}</span>
      <div class="row-info">
        <div class="row-name">${item.label}</div>
        <div class="row-desc">+${item.amount} ${item.need}${item.alsoCaffeine ? ` +${item.alsoCaffeine} caffeine` : ''}</div>
      </div>
      <div class="row-cost">${costText}</div>
    `;
    row.addEventListener('click', () => {
      if (handlers.feedItem(item.id)) {
        sfxFeed();
        flashRow(row);
        // Feed flash on the need icon
        const needEl = document.querySelector(`[data-need="${item.need}"]`);
        if (needEl) {
          needEl.classList.remove('feed-flash');
          void needEl.offsetWidth;
          needEl.classList.add('feed-flash');
          setTimeout(() => needEl.classList.remove('feed-flash'), 300);
        }
        updateAll();
        notify(`Used ${item.label}!`);
      }
    });
    panel.appendChild(row);
  }
}

function updateItemAffordability() {
  for (const item of FEED_ITEMS) {
    const row = document.querySelector(`.item-row[data-id="${item.id}"]`);
    if (!row) continue;
    row.classList.toggle('cannot-afford', state.loc < item.cost);
  }
}

// --- Skills ---
function renderSkills() {
  const panel = $('panel-skills');
  panel.innerHTML = `<div class="panel-header">Skills <span id="skill-points-display">(${state.skillPoints} points)</span></div>`;
  for (const def of SKILL_DEFS) {
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.dataset.id = def.id;
    row.innerHTML = `
      <span class="row-icon">${def.emoji}</span>
      <div class="row-info">
        <div class="row-name">${def.name} <span class="row-owned">Lv.${state.skills[def.id]}</span></div>
        <div class="row-desc">${def.desc}</div>
      </div>
      <div class="row-cost">1 pt</div>
    `;
    row.addEventListener('click', () => {
      if (handlers.spendSkillPoint(def.id)) {
        sfxBuy();
        renderSkills();
        updateAll();
        notify(`${def.name} leveled up!`);
      }
    });
    panel.appendChild(row);
  }
}

function updateSkills() {
  const display = $('skill-points-display');
  if (display) display.textContent = `(${state.skillPoints} points)`;
  for (const def of SKILL_DEFS) {
    const row = document.querySelector(`.skill-row[data-id="${def.id}"]`);
    if (!row) continue;
    row.querySelector('.row-owned').textContent = `Lv.${state.skills[def.id]}`;
    row.classList.toggle('cannot-afford', state.skillPoints <= 0);
  }
}

// --- Equipment ---
function renderEquipment() {
  const panel = $('panel-equip');
  panel.innerHTML = '';
  for (const [slot, items] of Object.entries(EQUIPMENT_DEFS)) {
    panel.innerHTML += `<div class="panel-header">${slot}</div>`;
    for (const item of items) {
      const equipped = state.equipment[slot] === item.id;
      const row = document.createElement('div');
      row.className = 'equip-row' + (equipped ? ' equipped' : '');
      row.dataset.slot = slot;
      row.dataset.id = item.id;
      row.innerHTML = `
        <span class="row-icon">${item.emoji}</span>
        <div class="row-info">
          <div class="row-name">${item.name} ${equipped ? '✅' : ''}</div>
          <div class="row-desc">${item.desc}</div>
        </div>
        <div class="row-cost">${equipped ? 'Equipped' : fmt(item.cost) + ' LoC'}</div>
      `;
      if (!equipped) {
        row.addEventListener('click', () => {
          if (handlers.buyEquipment(slot, item.id)) {
            sfxBuy();
            renderEquipment();
            updateAll();
            notify(`Equipped ${item.name}!`);
          }
        });
      }
      panel.appendChild(row);
    }
  }
  updateEquipment();
}

function updateEquipment() {
  for (const [slot, items] of Object.entries(EQUIPMENT_DEFS)) {
    for (const item of items) {
      const row = document.querySelector(`.equip-row[data-slot="${slot}"][data-id="${item.id}"]`);
      if (!row) continue;
      const equipped = state.equipment[slot] === item.id;
      if (!equipped) {
        row.classList.toggle('cannot-afford', state.loc < item.cost);
      }
    }
  }
}

// --- Prestige ---
function renderPrestige() {
  const panel = $('panel-prestige');
  if (!panel) return;
  const cost = getPrestigeCost(state.prestigeCount || 0);
  const nextMult = getPrestigeMultiplier((state.prestigeCount || 0) + 1);
  const nextLang = getPrestigeLanguage(state.prestigeCount || 0);

  panel.innerHTML = `
    <div class="prestige-info">
      <div class="prestige-icon">🔄</div>
      <div class="prestige-title">Rewrite in a New Language</div>
      <div class="prestige-subtitle">Reset all progress, but gain a permanent production multiplier.</div>
      <div class="prestige-stats">
        <div class="prestige-stat">
          <div class="prestige-stat-val">${state.prestigeCount || 0}</div>
          <div class="prestige-stat-label">Rewrites</div>
        </div>
        <div class="prestige-stat">
          <div class="prestige-stat-val">${(state.prestigeMultiplier || 1).toFixed(1)}x</div>
          <div class="prestige-stat-label">Current Mult</div>
        </div>
        <div class="prestige-stat">
          <div class="prestige-stat-val">${nextMult.toFixed(1)}x</div>
          <div class="prestige-stat-label">Next Mult</div>
        </div>
      </div>
      <div class="prestige-cost">Requires ${fmt(cost)} total LoC (you have ${fmt(state.totalLoc)})</div>
      <button id="prestige-btn" type="button" ${canPrestige(state) ? '' : 'disabled'}>Rewrite in ${nextLang}</button>
      <div class="prestige-next-lang">Next language: <strong>${nextLang}</strong></div>
    </div>
  `;

  $('prestige-btn').addEventListener('click', () => {
    if (handlers.prestige()) {
      sfxPrestige();
      screenFlash('flash-prestige');
      spawnParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 30, '#f0c040');
      notify(`Rewrote everything in ${nextLang}! ${nextMult.toFixed(1)}x multiplier!`, 'notif-prestige');
      // Re-render everything
      renderShop();
      renderItems();
      renderSkills();
      renderEquipment();
      renderPrestige();
      updateAll();
    }
  });
}

function updatePrestige() {
  const btn = $('prestige-btn');
  if (btn) {
    btn.disabled = !canPrestige(state);
  }
  const costEl = document.querySelector('.prestige-cost');
  if (costEl) {
    const cost = getPrestigeCost(state.prestigeCount || 0);
    costEl.textContent = `Requires ${fmt(cost)} total LoC (you have ${fmt(state.totalLoc)})`;
  }
}

// --- Enemy ---
export function updateEnemy() {
  const overlay = $('enemy-overlay');
  if (!state.enemy) {
    overlay.classList.add('hidden');
    lastEnemyId = null;
    return;
  }
  overlay.classList.remove('hidden');
  const e = state.enemy;

  // Play spawn sound on new enemy
  if (lastEnemyId !== e.id + '_' + e.currentHp + '_' + e.hp) {
    if (lastEnemyId === null) sfxEnemySpawn();
    lastEnemyId = e.id + '_' + e.currentHp + '_' + e.hp;
  }

  $('enemy-emoji').textContent = e.emoji;
  $('enemy-name').textContent = e.name;
  const pct = (e.currentHp / e.hp) * 100;
  $('enemy-hp-bar').style.width = pct + '%';
  $('enemy-hp-text').textContent = `HP: ${e.currentHp}/${e.hp}`;
  $('enemy-flavor').textContent = `"${e.flavor}"`;
  $('enemy-damage-warn').textContent = `⚠️ Destroying ${e.dps} LoC/sec!`;
}

export function showEnemyHit() {
  sfxEnemyHit();
  // Shake popup
  const popup = $('enemy-popup');
  popup.classList.remove('shake');
  void popup.offsetWidth;
  popup.classList.add('shake');
  // Hit flash on icon
  const icon = $('enemy-emoji');
  icon.classList.remove('hit');
  void icon.offsetWidth;
  icon.classList.add('hit');
}

export function showEnemyDefeated(enemy) {
  sfxEnemyDefeat();
  spawnParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 15, '#f85149');
  notify(`Defeated ${enemy.name}! +${enemy.xp} XP`);
}

export function showEnemyDamage() {
  screenFlash('flash-damage');
}

// --- Click animation ---
export function showClickFloat(amount) {
  const btn = $('click-btn');
  const rect = btn.getBoundingClientRect();

  // Number floater
  const el = document.createElement('div');
  el.className = 'click-float';
  el.textContent = '+' + amount.toFixed(1);
  el.style.left = (rect.left + rect.width / 2 - 20 + (Math.random() - 0.5) * 40) + 'px';
  el.style.top = (rect.top - 10) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);

  // Code snippet floater (every 3rd click)
  if (Math.random() < 0.35) {
    const code = document.createElement('div');
    code.className = 'code-float';
    code.textContent = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
    code.style.left = (rect.left + rect.width / 2 - 50 + (Math.random() - 0.5) * 60) + 'px';
    code.style.top = (rect.top + 20) + 'px';
    document.body.appendChild(code);
    setTimeout(() => code.remove(), 1200);
  }

  // LoC counter bump
  const locDisplay = $('loc-display');
  locDisplay.classList.remove('bump');
  void locDisplay.offsetWidth;
  locDisplay.classList.add('bump');

  // Button pulse ring
  btn.classList.remove('pulse-ring');
  void btn.offsetWidth;
  btn.classList.add('pulse-ring');

  // Small particle burst
  spawnParticleBurst(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
    4,
    '#58a6ff'
  );
}

// --- Notifications ---
export function notify(text, extraClass = '') {
  const container = $('notifications');
  const el = document.createElement('div');
  el.className = 'notif' + (extraClass ? ' ' + extraClass : '');
  el.textContent = text;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

export function showLevelUp() {
  sfxLevelUp();
  screenFlash('flash-level');
  spawnParticleBurst(window.innerWidth / 2, 60, 20, '#bc8cff');
  notify(`Level Up! Lv.${state.level} "${getTitle(state.level)}"!`, 'notif-level');
}

// --- Juice helpers ---
function flashRow(row) {
  row.classList.remove('just-bought');
  void row.offsetWidth;
  row.classList.add('just-bought');
  setTimeout(() => row.classList.remove('just-bought'), 400);
}

function screenFlash(className) {
  const flash = $('screen-flash');
  flash.className = '';
  void flash.offsetWidth;
  flash.classList.add(className);
  setTimeout(() => flash.className = '', 1000);
}

function spawnParticleBurst(x, y, count, color) {
  const container = $('particles');
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.background = color;
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = 40 + Math.random() * 60;
    p.style.setProperty('--px', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--py', Math.sin(angle) * dist + 'px');
    container.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
}

// Re-render all panels (used after prestige)
export function fullRerender() {
  renderShop();
  renderItems();
  renderSkills();
  renderEquipment();
  renderPrestige();
  updateAll();
}
