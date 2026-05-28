// js/tasks.js
window.Habita = window.Habita || {};

(function(app) {
  let tasks = app.loadTasks();

  function persist() {
    app.saveTasks(tasks);
  }

  app.getTasks = function(quadrant) {
    return tasks['q' + quadrant] || [];
  };

  app.addTask = function(quadrant, text = '') {
    const list = tasks['q' + quadrant];
    const newTask = {
      id: Date.now() + Math.random(),
      text: text,
      completed: false
    };
    list.push(newTask);
    persist();
    return newTask;
  };

  app.deleteTask = function(quadrant, taskId) {
    tasks['q' + quadrant] = tasks['q' + quadrant].filter(t => t.id !== taskId);
    persist();
  };

  app.toggleTask = function(quadrant, taskId) {
    const task = tasks['q' + quadrant].find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      persist();
    }
  };

  app.updateTaskText = function(quadrant, taskId, newText) {
    const task = tasks['q' + quadrant].find(t => t.id === taskId);
    if (task) {
      task.text = newText;
      persist();
    }
  };

  app.reorderTasks = function(quadrant, fromIndex, toIndex) {
    const list = tasks['q' + quadrant];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    persist();
  };

  app.getProgress = function(quadrant) {
    const list = tasks['q' + quadrant];
    const total = list.length;
    const completed = list.filter(t => t.completed).length;
    return { total, completed, remaining: total - completed };
  };
})(window.Habita);