// js/tasks.js
// In-memory task model plus persistence. Every task id is a string.
window.Habita = window.Habita || {};

(function (app) {
  let tasks = app.loadTasks();

  function persist() {
    app.saveTasks(tasks);
  }

  // Safely fetch (and lazily create) the list for a quadrant.
  function listFor(quadrant) {
    const key = 'q' + quadrant;
    if (!Array.isArray(tasks[key])) tasks[key] = [];
    return tasks[key];
  }

  // Best-effort light haptic feedback: native Capacitor plugin when available,
  // otherwise the Web Vibration API. Never throws to the caller.
  function triggerHaptic() {
    try {
      const cap = window.Capacitor;
      if (cap && cap.Plugins && cap.Plugins.Haptics) {
        cap.Plugins.Haptics.impact({ style: 'LIGHT' });
      } else if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    } catch (err) {
      /* haptics are a nicety, not a requirement — ignore failures */
    }
  }

  app.getTasks = function (quadrant) {
    return listFor(quadrant);
  };

  app.addTask = function (quadrant, text = '') {
    const newTask = { id: app.generateId(), text, completed: false };
    listFor(quadrant).push(newTask);
    persist();
    return newTask;
  };

  app.deleteTask = function (quadrant, taskId) {
    const key = 'q' + quadrant;
    tasks[key] = listFor(quadrant).filter((t) => t.id !== String(taskId));
    persist();
  };

  app.toggleTask = function (quadrant, taskId) {
    const task = listFor(quadrant).find((t) => t.id === String(taskId));
    if (!task) return;
    task.completed = !task.completed;
    if (task.completed) triggerHaptic();
    persist();
  };

  app.updateTaskText = function (quadrant, taskId, newText) {
    const task = listFor(quadrant).find((t) => t.id === String(taskId));
    if (task) {
      task.text = newText;
      persist();
    }
  };

  app.reorderTasks = function (quadrant, fromIndex, toIndex) {
    const list = listFor(quadrant);
    if (fromIndex < 0 || fromIndex >= list.length) return;
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    persist();
  };

  app.getProgress = function (quadrant) {
    const list = listFor(quadrant);
    const total = list.length;
    const completed = list.filter((t) => t.completed).length;
    return { total, completed, remaining: total - completed };
  };
})(window.Habita);
