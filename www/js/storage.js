// js/storage.js
window.Habita = window.Habita || {};

(function(app) {
  const STORAGE_KEY = 'habita_tasks';

  app.loadTasks = function() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch(e) {}
    }
    return { q1: [], q2: [], q3: [], q4: [] };
  };

  app.saveTasks = function(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  };
})(window.Habita);