// features/shared/drawer.js
// Settings drawer opened by the ribbon hamburger. Holds calendar controls,
// which are just a UI over the existing Habita calendar API.
window.Habita = window.Habita || {};

(function (app) {
  let drawer, overlay, syncHint, connectBtn, syncRow, syncSwitch, pickRow, select;

  function open() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.hidden = false;
    renderCalendarSection();
  }

  function close() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
  }

  // Show the right controls for the current calendar state (browser / not
  // connected / connected), and fill the picker.
  async function renderCalendarSection() {
    const s = app.calendarSettings();

    if (!s.native) {
      syncHint.textContent = 'Calendar sync works on the phone app, not in the browser preview.';
      connectBtn.hidden = syncRow.hidden = pickRow.hidden = true;
      return;
    }
    if (!s.granted) {
      syncHint.textContent = 'Connect a calendar to block out time for your tasks as real events.';
      connectBtn.hidden = false;
      syncRow.hidden = pickRow.hidden = true;
      return;
    }

    connectBtn.hidden = true;
    syncRow.hidden = false;
    syncSwitch.checked = s.syncEnabled;
    syncHint.textContent = s.syncEnabled
      ? `Syncing to ${s.calendarName || 'your calendar'}.`
      : 'Sync paused — blocks stay in Habita only.';

    // Populate the picker only while sync is on.
    pickRow.hidden = !s.syncEnabled;
    if (s.syncEnabled) {
      const calendars = await app.listCalendars();
      select.innerHTML = '';
      calendars.forEach((cal) => {
        const opt = document.createElement('option');
        opt.value = cal.id;
        opt.textContent = cal.name + (cal.primary ? ' (primary)' : '');
        opt.selected = cal.id === s.calendarId;
        select.appendChild(opt);
      });
    }
  }

  app.initDrawer = function () {
    drawer = document.getElementById('drawer');
    overlay = document.getElementById('drawerOverlay');
    syncHint = document.getElementById('calendarSyncHint');
    connectBtn = document.getElementById('calendarConnectBtn');
    syncRow = document.getElementById('calendarSyncRow');
    syncSwitch = document.getElementById('calendarSyncSwitch');
    pickRow = document.getElementById('calendarPickRow');
    select = document.getElementById('calendarSelect');
    if (!drawer) return;

    document.getElementById('menuBtn').addEventListener('click', open);
    document.getElementById('drawerClose').addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) close();
    });

    connectBtn.addEventListener('click', async () => {
      const ok = await app.initCalendar();
      if (ok) app.syncAllToCalendar();
      renderCalendarSection();
      app.renderTimeline();
    });

    syncSwitch.addEventListener('change', () => {
      app.setCalendarSyncEnabled(syncSwitch.checked);
      renderCalendarSection();
      app.renderTimeline();
    });

    select.addEventListener('change', () => {
      const name = select.options[select.selectedIndex].textContent.replace(' (primary)', '');
      app.setTargetCalendar(select.value, name);
      renderCalendarSection();
      app.renderTimeline();
    });
  };
})(window.Habita);
