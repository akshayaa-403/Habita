// core/calendar.js
// Bridge to the phone's calendar, with a graceful no-op fallback in a browser.
//
// Every scheduled task owns a real event in one of the user's own calendars, so
// the time it blocks out is visible in whatever calendar app they already use.
// This module is the only place that talks to the native plugin; the rest of the
// app calls saveTaskEvent/removeTaskEvent and ignores the transport.
window.Habita = window.Habita || {};

(function (app) {
  const PLUGIN = 'HabitaCalendar';
  const SETTINGS_KEY = 'habita_calendar_settings';

  // Quadrant colours, kept in sync with the CSS custom properties. They are
  // duplicated here because getComputedStyle would return the *current* theme's
  // value, and a calendar event's colour should not depend on dark mode.
  const QUADRANT_COLORS = {
    1: '#EE544F', // Focus      — red
    2: '#00B9D5', // Goals      — blue
    3: '#FBB028', // Fit In     — yellow
    4: '#01C0A6', // Backburner — green
  };

  let settings = loadSettings();
  let permissionGranted = false;

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        calendarId: typeof parsed.calendarId === 'string' ? parsed.calendarId : null,
        calendarName: typeof parsed.calendarName === 'string' ? parsed.calendarName : null,
        // Opt-out switch: the timeline still works locally with sync off.
        syncEnabled: parsed.syncEnabled !== false,
      };
    } catch {
      return { calendarId: null, calendarName: null, syncEnabled: true };
    }
  }

  function persistSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Habita: could not save calendar settings.', err);
    }
  }

  /**
   * Invoke a native plugin method.
   *
   * Two call paths exist depending on how the app was loaded: the bridge exposes
   * ready-made proxies under Capacitor.Plugins when a JS wrapper registered the
   * plugin, and Capacitor.nativePromise otherwise. Trying both keeps this
   * working whether or not @capacitor/core is bundled into the page.
   */
  function callPlugin(method, options = {}) {
    const cap = window.Capacitor;
    if (!cap) return Promise.reject(new Error('Not running inside Capacitor'));

    const plugin = cap.Plugins && cap.Plugins[PLUGIN];
    if (plugin && typeof plugin[method] === 'function') {
      return Promise.resolve(plugin[method](options));
    }
    if (typeof cap.nativePromise === 'function') {
      return cap.nativePromise(PLUGIN, method, options);
    }
    return Promise.reject(new Error(`${PLUGIN}.${method} is unavailable`));
  }

  /** True when running in the Android shell rather than a desktop browser. */
  app.isNativeCalendar = function () {
    const cap = window.Capacitor;
    return Boolean(cap && (typeof cap.isNativePlatform === 'function'
      ? cap.isNativePlatform()
      : cap.isNative));
  };

  app.calendarSettings = function () {
    return { ...settings, granted: permissionGranted, native: app.isNativeCalendar() };
  };

  app.setCalendarSyncEnabled = function (enabled) {
    settings.syncEnabled = Boolean(enabled);
    persistSettings();
  };

  app.setTargetCalendar = function (id, name) {
    settings.calendarId = id || null;
    settings.calendarName = name || null;
    persistSettings();
  };

  /**
   * Ask for calendar permission and pick a target calendar.
   *
   * Safe to call repeatedly -- it short-circuits once permission is held and a
   * calendar has been chosen. Resolves false in a browser, where there is no
   * device calendar to reach.
   */
  app.initCalendar = async function () {
    if (!app.isNativeCalendar()) return false;
    try {
      const { granted } = await callPlugin('ensurePermission');
      permissionGranted = Boolean(granted);
      if (!permissionGranted) return false;

      if (!settings.calendarId) {
        const { calendar } = await callPlugin('getDefaultCalendar');
        if (calendar) app.setTargetCalendar(calendar.id, calendar.name);
      }
      return Boolean(settings.calendarId);
    } catch (err) {
      console.warn('Habita: calendar unavailable.', err);
      permissionGranted = false;
      return false;
    }
  };

  /**
   * The user's existing events in a time range, so the timeline can show what
   * the day already contains before anything is scheduled into it.
   *
   * Habita's own events are filtered out: they are already drawn from the task
   * list, and showing both would double them up.
   */
  app.getDeviceEvents = async function (startMs, endMs) {
    if (!app.isNativeCalendar() || !permissionGranted) return [];
    try {
      const { events } = await callPlugin('listEvents', { start: startMs, end: endMs });
      return (events || []).filter((event) => !event.isHabita && !event.allDay);
    } catch (err) {
      console.warn('Habita: could not read events.', err);
      return [];
    }
  };

  /**
   * Create or update the calendar event backing a scheduled task.
   *
   * @returns {Promise<string|null>} the event id, or null when nothing was
   *   written (browser, permission denied, sync switched off, or task unscheduled).
   */
  app.saveTaskEvent = async function (task, quadrant) {
    if (!settings.syncEnabled || !app.isNativeCalendar() || !permissionGranted) return null;
    if (!settings.calendarId || !task.start) return null;

    const payload = {
      calendarId: settings.calendarId,
      title: task.text || 'Untitled task',
      start: task.start,
      end: task.start + task.duration * 60000,
      color: QUADRANT_COLORS[quadrant] || null,
      taskId: task.id,
      description: `${app.quadrantName(quadrant)} - scheduled in Habita`,
    };

    try {
      if (task.eventId) {
        const { updated } = await callPlugin('updateEvent', { ...payload, eventId: task.eventId });
        // The user may have deleted the event from their calendar app; in that
        // case recreate it rather than silently losing the block.
        if (updated) return task.eventId;
      }
      const { eventId } = await callPlugin('createEvent', payload);
      return eventId || null;
    } catch (err) {
      console.warn('Habita: could not write the calendar event.', err);
      return null;
    }
  };

  /** Remove a task's calendar event. Resolves either way. */
  app.removeTaskEvent = async function (task) {
    if (!task || !task.eventId) return;
    if (!app.isNativeCalendar() || !permissionGranted) return;
    try {
      await callPlugin('deleteEvent', { eventId: task.eventId });
    } catch (err) {
      console.warn('Habita: could not delete the calendar event.', err);
    }
  };
})(window.Habita);
