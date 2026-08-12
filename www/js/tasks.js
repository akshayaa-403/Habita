// js/tasks.js
// In-memory task model plus persistence. Every task id is a string.
window.Habita = window.Habita || {};

(function (app) {
  let tasks = app.loadTasks();

  const QUADRANT_NAMES = {
    1: 'Focus',
    2: 'Backburner',
    3: 'Fit In',
    4: 'Goals',
  };

  /** Smallest schedulable slice, in minutes. Blocks snap to this. */
  const SNAP_MINUTES = 15;

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

  app.SNAP_MINUTES = SNAP_MINUTES;

  app.quadrantName = function (quadrant) {
    return QUADRANT_NAMES[quadrant] || 'Tasks';
  };

  app.getTasks = function (quadrant) {
    return listFor(quadrant);
  };

  /** Every task, each tagged with the quadrant it belongs to. */
  app.getAllTasks = function () {
    const all = [];
    for (let q = 1; q <= 4; q++) {
      listFor(q).forEach((task) => all.push({ ...task, quadrant: q }));
    }
    return all;
  };

  /** Locate a task by id across all quadrants: { task, quadrant } or null. */
  app.findTask = function (taskId) {
    const id = String(taskId);
    for (let q = 1; q <= 4; q++) {
      const task = listFor(q).find((t) => t.id === id);
      if (task) return { task, quadrant: q };
    }
    return null;
  };

  app.addTask = function (quadrant, text = '') {
    const newTask = {
      id: app.generateId(),
      text,
      completed: false,
      createdAt: Date.now(),
      start: null,
      duration: app.DEFAULT_DURATION,
      eventId: null,
    };
    listFor(quadrant).push(newTask);
    persist();
    return newTask;
  };

  app.deleteTask = function (quadrant, taskId) {
    const id = String(taskId);
    const task = listFor(quadrant).find((t) => t.id === id);
    // Drop the calendar event too, or the block outlives the task it came from.
    if (task && task.eventId) app.removeTaskEvent(task);
    tasks['q' + quadrant] = listFor(quadrant).filter((t) => t.id !== id);
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
      // Keep the calendar event's title in step with the renamed task.
      if (task.start && task.eventId) syncToCalendar(task, quadrant);
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

  // ----- Scheduling -------------------------------------------------------

  /** Round a timestamp to the nearest SNAP_MINUTES boundary. */
  app.snapTime = function (millis) {
    const step = SNAP_MINUTES * 60000;
    return Math.round(millis / step) * step;
  };

  /**
   * Write a task's block to the device calendar and remember the event id.
   *
   * Fire-and-forget on purpose: dragging a block should feel instant, and the
   * calendar write is a side effect the user does not wait on. A failed write
   * leaves the task scheduled locally with eventId null, which the next save
   * retries.
   */
  function syncToCalendar(task, quadrant) {
    app.saveTaskEvent(task, quadrant).then((eventId) => {
      if (eventId && eventId !== task.eventId) {
        task.eventId = eventId;
        persist();
      }
    });
  }

  /**
   * Place a task on the timeline (or move/resize an existing block).
   *
   * @param {number} quadrant
   * @param {string} taskId
   * @param {number} startMillis start of the block; snapped to the grid
   * @param {number} [durationMinutes] block length; keeps the current one if omitted
   * @returns {object|null} the updated task
   */
  app.scheduleTask = function (quadrant, taskId, startMillis, durationMinutes) {
    const task = listFor(quadrant).find((t) => t.id === String(taskId));
    if (!task) return null;

    task.start = app.snapTime(startMillis);
    if (Number.isFinite(durationMinutes)) {
      task.duration = Math.max(SNAP_MINUTES, Math.round(durationMinutes / SNAP_MINUTES) * SNAP_MINUTES);
    }
    persist();
    syncToCalendar(task, quadrant);
    return task;
  };

  /** Take a task off the timeline and delete its calendar event. */
  app.unscheduleTask = function (quadrant, taskId) {
    const task = listFor(quadrant).find((t) => t.id === String(taskId));
    if (!task) return null;

    if (task.eventId) app.removeTaskEvent(task);
    task.start = null;
    task.eventId = null;
    persist();
    return task;
  };

  /** Tasks with a block that overlaps the given day. */
  app.getScheduledTasks = function (dayStartMillis, dayEndMillis) {
    return app.getAllTasks().filter((task) => {
      if (!task.start) return false;
      const end = task.start + task.duration * 60000;
      return task.start < dayEndMillis && end > dayStartMillis;
    });
  };

  /** Unscheduled, incomplete tasks — the pool the timeline's tray draws from. */
  app.getUnscheduledTasks = function () {
    return app.getAllTasks().filter((task) => !task.start && !task.completed);
  };

  /**
   * Re-send every scheduled task to the calendar.
   *
   * Used once after permission is granted, so blocks created before the user
   * allowed calendar access still end up as real events.
   */
  app.syncAllToCalendar = function () {
    app.getAllTasks()
      .filter((task) => task.start && !task.eventId)
      .forEach((entry) => {
        const found = app.findTask(entry.id);
        if (found) syncToCalendar(found.task, found.quadrant);
      });
  };
})(window.Habita);
