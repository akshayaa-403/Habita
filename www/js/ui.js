// js/ui.js
// View layer: renders the task list, wires drag & drop, inline editing and navigation.
window.Habita = window.Habita || {};

(function (app) {
  // Quadrant labels and CSS colour variables (see index.html / styles.css).
  const LABELS = {
    1: 'Focus',       // Urgent & Important
    2: 'Backburner',  // Not Urgent & Important
    3: 'Fit In',      // Urgent & Not Important
    4: 'Goals'        // Not Urgent & Not Important
  };
  const COLOR_VAR = { 1: '--q1', 2: '--q2', 3: '--q3', 4: '--q4' };
  const LIGHT_VAR = { 1: '--q1-light', 2: '--q2-light', 3: '--q3-light', 4: '--q4-light' };

  // Internal state
  let currentQuadrant = null;
  let draggedItem = null;
  let draggedIndex = null;

  // DOM references (set during init)
  let matrixView, taskListPage, plusButton, matrixGrid,
      backBtn, addTaskBtn, taskItemsContainer,
      taskListTitle, taskCountBadge, splashOverlay;

  app.initUI = function () {
    matrixView = document.getElementById('matrixView');
    taskListPage = document.getElementById('taskListPage');
    plusButton = document.getElementById('plusButton');
    matrixGrid = document.getElementById('matrixGrid');
    backBtn = document.getElementById('backBtn');
    addTaskBtn = document.getElementById('addTaskBtn');
    taskItemsContainer = document.getElementById('taskItemsContainer');
    taskListTitle = document.getElementById('taskListTitle');
    taskCountBadge = document.getElementById('taskCountBadge');
    splashOverlay = document.getElementById('splashOverlay');

    initQuadrantClicks();
    initPlusButtonDrag();
    initBackButton();
    initAddTaskButton();
  };

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

    // Task text (double-click to edit, Enter to save)
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
    item.appendChild(textSpan);

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
    });

    plusButton.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) moved = true;
      plusButton.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    });

    plusButton.addEventListener('pointerup', (e) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      plusButton.classList.remove('dragging');
      plusButton.releasePointerCapture(e.pointerId);
      plusButton.style.transform = ''; // always snap back to centre

      // A tap (no real movement) shouldn't fling a task into a quadrant.
      if (!moved) return;

      const quadrant = quadrantAtPoint(e.clientX, e.clientY);
      if (quadrant) app.openTaskList(quadrant, true);
    });
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
