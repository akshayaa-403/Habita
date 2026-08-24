// features/shared/ui.js
// View layer: renders the task list, wires drag & drop, inline editing and navigation.
window.Habita = window.Habita || {};

(function (app) {
  // Quadrant labels and CSS colour variables (see index.html / styles.css).
  const LABELS = {
    1: 'Focus',       // Urgent & Important        — top-left,  red
    2: 'Goals',       // Not Urgent & Important     — top-right, blue
    3: 'Fit In',      // Urgent & Not Important     — bottom-left, yellow
    4: 'Backburner'   // Not Urgent & Not Important — bottom-right, green
  };
  const COLOR_VAR = { 1: '--q1', 2: '--q2', 3: '--q3', 4: '--q4' };
  const LIGHT_VAR = { 1: '--q1-light', 2: '--q2-light', 3: '--q3-light', 4: '--q4-light' };

  // Internal state
  let currentQuadrant = null;
  let currentView = 'matrix';
  let draggedItem = null;
  let draggedIndex = null;

  // DOM references (set during init)
  let matrixView, timelineView, taskListPage, plusButton, matrixGrid,
      backBtn, addTaskBtn, taskItemsContainer,
      taskListTitle, taskCountBadge, splashOverlay, bottomNav;

  app.initUI = function () {
    matrixView = document.getElementById('matrixView');
    timelineView = document.getElementById('timelineView');
    taskListPage = document.getElementById('taskListPage');
    plusButton = document.getElementById('plusButton');
    matrixGrid = document.getElementById('matrixGrid');
    backBtn = document.getElementById('backBtn');
    addTaskBtn = document.getElementById('addTaskBtn');
    taskItemsContainer = document.getElementById('taskItemsContainer');
    taskListTitle = document.getElementById('taskListTitle');
    taskCountBadge = document.getElementById('taskCountBadge');
    splashOverlay = document.getElementById('splashOverlay');
    bottomNav = document.getElementById('bottomNav');

    initQuadrantClicks();
    initPlusButtonDrag();
    initBackButton();
    initAddTaskButton();
    initBottomNav();
  };

  // ----- Top-level views -----
  /**
   * Switch between the matrix and the day timeline.
   *
   * The task list is a page on top of whichever view is active, so switching
   * always closes it first — otherwise the back button would return to a view
   * the user has since left.
   */
  app.showView = function (view) {
    currentView = view === 'timeline' ? 'timeline' : 'matrix';
    if (taskListPage.classList.contains('active')) {
      taskListPage.classList.remove('active');
      currentQuadrant = null;
    }

    matrixView.hidden = currentView !== 'matrix';
    timelineView.hidden = currentView !== 'timeline';
    matrixView.style.display = '';

    bottomNav.querySelectorAll('.nav-tab').forEach((tab) => {
      const active = tab.dataset.view === currentView;
      tab.classList.toggle('active', active);
      if (active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });

    if (currentView === 'timeline') {
      app.timelineDidShow();
    } else {
      app.renderProgressRings();
    }
  };

  function initBottomNav() {
    bottomNav.addEventListener('click', (event) => {
      const tab = event.target.closest('.nav-tab');
      if (tab) app.showView(tab.dataset.view);
    });
  }

  // ----- Splash animation -----
  function playSplashAnimation(quadrantColorVar, callback) {
    // If the overlay is missing, still run the callback so navigation never stalls.
    if (!splashOverlay) { if (callback) callback(); return; }

    splashOverlay.style.display = 'block';
    splashOverlay.style.background = `var(${quadrantColorVar})`;
    splashOverlay.style.animation = 'none';
    void splashOverlay.offsetWidth; // force reflow so the animation restarts
    splashOverlay.style.animation = 'splashFadeIn 0.8s ease-out forwards';

    splashOverlay.addEventListener('animationend', function handler() {
      splashOverlay.style.display = 'none';
      splashOverlay.style.animation = '';
      splashOverlay.style.background = '';
      if (callback) callback();
    }, { once: true });
  }

  // ----- Inline editing -----
  function startEditing(span) {
    span.contentEditable = 'true';
    span.focus();
    const range = document.createRange();
    range.selectNodeContents(span);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function finishEdit(e) {
    const span = e.currentTarget;
    span.contentEditable = 'false';
    const newText = span.textContent.trim();
    const taskId = span.closest('.task-item').dataset.id;
    app.updateTaskText(currentQuadrant, taskId, newText);
    span.textContent = newText || 'New task';
  }

  // ----- Task list rendering -----
  function renderTaskList(quadrant) {
    const list = app.getTasks(quadrant);
    taskItemsContainer.innerHTML = '';

    if (list.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No tasks yet — add one below to get started.';
      taskItemsContainer.appendChild(empty);
    } else {
      list.forEach((task, index) => {
        taskItemsContainer.appendChild(createTaskItem(quadrant, task, index));
      });
    }

    const { remaining, total } = app.getProgress(quadrant);
    taskCountBadge.textContent = `${remaining} left of ${total}`;
  }

  /** "Tue 14:30 · 45m", or null when the task has no block yet. */
  function describeSchedule(task) {
    if (!task.start) return null;
    const start = new Date(task.start);
    const today = new Date();
    const sameDay = start.toDateString() === today.toDateString();
    const day = sameDay ? '' : `${start.toLocaleDateString([], { weekday: 'short' })} `;
    const time = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `${day}${time} · ${task.duration}m`;
  }

  function createTaskItem(quadrant, task, index) {
    const item = document.createElement('div');
    item.className = 'task-item';
    item.draggable = true;
    item.dataset.index = index;
    item.dataset.id = task.id;

    // 6-dot drag handle (decorative)
    const handle = document.createElement('div');
    handle.className = 'drag-handle';
    handle.setAttribute('aria-hidden', 'true');
    handle.innerHTML =
      '<div class="dot-row"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>' +
      '<div class="dot-row"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
    item.appendChild(handle);

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', task.text ? `Mark "${task.text}" complete` : 'Mark task complete');
    checkbox.addEventListener('change', () => {
      app.toggleTask(quadrant, task.id);
      renderTaskList(quadrant);
      app.renderProgressRings();
    });
    item.appendChild(checkbox);

    // Text + schedule line
    const main = document.createElement('div');
    main.className = 'task-main';

    const textSpan = document.createElement('span');
    textSpan.className = 'task-text' + (task.completed ? ' completed' : '');
    textSpan.textContent = task.text || 'New task';
    textSpan.title = 'Double-click to edit';
    textSpan.addEventListener('dblclick', () => startEditing(textSpan));
    textSpan.addEventListener('blur', finishEdit);
    textSpan.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        textSpan.blur();
      }
    });
    main.appendChild(textSpan);

    const schedule = describeSchedule(task);
    if (schedule) {
      // Tapping the time chip opens the day it sits on.
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'schedule-chip';
      chip.textContent = schedule;
      chip.title = 'Show this block on the day view';
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        app.showView('timeline');
      });
      main.appendChild(chip);
    }
    item.appendChild(main);

    // Schedule / unschedule
    const scheduleBtn = document.createElement('button');
    scheduleBtn.type = 'button';
    scheduleBtn.className = 'task-schedule-btn' + (task.start ? ' scheduled' : '');
    scheduleBtn.innerHTML = task.start ? '↩' : '🕘';
    scheduleBtn.title = task.start ? 'Remove the time block' : 'Block out time for this';
    scheduleBtn.setAttribute('aria-label', scheduleBtn.title);
    scheduleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (task.start) {
        app.unscheduleTask(quadrant, task.id);
        renderTaskList(quadrant);
      } else {
        // Hand off to the timeline, which knows what the day already contains.
        app.showView('timeline');
        app.scheduleTaskFromList(quadrant, task.id);
      }
    });
    item.appendChild(scheduleBtn);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'task-delete-btn';
    deleteBtn.innerHTML = '\u{1F5D1}';
    deleteBtn.setAttribute('aria-label', task.text ? `Delete "${task.text}"` : 'Delete task');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      app.deleteTask(quadrant, task.id);
      renderTaskList(quadrant);
      app.renderProgressRings();
    });
    item.appendChild(deleteBtn);

    // Drag & drop reorder
    item.addEventListener('dragstart', dragStart);
    item.addEventListener('dragover', dragOver);
    item.addEventListener('dragleave', dragLeave);
    item.addEventListener('drop', drop);
    item.addEventListener('dragend', dragEnd);

    return item;
  }

  // ----- Drag & drop reorder -----
  function dragStart(e) {
    draggedItem = this;
    draggedIndex = parseInt(this.dataset.index, 10);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    this.classList.add('dragging');
    setTimeout(() => { this.style.opacity = '0.4'; }, 0);
  }

  function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
  }

  function dragLeave() {
    this.classList.remove('drag-over');
  }

  function drop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    if (draggedItem && draggedItem !== this) {
      const toIndex = parseInt(this.dataset.index, 10);
      app.reorderTasks(currentQuadrant, draggedIndex, toIndex);
      renderTaskList(currentQuadrant);
      app.renderProgressRings();
    }
  }

  function dragEnd() {
    this.style.opacity = '1';
    document.querySelectorAll('.task-item').forEach((i) => i.classList.remove('drag-over'));
    draggedItem = null;
    draggedIndex = null;
  }

  // ----- Navigation -----
  function addTaskAndEdit(quadrant) {
    app.addTask(quadrant, '');
    renderTaskList(quadrant);
    app.renderProgressRings();
    const items = taskItemsContainer.querySelectorAll('.task-item');
    const lastItem = items[items.length - 1];
    if (lastItem) {
      const textSpan = lastItem.querySelector('.task-text');
      if (textSpan) startEditing(textSpan);
    }
  }

  app.openTaskList = function (quadrant, quickAdd = false) {
    currentQuadrant = quadrant;

    playSplashAnimation(COLOR_VAR[quadrant], () => {
      taskListPage.style.backgroundColor = `var(${LIGHT_VAR[quadrant]})`;
      taskListTitle.textContent = LABELS[quadrant];
      renderTaskList(quadrant);
      matrixView.style.display = 'none';
      taskListPage.classList.add('active');

      if (quickAdd) {
        // Let the freshly-shown list settle in the DOM before focusing the new row.
        setTimeout(() => addTaskAndEdit(quadrant), 50);
      }
    });
  };

  function closeTaskList() {
    taskListPage.classList.remove('active');
    matrixView.style.display = '';
    currentQuadrant = null;
    app.renderProgressRings();
  }

  // ----- Center draggable plus button -----
  function initPlusButtonDrag() {
    if (!plusButton) return;

    const DRAG_THRESHOLD = 8; // px of movement before a press counts as a drag
    let isPointerDown = false;
    let moved = false;
    let startX = 0, startY = 0;

    plusButton.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      isPointerDown = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      plusButton.setPointerCapture(e.pointerId);
      plusButton.classList.add('dragging');
      // Shrink the grid and reveal the seam axis labels the moment it's pressed.
      matrixGrid.classList.add('pressing');
    });

    plusButton.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) moved = true;
      plusButton.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

      // Ike-style cue: once dragging, fade the non-target quadrants to pale tints
      // and keep the one under the pointer vivid.
      if (moved) {
        matrixGrid.classList.add('dragging');
        highlightTarget(quadrantAtPoint(e.clientX, e.clientY));
      }
    });

    plusButton.addEventListener('pointerup', (e) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      plusButton.classList.remove('dragging');
      plusButton.releasePointerCapture(e.pointerId);
      plusButton.style.transform = ''; // always snap back to centre
      clearDragCue();

      // A tap (no real movement) shouldn't fling a task into a quadrant.
      if (!moved) return;

      const quadrant = quadrantAtPoint(e.clientX, e.clientY);
      if (quadrant) app.openTaskList(quadrant, true);
    });

    // Safety net: if the gesture is cancelled, drop the visual cue.
    plusButton.addEventListener('pointercancel', () => {
      isPointerDown = false;
      plusButton.classList.remove('dragging');
      plusButton.style.transform = '';
      clearDragCue();
    });
  }

  // Mark the quadrant under the pointer as the drop target (or none).
  function highlightTarget(quadrant) {
    document.querySelectorAll('.quadrant').forEach((q) => {
      q.classList.toggle('drag-target', parseInt(q.dataset.quadrant, 10) === quadrant);
    });
  }

  function clearDragCue() {
    matrixGrid.classList.remove('dragging', 'pressing');
    document.querySelectorAll('.quadrant.drag-target')
      .forEach((q) => q.classList.remove('drag-target'));
  }

  // Map a screen point to a quadrant number, or null if outside the grid.
  function quadrantAtPoint(x, y) {
    const rect = matrixGrid.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (x < cx && y < cy) return 1; // top-left
    if (x >= cx && y < cy) return 2; // top-right
    if (x < cx && y >= cy) return 3; // bottom-left
    return 4;                        // bottom-right
  }

  // ----- Event initialisation -----
  function initQuadrantClicks() {
    document.querySelectorAll('.quadrant').forEach((q) => {
      const open = () => app.openTaskList(parseInt(q.dataset.quadrant, 10), false);
      q.addEventListener('click', open);
      q.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function initBackButton() {
    backBtn.addEventListener('click', closeTaskList);
  }

  function initAddTaskButton() {
    addTaskBtn.addEventListener('click', () => {
      if (currentQuadrant) addTaskAndEdit(currentQuadrant);
    });
  }
})(window.Habita);
