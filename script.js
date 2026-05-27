// script.js
(function() {
  // ---------- Data & Storage ----------
  const STORAGE_KEY = 'habita_tasks';
  const DARK_MODE_KEY = 'habita_dark_mode';

  let tasks = loadTasks();

  function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch(e) {}
    }
    return { q1: [], q2: [], q3: [], q4: [] };
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function getTasks(quadrant) {
    return tasks['q' + quadrant] || [];
  }

  function addTask(quadrant, text = '') {
    const list = tasks['q' + quadrant];
    const newTask = {
      id: Date.now() + Math.random(),
      text: text,
      completed: false
    };
    list.push(newTask);
    saveTasks();
    return newTask;
  }

  function deleteTask(quadrant, taskId) {
    tasks['q' + quadrant] = tasks['q' + quadrant].filter(t => t.id !== taskId);
    saveTasks();
  }

  function toggleTask(quadrant, taskId) {
    const task = tasks['q' + quadrant].find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
    }
  }

  function updateTaskText(quadrant, taskId, newText) {
    const task = tasks['q' + quadrant].find(t => t.id === taskId);
    if (task) {
      task.text = newText;
      saveTasks();
    }
  }

  function reorderTasks(quadrant, fromIndex, toIndex) {
    const list = tasks['q' + quadrant];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    saveTasks();
  }

  function getProgress(quadrant) {
    const list = tasks['q' + quadrant];
    const total = list.length;
    const completed = list.filter(t => t.completed).length;
    return { total, completed, remaining: total - completed };
  }

  // ---------- DOM Elements ----------
  const matrixView = document.getElementById('matrixView');
  const taskListPage = document.getElementById('taskListPage');
  const plusButton = document.getElementById('plusButton');
  const matrixGrid = document.getElementById('matrixGrid');
  const backBtn = document.getElementById('backBtn');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskItemsContainer = document.getElementById('taskItemsContainer');
  const taskListTitle = document.getElementById('taskListTitle');
  const taskCountBadge = document.getElementById('taskCountBadge');
  const splashOverlay = document.getElementById('splashOverlay');
  const darkModeToggle = document.getElementById('darkModeToggle');

  let currentQuadrant = null; // 1-4 when task list is open
  let quickAddMode = false;

  // ---------- Theme (Task 6 fixed SVG paths) ----------
  function applyDarkMode(enabled) {
    if (enabled) {
      document.body.classList.add('dark-mode');
      darkModeToggle.querySelector('svg').innerHTML = '<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42"/>';
    } else {
      document.body.classList.remove('dark-mode');
      darkModeToggle.querySelector('svg').innerHTML = '<path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>';
    }
    localStorage.setItem(DARK_MODE_KEY, enabled);
    // Re-render rings to update stroke colour if needed
    renderProgressRings();
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedDark = localStorage.getItem(DARK_MODE_KEY);
  let darkMode = savedDark !== null ? savedDark === 'true' : prefersDark;
  applyDarkMode(darkMode);

  darkModeToggle.addEventListener('click', () => {
    darkMode = !darkMode;
    applyDarkMode(darkMode);
  });

  // ---------- Progress Rings (Task 1: 130px, r=57) ----------
  function renderProgressRings() {
    for (let q = 1; q <= 4; q++) {
      const container = document.getElementById('progress' + q);
      const { total, completed, remaining } = getProgress(q);
      const r = 57;  // for viewBox 0 0 130 130
      const circumference = 2 * Math.PI * r;
      const offset = total === 0 ? circumference : circumference * (1 - completed / total);
      container.innerHTML = `
        <svg class="progress-ring" viewBox="0 0 130 130">
          <circle class="progress-ring-bg" cx="65" cy="65" r="${r}"/>
          <circle class="progress-ring-fill" cx="65" cy="65" r="${r}"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="remaining-number">${remaining}</div>
        <div class="total-text">/ ${total}</div>
      `;
      // ARIA label (Task 9)
      container.setAttribute('aria-label', `${remaining} tasks remaining out of ${total}`);
    }
  }

  // ---------- Task List Rendering (Task 7: drag handle fix) ----------
  function renderTaskList(quadrant) {
    const list = getTasks(quadrant);
    taskItemsContainer.innerHTML = '';
    list.forEach((task, index) => {
      const item = document.createElement('div');
      item.className = 'task-item';
      item.draggable = true;
      item.dataset.index = index;
      item.dataset.id = task.id;

      // Drag handle (6 grey dots) – Task 7: restore missing dots
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
        toggleTask(quadrant, task.id);
        renderTaskList(quadrant);
        renderProgressRings();
      });
      item.appendChild(checkbox);

      // Task text (editable on dblclick)
      const textSpan = document.createElement('span');
      textSpan.className = 'task-text' + (task.completed ? ' completed' : '');
      textSpan.textContent = task.text || 'New task';
      textSpan.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        textSpan.contentEditable = true;
        textSpan.focus();
        const range = document.createRange();
        range.selectNodeContents(textSpan);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });
      textSpan.addEventListener('blur', () => {
        textSpan.contentEditable = false;
        const newText = textSpan.textContent.trim();
        if (newText !== task.text) {
          updateTaskText(quadrant, task.id, newText);
        }
        if (!newText) textSpan.textContent = 'New task';
      });
      textSpan.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          textSpan.blur();
        }
      });
      item.appendChild(textSpan);

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'task-delete-btn';
      deleteBtn.innerHTML = '🗑';
      deleteBtn.title = 'Delete task';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(quadrant, task.id);
        renderTaskList(quadrant);
        renderProgressRings();
      });
      item.appendChild(deleteBtn);

      // Drag events for reordering
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('dragleave', handleDragLeave);
      item.addEventListener('drop', handleDrop);
      item.addEventListener('dragend', handleDragEnd);

      taskItemsContainer.appendChild(item);
    });

    // Update badge
    const { remaining, total } = getProgress(quadrant);
    taskCountBadge.textContent = `${remaining} left of ${total}`;
  }

  // ---------- Drag & Drop (reorder tasks) ----------
  let draggedItem = null;
  let draggedIndex = null;

  function handleDragStart(e) {
    draggedItem = this;
    draggedIndex = parseInt(this.dataset.index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    this.classList.add('dragging');
    setTimeout(() => { this.style.opacity = '0.4'; }, 0);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    this.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    if (draggedItem !== this) {
      const fromIndex = draggedIndex;
      const toIndex = parseInt(this.dataset.index);
      reorderTasks(currentQuadrant, fromIndex, toIndex);
      renderTaskList(currentQuadrant);
      renderProgressRings();
    }
  }

  function handleDragEnd(e) {
    this.style.opacity = '1';
    document.querySelectorAll('.task-item').forEach(item => item.classList.remove('drag-over'));
    draggedItem = null;
    draggedIndex = null;
  }

  // ---------- Navigation & Splash (Task 4: full-screen color, slower) ----------
  function playSplashAnimation(quadrantColorVar, callback) {
    // Use the overlay as a full-screen coloured background
    splashOverlay.style.display = 'block';
    splashOverlay.style.background = `var(${quadrantColorVar})`;
    splashOverlay.style.animation = 'none';
    // Force reflow
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

  function openTaskList(quadrant, quickAdd = false) {
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
        const newTask = addTask(quadrant, '');
        renderTaskList(quadrant);
        renderProgressRings();
        setTimeout(() => {
          const items = taskItemsContainer.querySelectorAll('.task-item');
          const lastItem = items[items.length - 1];
          if (lastItem) {
            const textSpan = lastItem.querySelector('.task-text');
            if (textSpan) {
              textSpan.dblclick();
            }
          }
        }, 100);
      }
    });
  }

  function closeTaskList() {
    taskListPage.classList.remove('active');
    matrixView.style.display = '';
    currentQuadrant = null;
    quickAddMode = false;
    renderProgressRings();
  }

  function resetPlusButton() {
    plusButton.style.transform = 'translate(-50%, -50%)';
    plusButton.classList.remove('dragging');
  }

  // Quadrant click events
  document.querySelectorAll('.quadrant').forEach(q => {
    q.addEventListener('click', (e) => {
      if (e.target.closest('.plus-button')) return;
      const qNum = parseInt(q.dataset.quadrant);
      openTaskList(qNum, false);
    });
  });

  backBtn.addEventListener('click', closeTaskList);

  addTaskBtn.addEventListener('click', () => {
    if (currentQuadrant) {
      addTask(currentQuadrant, '');
      renderTaskList(currentQuadrant);
      renderProgressRings();
      const items = taskItemsContainer.querySelectorAll('.task-item');
      const lastItem = items[items.length - 1];
      if (lastItem) {
        const textSpan = lastItem.querySelector('.task-text');
        if (textSpan) textSpan.dblclick();
      }
    }
  });

  // ---------- Plus Button Dragging ----------
  let isDraggingPlus = false;
  let startX, startY, initialLeft, initialTop;

  plusButton.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    isDraggingPlus = true;
    plusButton.setPointerCapture(e.pointerId);
    const rect = plusButton.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = rect.left + rect.width/2;
    initialTop = rect.top + rect.height/2;
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
    const centerX = gridRect.left + gridRect.width/2;
    const centerY = gridRect.top + gridRect.height/2;
    const btnRect = plusButton.getBoundingClientRect();
    const btnCenterX = btnRect.left + btnRect.width/2;
    const btnCenterY = btnRect.top + btnRect.height/2;

    let quadrant = null;
    if (btnCenterX < centerX && btnCenterY < centerY) quadrant = 1;
    else if (btnCenterX >= centerX && btnCenterY < centerY) quadrant = 2;
    else if (btnCenterX < centerX && btnCenterY >= centerY) quadrant = 3;
    else if (btnCenterX >= centerX && btnCenterY >= centerY) quadrant = 4;

    if (quadrant) {
      openTaskList(quadrant, true);
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

  // ---------- ARIA Labels (Task 9) ----------
  document.querySelectorAll('.quadrant').forEach(q => {
    const num = q.dataset.quadrant;
    const label = q.querySelector('.quadrant-label').textContent;
    q.setAttribute('aria-label', `${label} quadrant, click to view tasks`);
  });
  plusButton.setAttribute('aria-label', 'Drag to add task to a quadrant');
  darkModeToggle.setAttribute('aria-label', 'Toggle dark mode');

  // ---------- Initial Render ----------
  renderProgressRings();
})();