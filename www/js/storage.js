// js/storage.js
// Thin wrapper around localStorage for persisting tasks.
window.Habita = window.Habita || {};

(function (app) {
  const STORAGE_KEY = 'habita_tasks';
  const QUADRANTS = ['q1', 'q2', 'q3', 'q4'];

  // Generate a collision-resistant unique id, always returned as a string.
  app.generateId = function () {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };

  // Normalise arbitrary parsed data into the { q1:[], q2:[], q3:[], q4:[] } shape.
  // Also migrates legacy numeric ids to strings so equality checks stay reliable.
  function normalize(data) {
    const result = { q1: [], q2: [], q3: [], q4: [] };
    if (!data || typeof data !== 'object') return result;

    QUADRANTS.forEach((key) => {
      const list = Array.isArray(data[key]) ? data[key] : [];
      result[key] = list
        .filter((t) => t && typeof t === 'object')
        .map((t) => ({
          id: t.id != null ? String(t.id) : app.generateId(),
          text: typeof t.text === 'string' ? t.text : '',
          completed: Boolean(t.completed)
        }));
    });
    return result;
  }

  app.loadTasks = function () {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalize(null);
    try {
      return normalize(JSON.parse(raw));
    } catch (err) {
      console.warn('Habita: could not parse saved tasks, starting fresh.', err);
      return normalize(null);
    }
  };

  app.saveTasks = function (tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      // Most likely a full or unavailable storage (e.g. private browsing).
      console.error('Habita: failed to save tasks.', err);
    }
  };
})(window.Habita);
