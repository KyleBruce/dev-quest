const SAVE_KEY = 'dev-quest-save';

export function saveGame(state) {
  try {
    state.lastSaveTimestamp = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded, ignore */ }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function exportSave() {
  const data = localStorage.getItem(SAVE_KEY);
  if (!data) return null;
  return data;
}

export function importSave(saveData) {
  try {
    const parsed = JSON.parse(saveData);
    localStorage.setItem(SAVE_KEY, saveData);
    return true;
  } catch (e) {
    return false;
  }
}

export function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  window.location.reload();
}
