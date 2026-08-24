// features/timeline/timeline.js
// Day timeline: drag tasks out of the tray onto the clock, move and resize the
// blocks, and see them alongside the events already in the phone's calendar.
//
// Layout maths is deliberately simple: one pixel scale (PX_PER_HOUR) converts
// between a y offset inside the grid and a time of day, and every write goes
// through Habita.scheduleTask so the calendar stays in step.
window.Habita = window.Habita || {};

(function (app) {
  const PX_PER_HOUR = 64;
  const HOURS = 24;
  const MS_PER_MINUTE = 60000;
  /** Movement, in px, before a press counts as a drag rather than a tap. */
  const DRAG_THRESHOLD = 6;

  const state = {
    day: startOfDay(new Date()),
    deviceEvents: [],
    selectedId: null,
    /** Set while a block or tray chip is being dragged. */
    drag: null,
  };

  const el = {};
  let initialized = false;

  // ----- time helpers -----------------------------------------------------
  function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  function dayBounds() {
    const start = state.day.getTime();
    return { start, end: start + HOURS * 60 * MS_PER_MINUTE };
  }

  function minutesToPixels(minutes) {
    return (minutes / 60) * PX_PER_HOUR;
  }

  function pixelsToMinutes(pixels) {
    return (pixels / PX_PER_HOUR) * 60;
  }

  /** Minutes from midnight of the displayed day (may be negative or > 1440). */
  function minutesIntoDay(millis) {
    return (millis - state.day.getTime()) / MS_PER_MINUTE;
  }

  function formatTime(millis) {
    return new Date(millis).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function formatRange(start, durationMinutes) {
    return `${formatTime(start)} – ${formatTime(start + durationMinutes * MS_PER_MINUTE)}`;
  }

  function formatDayLabel(date) {
    const today = startOfDay(new Date()).getTime();
    const shown = startOfDay(date).getTime();
    const dayMs = 24 * 60 * MS_PER_MINUTE;
    if (shown === today) return 'Today';
    if (shown === today + dayMs) return 'Tomorrow';
    if (shown === today - dayMs) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // ----- rendering --------------------------------------------------------
  function renderHourGrid() {
    el.hours.innerHTML = '';
    el.grid.style.height = `${HOURS * PX_PER_HOUR}px`;

    for (let hour = 0; hour < HOURS; hour++) {
      const row = document.createElement('div');
      row.className = 'hour-row';
      row.style.top = `${hour * PX_PER_HOUR}px`;
      row.style.height = `${PX_PER_HOUR}px`;

      const label = document.createElement('span');
      label.className = 'hour-label';
      // 12-hour labels without the noise of ":00" on every row.
      const display = new Date(state.day);
      display.setHours(hour);
      label.textContent = display.toLocaleTimeString([], { hour: 'numeric' });
      row.appendChild(label);

      el.hours.appendChild(row);
    }
  }

  function renderNowLine() {
    const now = Date.now();
    const { start, end } = dayBounds();
    const visible = now >= start && now < end;
    el.nowLine.hidden = !visible;
    if (visible) el.nowLine.style.top = `${minutesToPixels(minutesIntoDay(now))}px`;
  }

  /** Existing calendar events, drawn behind the task blocks in their own lane. */
  function renderDeviceEvents() {
    el.eventsLane.innerHTML = '';
    const { start, end } = dayBounds();

    state.deviceEvents.forEach((event) => {
      if (event.end <= start || event.start >= end) return;

      const clippedStart = Math.max(event.start, start);
      const clippedEnd = Math.min(event.end, end);
      const block = document.createElement('div');
      block.className = 'device-event';
      block.style.top = `${minutesToPixels(minutesIntoDay(clippedStart))}px`;
      block.style.height = `${Math.max(14, minutesToPixels((clippedEnd - clippedStart) / MS_PER_MINUTE))}px`;
      if (event.color) block.style.borderLeftColor = event.color;
      block.innerHTML =
        `<span class="device-event-title"></span><span class="device-event-time"></span>`;
      block.querySelector('.device-event-title').textContent = event.title || 'Busy';
      block.querySelector('.device-event-time').textContent = formatTime(event.start);
      block.title = `${event.title || 'Busy'} · ${formatRange(event.start, (event.end - event.start) / MS_PER_MINUTE)}`;
      el.eventsLane.appendChild(block);
    });
  }

  function renderTaskBlocks() {
    el.tasksLane.innerHTML = '';
    const { start, end } = dayBounds();
    const scheduled = app.getScheduledTasks(start, end);

    // Lay overlapping blocks side by side so nothing hides behind anything else.
    const columns = assignColumns(scheduled);

    scheduled.forEach((task) => {
      const { column, of } = columns.get(task.id);
      const top = minutesToPixels(minutesIntoDay(task.start));
      const height = Math.max(minutesToPixels(app.SNAP_MINUTES), minutesToPixels(task.duration));

      const block = document.createElement('div');
      block.className = `task-block q${task.quadrant}`;
      if (task.completed) block.classList.add('completed');
      if (task.id === state.selectedId) block.classList.add('selected');
      block.dataset.id = task.id;
      block.dataset.quadrant = task.quadrant;
      block.style.top = `${top}px`;
      block.style.height = `${height}px`;
      block.style.left = `${(column / of) * 100}%`;
      block.style.width = `${100 / of}%`;
      block.setAttribute('role', 'button');
      block.tabIndex = 0;
      block.setAttribute(
        'aria-label',
        `${task.text || 'Untitled task'}, ${app.quadrantName(task.quadrant)}, ${formatRange(task.start, task.duration)}`
      );

      block.innerHTML = `
        <div class="task-block-body">
          <span class="task-block-title"></span>
          <span class="task-block-time"></span>
        </div>
        <div class="task-block-actions">
          <button type="button" class="block-btn" data-action="complete" title="Mark done" aria-label="Mark done">✓</button>
          <button type="button" class="block-btn" data-action="unschedule" title="Back to the tray" aria-label="Unschedule">↩</button>
        </div>
        <div class="resize-handle" data-action="resize" title="Drag to change how long this takes"></div>
      `;
      block.querySelector('.task-block-title').textContent = task.text || 'Untitled task';
      block.querySelector('.task-block-time').textContent = formatRange(task.start, task.duration);

      el.tasksLane.appendChild(block);
    });

    el.emptyHint.hidden = scheduled.length > 0;
  }

  /**
   * Work out a column index per task so overlapping blocks can share the width.
   *
   * Greedy sweep: tasks are visited in start order and dropped into the first
   * column whose last block has already finished.
   */
  function assignColumns(scheduled) {
    const sorted = [...scheduled].sort((a, b) => a.start - b.start);
    const assignments = new Map();
    /** Each cluster is a group of blocks that transitively overlap. */
    let cluster = [];
    let clusterEnd = -Infinity;
    const columnEnds = [];

    const flush = () => {
      cluster.forEach((id) => {
        assignments.get(id).of = columnEnds.length || 1;
      });
      cluster = [];
      columnEnds.length = 0;
      clusterEnd = -Infinity;
    };

    sorted.forEach((task) => {
      const end = task.start + task.duration * MS_PER_MINUTE;
      if (task.start >= clusterEnd) flush();

      let column = columnEnds.findIndex((columnEnd) => columnEnd <= task.start);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(end);
      } else {
        columnEnds[column] = end;
      }

      assignments.set(task.id, { column, of: 1 });
      cluster.push(task.id);
      clusterEnd = Math.max(clusterEnd, end);
    });
    flush();

    return assignments;
  }

  function renderTray() {
    const unscheduled = app.getUnscheduledTasks();
    el.tray.innerHTML = '';

    if (unscheduled.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'tray-empty';
      empty.textContent = 'Nothing waiting — every open task has a slot.';
      el.tray.appendChild(empty);
    } else {
      unscheduled.forEach((task) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `tray-chip q${task.quadrant}`;
        chip.dataset.id = task.id;
        chip.dataset.quadrant = task.quadrant;
        chip.title = `${app.quadrantName(task.quadrant)} · drag onto the day, or tap to drop at the next free slot`;
        chip.innerHTML = '<span class="chip-text"></span>';
        chip.querySelector('.chip-text').textContent = task.text || 'Untitled task';
        el.tray.appendChild(chip);
      });
    }
    el.trayCount.textContent = unscheduled.length ? `${unscheduled.length} unscheduled` : '';
  }

  function renderHeader() {
    el.dayLabel.textContent = formatDayLabel(state.day);
    el.dayDate.textContent = state.day.toLocaleDateString([], {
      weekday: 'long', day: 'numeric', month: 'long',
    });

    const settings = app.calendarSettings();
    if (!settings.native) {
      el.calendarStatus.textContent = 'Browser preview — device calendar unavailable';
      el.calendarStatus.className = 'calendar-status muted';
    } else if (!settings.granted) {
      el.calendarStatus.textContent = 'Calendar access not granted — tap to connect';
      el.calendarStatus.className = 'calendar-status warn';
    } else if (!settings.syncEnabled) {
      el.calendarStatus.textContent = 'Calendar sync paused';
      el.calendarStatus.className = 'calendar-status muted';
    } else {
      el.calendarStatus.textContent = `Syncing to ${settings.calendarName || 'your calendar'}`;
      el.calendarStatus.className = 'calendar-status ok';
    }
  }

  /** Full redraw. Cheap enough at this scale to avoid partial-update bugs. */
  function render() {
    renderHeader();
    renderTray();
    renderDeviceEvents();
    renderTaskBlocks();
    renderNowLine();
  }

  app.renderTimeline = render;

  // ----- dragging ---------------------------------------------------------
  /** Grid-relative y for a pointer event, clamped to the day. */
  function gridY(clientY) {
    const rect = el.grid.getBoundingClientRect();
    return Math.min(Math.max(clientY - rect.top, 0), HOURS * PX_PER_HOUR);
  }

  function startMillisFromY(y) {
    return app.snapTime(state.day.getTime() + pixelsToMinutes(y) * MS_PER_MINUTE);
  }

  /** Live time read-out that follows the drag. */
  function showTooltip(text, clientX, clientY) {
    el.tooltip.textContent = text;
    el.tooltip.hidden = false;
    el.tooltip.style.left = `${clientX}px`;
    el.tooltip.style.top = `${clientY}px`;
  }

  function hideTooltip() {
    el.tooltip.hidden = true;
  }

  function beginBlockDrag(event, block, mode) {
    const taskId = block.dataset.id;
    const found = app.findTask(taskId);
    if (!found) return;

    state.drag = {
      kind: mode, // 'move' | 'resize'
      taskId,
      quadrant: found.quadrant,
      block,
      startY: event.clientY,
      originalStart: found.task.start,
      originalDuration: found.task.duration,
      moved: false,
    };
    block.classList.add('dragging');
    block.setPointerCapture(event.pointerId);
  }

  function beginChipDrag(event, chip) {
    const taskId = chip.dataset.id;
    const found = app.findTask(taskId);
    if (!found) return;

    const ghost = document.createElement('div');
    ghost.className = `drag-ghost q${found.quadrant}`;
    ghost.textContent = found.task.text || 'Untitled task';
    document.body.appendChild(ghost);
    positionGhost(ghost, event.clientX, event.clientY);

    state.drag = {
      kind: 'create',
      taskId,
      quadrant: found.quadrant,
      duration: found.task.duration,
      ghost,
      startY: event.clientY,
      startX: event.clientX,
      moved: false,
    };
    chip.setPointerCapture(event.pointerId);
  }

  function positionGhost(ghost, clientX, clientY) {
    ghost.style.left = `${clientX}px`;
    ghost.style.top = `${clientY}px`;
  }

  function onPointerMove(event) {
    const drag = state.drag;
    if (!drag) return;

    const dy = event.clientY - drag.startY;
    const dx = (event.clientX || 0) - (drag.startX || 0);
    if (!drag.moved && Math.abs(dy) < DRAG_THRESHOLD && Math.abs(dx) < DRAG_THRESHOLD) return;
    drag.moved = true;
    event.preventDefault();

    if (drag.kind === 'create') {
      positionGhost(drag.ghost, event.clientX, event.clientY);
      const inside = isOverGrid(event.clientX, event.clientY);
      drag.ghost.classList.toggle('over-grid', inside);
      if (inside) {
        showTooltip(formatRange(startMillisFromY(gridY(event.clientY)), drag.duration), event.clientX, event.clientY);
      } else {
        hideTooltip();
      }
      return;
    }

    const deltaMinutes = pixelsToMinutes(dy);
    if (drag.kind === 'move') {
      const preview = app.snapTime(drag.originalStart + deltaMinutes * MS_PER_MINUTE);
      drag.previewStart = preview;
      drag.block.style.top = `${minutesToPixels(minutesIntoDay(preview))}px`;
      drag.block.querySelector('.task-block-time').textContent = formatRange(preview, drag.originalDuration);
      showTooltip(formatRange(preview, drag.originalDuration), event.clientX, event.clientY);
    } else {
      const snapped = Math.max(
        app.SNAP_MINUTES,
        Math.round((drag.originalDuration + deltaMinutes) / app.SNAP_MINUTES) * app.SNAP_MINUTES
      );
      drag.previewDuration = snapped;
      drag.block.style.height = `${minutesToPixels(snapped)}px`;
      drag.block.querySelector('.task-block-time').textContent = formatRange(drag.originalStart, snapped);
      showTooltip(`${snapped} min`, event.clientX, event.clientY);
    }
  }

  function isOverGrid(clientX, clientY) {
    const rect = el.grid.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }

  function onPointerUp(event) {
    const drag = state.drag;
    if (!drag) return;
    state.drag = null;
    hideTooltip();

    if (drag.kind === 'create') {
      drag.ghost.remove();
      if (drag.moved && isOverGrid(event.clientX, event.clientY)) {
        app.scheduleTask(drag.quadrant, drag.taskId, startMillisFromY(gridY(event.clientY)));
      } else if (!drag.moved) {
        // A tap, not a drag: put it in the next free slot so the tray still
        // works one-handed.
        scheduleAtNextFreeSlot(drag.quadrant, drag.taskId, drag.duration);
      }
      render();
      app.renderProgressRings();
      return;
    }

    drag.block.classList.remove('dragging');
    if (!drag.moved) {
      state.selectedId = state.selectedId === drag.taskId ? null : drag.taskId;
      render();
      return;
    }

    if (drag.kind === 'move' && drag.previewStart != null) {
      app.scheduleTask(drag.quadrant, drag.taskId, drag.previewStart);
    } else if (drag.kind === 'resize' && drag.previewDuration != null) {
      app.scheduleTask(drag.quadrant, drag.taskId, drag.originalStart, drag.previewDuration);
    }
    render();
  }

  /**
   * Find the earliest slot on the displayed day that clears both existing blocks
   * and the phone's own events, starting from now (or 8am on another day).
   */
  function scheduleAtNextFreeSlot(quadrant, taskId, durationMinutes) {
    const { start, end } = dayBounds();
    const now = Date.now();
    const isToday = now >= start && now < end;
    let candidate = app.snapTime(isToday ? now : start + 8 * 60 * MS_PER_MINUTE);
    const length = durationMinutes * MS_PER_MINUTE;

    const busy = [
      ...app.getScheduledTasks(start, end).map((t) => ({
        start: t.start,
        end: t.start + t.duration * MS_PER_MINUTE,
      })),
      ...state.deviceEvents.map((e) => ({ start: e.start, end: e.end })),
    ].sort((a, b) => a.start - b.start);

    for (const span of busy) {
      if (candidate + length <= span.start) break;
      if (candidate < span.end) candidate = app.snapTime(span.end);
    }
    // If the day is genuinely full, land at the end rather than refusing.
    if (candidate + length > end) candidate = end - length;

    app.scheduleTask(quadrant, taskId, candidate, durationMinutes);
  }

  // ----- events -----------------------------------------------------------
  function initPointerHandlers() {
    el.tasksLane.addEventListener('pointerdown', (event) => {
      const action = event.target.closest('[data-action]');
      const block = event.target.closest('.task-block');
      if (!block) return;

      if (action && action.dataset.action === 'complete') {
        app.toggleTask(Number(block.dataset.quadrant), block.dataset.id);
        render();
        app.renderProgressRings();
        return;
      }
      if (action && action.dataset.action === 'unschedule') {
        app.unscheduleTask(Number(block.dataset.quadrant), block.dataset.id);
        render();
        return;
      }
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      beginBlockDrag(event, block, action && action.dataset.action === 'resize' ? 'resize' : 'move');
    });

    el.tray.addEventListener('pointerdown', (event) => {
      const chip = event.target.closest('.tray-chip');
      if (!chip) return;
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      event.preventDefault();
      beginChipDrag(event, chip);
    });

    // Capture-phase listeners on the document: pointer capture keeps events
    // flowing to the origin element, and this way one handler covers both.
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', (event) => {
      if (state.drag && state.drag.ghost) state.drag.ghost.remove();
      if (state.drag && state.drag.block) state.drag.block.classList.remove('dragging');
      state.drag = null;
      hideTooltip();
      render();
      void event;
    });

    // Keyboard: nudge a selected block without a pointer.
    el.tasksLane.addEventListener('keydown', (event) => {
      const block = event.target.closest('.task-block');
      if (!block) return;
      const found = app.findTask(block.dataset.id);
      if (!found) return;
      const quadrant = Number(block.dataset.quadrant);
      const step = app.SNAP_MINUTES * MS_PER_MINUTE;

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const direction = event.key === 'ArrowUp' ? -1 : 1;
        app.scheduleTask(quadrant, found.task.id, found.task.start + direction * step);
      } else if (event.key === '+' || event.key === '=') {
        app.scheduleTask(quadrant, found.task.id, found.task.start, found.task.duration + app.SNAP_MINUTES);
      } else if (event.key === '-') {
        app.scheduleTask(quadrant, found.task.id, found.task.start, found.task.duration - app.SNAP_MINUTES);
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        app.unscheduleTask(quadrant, found.task.id);
      } else {
        return;
      }
      event.preventDefault();
      render();
      // Keep focus on the block the user is nudging.
      const again = el.tasksLane.querySelector(`.task-block[data-id="${found.task.id}"]`);
      if (again) again.focus();
    });
  }

  async function goToDay(date) {
    state.day = startOfDay(date);
    state.selectedId = null;
    await refreshDeviceEvents();
    render();
    scrollToInterestingHour();
  }

  async function refreshDeviceEvents() {
    const { start, end } = dayBounds();
    state.deviceEvents = await app.getDeviceEvents(start, end);
  }

  /** Open on the current hour today, or the working morning on other days. */
  function scrollToInterestingHour() {
    const { start, end } = dayBounds();
    const now = Date.now();
    const hour = now >= start && now < end ? new Date(now).getHours() : 8;
    el.scroller.scrollTop = Math.max(0, (hour - 1) * PX_PER_HOUR);
  }

  function initHeaderControls() {
    el.prevDay.addEventListener('click', () => goToDay(new Date(state.day.getTime() - 86400000)));
    el.nextDay.addEventListener('click', () => goToDay(new Date(state.day.getTime() + 86400000)));
    el.todayBtn.addEventListener('click', () => goToDay(new Date()));

    el.calendarStatus.addEventListener('click', async () => {
      const settings = app.calendarSettings();
      if (!settings.native) return;
      if (!settings.granted) {
        const ok = await app.initCalendar();
        if (ok) {
          // Blocks created before access was granted have no event yet.
          app.syncAllToCalendar();
          await refreshDeviceEvents();
        }
      } else {
        app.setCalendarSyncEnabled(!settings.syncEnabled);
      }
      render();
    });
  }

  /**
   * Wire up the timeline. The view stays hidden until the user switches to it.
   *
   * Idempotent: some of the listeners live on `document`, so a second call would
   * otherwise double every drag and keystroke.
   */
  app.initTimeline = async function () {
    if (initialized) return;
    initialized = true;

    // short name -> element id
    const elements = {
      view: 'timelineView', scroller: 'timelineScroller', grid: 'timelineGrid', hours: 'hourLines',
      eventsLane: 'deviceEventsLane', tasksLane: 'taskBlocksLane', nowLine: 'nowLine',
      tray: 'timelineTray', trayCount: 'trayCount', dayLabel: 'dayLabel', dayDate: 'dayDate',
      prevDay: 'prevDayBtn', nextDay: 'nextDayBtn', todayBtn: 'todayBtn',
      calendarStatus: 'calendarStatus', tooltip: 'dragTooltip', emptyHint: 'timelineEmptyHint',
    };
    for (const [key, id] of Object.entries(elements)) el[key] = document.getElementById(id);
    if (!el.view) return;

    renderHourGrid();
    initPointerHandlers();
    initHeaderControls();

    render();
    scrollToInterestingHour();

    // Keep the "now" line honest without redrawing the whole view.
    setInterval(renderNowLine, 60000);

    // Permission and calendar discovery happen after first paint, so a cold
    // start is not blocked on the system dialog.
    const connected = await app.initCalendar();
    if (connected) {
      app.syncAllToCalendar();
      await refreshDeviceEvents();
    }
    render();
  };

  /**
   * Schedule a task chosen from the task list rather than the tray.
   *
   * Jumps forward to today first if the timeline is parked on a past day, so a
   * task never lands in a slot that has already gone.
   */
  app.scheduleTaskFromList = function (quadrant, taskId) {
    const found = app.findTask(taskId);
    if (!found) return;

    const today = startOfDay(new Date());
    if (state.day.getTime() < today.getTime()) state.day = today;

    scheduleAtNextFreeSlot(quadrant, taskId, found.task.duration);
    state.selectedId = taskId;
    render();
    scrollToInterestingHour();
  };

  /** Called when the timeline becomes visible: re-read the calendar. */
  app.timelineDidShow = async function () {
    render();
    scrollToInterestingHour();
    await refreshDeviceEvents();
    render();
  };
})(window.Habita);
