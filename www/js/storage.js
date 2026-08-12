// js/storage.js
// Thin wrapper around localStorage for persisting tasks.
window.Habita = window.Habita || {};

(function (app) {
  const STORAGE_KEY = 'habita_tasks';
  const QUADRANTS = ['q1', 'q2', 'q3', 'q4'];

  /** Default block length, in minutes, for a task dropped onto the timeline. */
  const DEFAULT_DURATION = 30;

  // Generate a collision-resistant unique id, always returned as a string.
  app.generateId = function () {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };

  /**
   * Coerce one stored task into the current shape.
   *
   * Tasks saved by earlier versions have no scheduling fields at all, so every
   * one of them is filled in here rather than being checked for at each use.
   */
  function normalizeTask(raw) {
    const start = Number(raw.start);
    const duration = Number(raw.duration);
    return {
      id: raw.id != null ? String(raw.id) : app.generateId(),
      text: typeof raw.text === 'string' ? raw.text : '',
      completed: Boolean(raw.completed),
      createdAt: Number.isFinite(Number(raw.createdAt)) ? Number(raw.createdAt) : Date.now(),
      // Epoch millis of the scheduled block, or null while unscheduled.
      start: Number.isFinite(start) && start > 0 ? start : null,
      duration: Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_DURATION,
      // Id of the device-calendar event mirroring this task, when one exists.
      eventId: typeof raw.eventId === 'string' ? raw.eventId : null,
    };
  }

  // Normalise arbitrary parsed data into the { q1:[], q2:[], q3:[], q4:[] } shape.
  function normalize(data) {
    const result = { q1: [], q2: [], q3: [], q4: [] };
    if (!data || typeof data !== 'object') return result;

    QUADRANTS.forEach((key) => {
      const list = Array.isArray(data[key]) ? data[key] : [];
      result[key] = list.filter((t) => t && typeof t === 'object').map(normalizeTask);
    });
    return result;
  }

  app.DEFAULT_DURATION = DEFAULT_DURATION;

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
