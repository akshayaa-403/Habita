// js/ui.js
window.Habita = window.Habita || {};

(function(app) {
  // Internal state
  let currentQuadrant = null;
  let quickAddMode = false;
  let draggedItem = null;
  let draggedIndex = null;

  // DOM references (set during init)
  let matrixView, taskListPage, plusButton, matrixGrid,
      backBtn, addTaskBtn, taskItemsContainer,
      taskListTitle, taskCountBadge, splashOverlay;

  app.initUI = function() {
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
    if (!splashOverlay) return;
    splashOverlay.style.display = 'block';
    splashOverlay.style.background = `var(${quadrantColorVar})`;
    splashOverlay.style.animation = 'none';
    void splashOverlay.offsetWidth;
    splashOverlay.style.animation = 'splashFadeIn 0.8s ease-out forwards';

    splashOverlay.addEventListener('animationend', function handler() {
      splashOverlay.style.display = 'none';
      splashOverlay.style.animation = '';
      splashOverlay.style.background = '';
      splashOverlay.removeEventListener('animationend', handler);
      if (callback) callback();
    }, { once: true });
  }

  // ----- Task list rendering -----
  function renderTaskList(quadrant) {
    const list = app.getTasks(quadrant);
    taskItemsContainer.innerHTML = '';

    list.forEach((task, index) => {
      const item = document.createElement('div');
      item.className = 'task-item';
      item.draggable = true;
      item.dataset.index = index;
      item.dataset.id = task.id;

      // 6-dot drag handle (FIX TASK 7)
      const handle = document.createElement('div');
      handle.className = 'drag-handle';
      handle.innerHTML = '<div class="dot-row"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div><div class="dot-row"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
      item.appendChild(handle);

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => {
        app.toggleTask(quadrant, task.id);
        renderTaskList(quadrant);
        app.renderProgressRings();
      });
      item.appendChild(checkbox);

      // Task text (double-click to edit)
      const textSpan = document.createElement('span');
      textSpan.className = 'task-text' + (task.completed ? ' completed' : '');
      textSpan.textContent = task.text || 'New task';
      textSpan.addEventListener('dblclick', makeEditable);
      textSpan.addEventListener('blur', finishEdit);
      textSpan.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          textSpan.blur();
        }
      });
      item.appendChild(textSpan);

      // Delete button (🗑 icon) – FIX DELETE ICON
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'task-delete-btn';
      deleteBtn.innerHTML = '\u{1F5D1}'; // 🗑 emoji
      deleteBtn.title = 'Delete task';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        app.deleteTask(quadrant, task.id);
        renderTaskList(quadrant);
        app.renderProgressRings();
      });
      item.appendChild(deleteBtn);

      // Reorder drag events
      item.addEventListener('dragstart', dragStart);
      item.addEventListener('dragover', dragOver);
      item.addEventListener('dragleave', dragLeave);
      item.addEventListener('drop', drop);
      item.addEventListener('dragend', dragEnd);

      taskItemsContainer.appendChild(item);
    });

    const { remaining, total } = app.getProgress(quadrant);
    taskCountBadge.textContent = `${remaining} left of ${total}`;
  }

  // Inline helper: make text editable
  function makeEditable(e) {
    e.stopPropagation();
    this.contentEditable = true;
    this.focus();
    const range = document.createRange();
    range.selectNodeContents(this);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function finishEdit(e) {
    const span = this;
    span.contentEditable = false;
    const newText = span.textContent.trim();
    const quadrant = currentQuadrant;
    const taskId = parseInt(span.closest('.task-item').dataset.id);
    // original task text might be needed, we'll use whatever was stored before
    // but we can just call updateTaskText and it will overwrite
    app.updateTaskText(quadrant, taskId, newText);
    if (!newText) span.textContent = 'New task';
  }

  // ----- Drag & drop reorder -----
  function dragStart(e) {
    draggedItem = this;
    draggedIndex = parseInt(this.dataset.index);
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

  function dragLeave(e) {
    this.classList.remove('drag-over');
  }

  function drop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    if (draggedItem !== this) {
      const fromIndex = draggedIndex;
      const toIndex = parseInt(this.dataset.index);
      app.reorderTasks(currentQuadrant, fromIndex, toIndex);
      renderTaskList(currentQuadrant);
      app.renderProgressRings();
    }
  }

  function dragEnd(e) {
    this.style.opacity = '1';
    document.querySelectorAll('.task-item').forEach(item => item.classList.remove('drag-over'));
    draggedItem = null;
    draggedIndex = null;
  }

  // ----- Navigation -----
  app.openTaskList = function(quadrant, quickAdd = false) {
    currentQuadrant = quadrant;
    quickAddMode = quickAdd;

    const colorMap = {1: '--q1', 2: '--q2', 3: '--q3', 4: '--q4'};
    const lightColorMap = {1: '--q1-light', 2: '--q2-light', 3: '--q3-light', 4: '--q4-light'};
    const labelMap = {
      1: 'Urgent & High Priority',
      2: 'Not Urgent & High Priority',
      3: 'Urgent & Low Priority',
      4: 'Not Urgent & Low Priority'
    };

    playSplashAnimation(colorMap[quadrant], () => {
      taskListPage.style.backgroundColor = `var(${lightColorMap[quadrant]})`;
      taskListTitle.textContent = labelMap[quadrant];
      renderTaskList(quadrant);
      matrixView.style.display = 'none';
      taskListPage.classList.add('active');
      resetPlusButton();

      if (quickAdd) {
        app.addTask(quadrant, '');
        renderTaskList(quadrant);
        app.renderProgressRings();
        setTimeout(() => {
          const items = taskItemsContainer.querySelectorAll('.task-item');
          const lastItem = items[items.length - 1];
          if (lastItem) {
            const textSpan = lastItem.querySelector('.task-text');
            if (textSpan) textSpan.dblclick();
          }
        }, 100);
      }
    });
  };

  function closeTaskList() {
    taskListPage.classList.remove('active');
    matrixView.style.display = '';
    currentQuadrant = null;
    quickAddMode = false;
    app.renderProgressRings();
  }

  function resetPlusButton() {
    plusButton.style.transform = 'translate(-50%, -50%)';
    plusButton.classList.remove('dragging');
  }

  // ----- Event initialisation -----
  function initQuadrantClicks() {
    document.querySelectorAll('.quadrant').forEach(q => {
      q.addEventListener('click', (e) => {
        if (e.target.closest('.plus-button')) return;
        const qNum = parseInt(q.dataset.quadrant);
        app.openTaskList(qNum, false);
      });
    });
  }

  function initBackButton() {
    backBtn.addEventListener('click', closeTaskList);
  }

  function initAddTaskButton() {
    addTaskBtn.addEventListener('click', () => {
      if (currentQuadrant) {
        app.addTask(currentQuadrant, '');
        renderTaskList(currentQuadrant);
        app.renderProgressRings();
        const items = taskItemsContainer.querySelectorAll('.task-item');
        const lastItem = items[items.length - 1];
        if (lastItem) {
          const textSpan = lastItem.querySelector('.task-text');
          if (textSpan) textSpan.dblclick();
        }
      }
    });
  }

  function initPlusButtonDrag() {
    let isDraggingPlus = false;
    let startX, startY;

    plusButton.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      isDraggingPlus = true;
      plusButton.setPointerCapture(e.pointerId);
      const rect = plusButton.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      plusButton.classList.add('dragging');
    });

    plusButton.addEventListener('pointermove', (e) => {
      if (!isDraggingPlus) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      plusButton.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    });

    plusButton.addEventListener('pointerup', (e) => {
      if (!isDraggingPlus) return;
      isDraggingPlus = false;
      plusButton.classList.remove('dragging');
      plusButton.releasePointerCapture(e.pointerId);

      const gridRect = matrixGrid.getBoundingClientRect();
      const centerX = gridRect.left + gridRect.width / 2;
      const centerY = gridRect.top + gridRect.height / 2;
      const btnRect = plusButton.getBoundingClientRect();
      const btnCenterX = btnRect.left + btnRect.width / 2;
      const btnCenterY = btnRect.top + btnRect.height / 2;

      let quadrant = null;
      if (btnCenterX < centerX && btnCenterY < centerY) quadrant = 1;
      else if (btnCenterX >= centerX && btnCenterY < centerY) quadrant = 2;
      else if (btnCenterX < centerX && btnCenterY >= centerY) quadrant = 3;
      else if (btnCenterX >= centerX && btnCenterY >= centerY) quadrant = 4;

      if (quadrant) {
        app.openTaskList(quadrant, true);
      } else {
        resetPlusButton();
      }
    });

    plusButton.addEventListener('click', (e) => {
      if (isDraggingPlus || plusButton.classList.contains('dragging')) {
        e.stopPropagation();
        e.preventDefault();
      }
    });
  }
})(window.Habita);