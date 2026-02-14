let ctx;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function play(freq, type, dur, vol = 0.15) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  } catch {}
}

export function sfxClick() {
  play(800, 'square', 0.06, 0.08);
}

export function sfxBuy() {
  play(520, 'sine', 0.1, 0.12);
  setTimeout(() => play(780, 'sine', 0.12, 0.12), 60);
}

export function sfxFeed() {
  play(440, 'triangle', 0.15, 0.1);
}

export function sfxEnemySpawn() {
  play(200, 'sawtooth', 0.25, 0.1);
  setTimeout(() => play(150, 'sawtooth', 0.3, 0.1), 100);
}

export function sfxEnemyHit() {
  play(300 + Math.random() * 200, 'square', 0.08, 0.1);
}

export function sfxEnemyDefeat() {
  play(400, 'sine', 0.1, 0.15);
  setTimeout(() => play(600, 'sine', 0.1, 0.15), 80);
  setTimeout(() => play(800, 'sine', 0.15, 0.15), 160);
}

export function sfxLevelUp() {
  play(523, 'sine', 0.15, 0.15);
  setTimeout(() => play(659, 'sine', 0.15, 0.15), 100);
  setTimeout(() => play(784, 'sine', 0.15, 0.15), 200);
  setTimeout(() => play(1047, 'sine', 0.3, 0.15), 300);
}

export function sfxPrestige() {
  for (let i = 0; i < 6; i++) {
    setTimeout(() => play(400 + i * 150, 'sine', 0.2, 0.12), i * 80);
  }
}
