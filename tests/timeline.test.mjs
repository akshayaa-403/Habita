/**
 * Headless test for the day timeline, run with `npm test`.
 *
 * Loads www/index.html in jsdom and drives the real UI rather than calling
 * internals: drag a chip out of the tray onto an hour, move the block, resize
 * it, tick it off, unschedule it. Assertions are made against the persisted
 * task model, so the pixel-to-time maths, the rendering and the storage
 * migration are all covered.
 *
 * The native calendar is not exercised here -- there is no CalendarContract in
 * a browser -- but the bridge's browser fallback is, which is what keeps the
 * timeline usable in `npm start`.
 */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const WWW = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PX_PER_HOUR = 64;
const GRID_HEIGHT = 24 * PX_PER_HOUR;

const html = readFileSync(path.join(WWW, 'index.html'), 'utf8');

const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'dangerously',
  resources: undefined,
  pretendToBeVisual: true,
});
const { window } = dom;

// jsdom ships no pointer-capture API and measures every element as 0x0, so the
// few DOM capabilities the timeline relies on are stubbed here.
window.Element.prototype.setPointerCapture = function () {};
window.Element.prototype.releasePointerCapture = function () {};
window.Element.prototype.scrollTo = function () {};
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

// Load the app's scripts in document order (jsdom will not fetch them itself
// without a resource loader).
for (const script of window.document.querySelectorAll('script[src]')) {
  const code = readFileSync(path.join(WWW, script.getAttribute('src')), 'utf8');
  window.eval(code);
}

const { Habita } = window;
assert.ok(Habita, 'Habita namespace should exist');

// Fresh state for every run.
window.localStorage.clear();

function stubRect(element, rect) {
  element.getBoundingClientRect = () => ({
    x: rect.left, y: rect.top,
    left: rect.left, top: rect.top,
    right: rect.right, bottom: rect.bottom,
    width: rect.right - rect.left, height: rect.bottom - rect.top,
    toJSON: () => rect,
  });
}

function pointer(type, target, clientX, clientY) {
  const event = new window.MouseEvent(type, {
    bubbles: true, cancelable: true, clientX, clientY, button: 0,
  });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  Object.defineProperty(event, 'pointerType', { value: 'touch' });
  target.dispatchEvent(event);
  return event;
}

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push(['pass', name]);
  } catch (err) {
    results.push(['FAIL', `${name}: ${err.message}`]);
  }
}

// --- boot -----------------------------------------------------------------
// main.js already ran init() on load; initTimeline is async, so let its
// permission probe settle before driving the UI.
await new Promise((resolve) => setTimeout(resolve, 0));
await Habita.initTimeline(); // second call must be a no-op

const doc = window.document;
const grid = doc.getElementById('timelineGrid');
// A 400px-wide grid starting at the top of the viewport.
stubRect(grid, { left: 0, top: 0, right: 400, bottom: GRID_HEIGHT });

check('starts with an empty model', () => {
  assert.equal(Habita.getAllTasks().length, 0);
  assert.equal(Habita.getUnscheduledTasks().length, 0);
});

check('browser build reports no native calendar', () => {
  assert.equal(Habita.isNativeCalendar(), false);
  assert.equal(Habita.calendarSettings().native, false);
});

// --- tray population ------------------------------------------------------
const focusTask = Habita.addTask(1, 'Write the incident report');
Habita.addTask(2, 'Plan next quarter');
Habita.addTask(3, 'Reply to the vendor');
Habita.renderTimeline();

check('unscheduled tasks appear in the tray, coloured by quadrant', () => {
  const chips = doc.querySelectorAll('.tray-chip');
  assert.equal(chips.length, 3);
  assert.ok(chips[0].classList.contains('q1'), 'first chip keeps its quadrant class');
  assert.equal(chips[0].textContent.trim(), 'Write the incident report');
  assert.match(doc.getElementById('trayCount').textContent, /3 unscheduled/);
});

check('the day view starts on today', () => {
  assert.equal(doc.getElementById('dayLabel').textContent, 'Today');
});

// --- drag a chip onto 10:00 ----------------------------------------------
const chip = doc.querySelector(`.tray-chip[data-id="${focusTask.id}"]`);
const tenAm = 10 * PX_PER_HOUR;
pointer('pointerdown', chip, 40, GRID_HEIGHT + 200); // press starts below the grid
pointer('pointermove', doc, 200, tenAm);             // drag up onto 10:00
pointer('pointerup', doc, 200, tenAm);

check('dragging a chip onto the grid schedules it at that hour', () => {
  const found = Habita.findTask(focusTask.id);
  assert.ok(found.task.start, 'task should now have a start time');
  const start = new Date(found.task.start);
  assert.equal(start.getHours(), 10);
  assert.equal(start.getMinutes(), 0);
  assert.equal(found.task.duration, 30, 'default block length');
});

check('a scheduled task leaves the tray and becomes a block', () => {
  assert.equal(doc.querySelectorAll('.tray-chip').length, 2);
  const block = doc.querySelector(`.task-block[data-id="${focusTask.id}"]`);
  assert.ok(block, 'a block should be rendered');
  assert.ok(block.classList.contains('q1'), 'block carries the quadrant colour class');
  assert.equal(block.style.top, `${tenAm}px`);
  assert.equal(block.style.height, `${PX_PER_HOUR / 2}px`, '30 minutes is half an hour tall');
});

// --- move the block down two hours --------------------------------------
let block = doc.querySelector(`.task-block[data-id="${focusTask.id}"]`);
pointer('pointerdown', block, 200, tenAm + 10);
pointer('pointermove', doc, 200, tenAm + 10 + 2 * PX_PER_HOUR);
pointer('pointerup', doc, 200, tenAm + 10 + 2 * PX_PER_HOUR);

check('dragging a block moves it in time', () => {
  const start = new Date(Habita.findTask(focusTask.id).task.start);
  assert.equal(start.getHours(), 12, 'moved two hours later');
  assert.equal(start.getMinutes(), 0);
});

// --- resize to 90 minutes ------------------------------------------------
block = doc.querySelector(`.task-block[data-id="${focusTask.id}"]`);
const handle = block.querySelector('.resize-handle');
const blockTop = 12 * PX_PER_HOUR;
pointer('pointerdown', handle, 200, blockTop + 32);
pointer('pointermove', doc, 200, blockTop + 32 + PX_PER_HOUR); // +60 minutes
pointer('pointerup', doc, 200, blockTop + 32 + PX_PER_HOUR);

check('dragging the handle changes the duration, not the start', () => {
  const { task } = Habita.findTask(focusTask.id);
  assert.equal(task.duration, 90, '30 + 60 minutes');
  assert.equal(new Date(task.start).getHours(), 12, 'start is unchanged');
});

check('durations snap to the 15-minute grid', () => {
  const { task } = Habita.findTask(focusTask.id);
  assert.equal(task.duration % Habita.SNAP_MINUTES, 0);
});

// --- tap a chip: auto-place in the next free slot ------------------------
const secondChip = doc.querySelector('.tray-chip');
const secondId = secondChip.dataset.id;
pointer('pointerdown', secondChip, 40, 500);
pointer('pointerup', secondChip, 40, 500); // no movement => a tap

check('tapping a chip places it without a drag', () => {
  const { task } = Habita.findTask(secondId);
  assert.ok(task.start, 'tapped task should be scheduled');
});

check('auto-placement does not overlap the existing block', () => {
  const first = Habita.findTask(focusTask.id).task;
  const second = Habita.findTask(secondId).task;
  const firstEnd = first.start + first.duration * 60000;
  const secondEnd = second.start + second.duration * 60000;
  const overlaps = second.start < firstEnd && secondEnd > first.start;
  assert.equal(overlaps, false, 'blocks must not overlap');
});

// --- overlapping blocks share the width ---------------------------------
check('overlapping blocks are laid out side by side', () => {
  const first = Habita.findTask(focusTask.id).task;
  const third = Habita.getUnscheduledTasks()[0];
  Habita.scheduleTask(3, third.id, first.start + 15 * 60000, 60);
  Habita.renderTimeline();

  const blocks = [...doc.querySelectorAll('.task-block')]
    .filter((b) => [focusTask.id, third.id].includes(b.dataset.id));
  assert.equal(blocks.length, 2);
  const widths = blocks.map((b) => b.style.width);
  assert.ok(widths.every((w) => w === '50%'), `expected two half-width blocks, got ${widths}`);
  assert.notEqual(blocks[0].style.left, blocks[1].style.left, 'they sit in different columns');
});

// --- unschedule ----------------------------------------------------------
check('the unschedule button returns a block to the tray', () => {
  const target = doc.querySelector(`.task-block[data-id="${focusTask.id}"]`);
  const button = target.querySelector('[data-action="unschedule"]');
  pointer('pointerdown', button, 200, 700);
  assert.equal(Habita.findTask(focusTask.id).task.start, null);
  assert.ok(doc.querySelector(`.tray-chip[data-id="${focusTask.id}"]`), 'chip is back in the tray');
});

check('the block complete button ticks the task off', () => {
  const anyBlock = doc.querySelector('.task-block');
  const id = anyBlock.dataset.id;
  pointer('pointerdown', anyBlock.querySelector('[data-action="complete"]'), 200, 700);
  assert.equal(Habita.findTask(id).task.completed, true);
});

// --- keyboard nudging ---------------------------------------------------
check('arrow keys nudge a focused block by one snap step', () => {
  const scheduled = Habita.getAllTasks().find((t) => t.start);
  const target = doc.querySelector(`.task-block[data-id="${scheduled.id}"]`);
  const before = Habita.findTask(scheduled.id).task.start;
  const event = new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  const after = Habita.findTask(scheduled.id).task.start;
  assert.equal(after - before, Habita.SNAP_MINUTES * 60000);
});

// --- persistence and migration ------------------------------------------
check('state survives a reload', () => {
  const saved = JSON.parse(window.localStorage.getItem('habita_tasks'));
  const reloaded = Habita.loadTasks();
  assert.equal(Object.keys(saved).length, 4);
  const scheduledCount = Object.values(reloaded).flat().filter((t) => t.start).length;
  assert.ok(scheduledCount >= 1, 'scheduled tasks are persisted');
});

check('tasks saved by the old version gain scheduling fields', () => {
  window.localStorage.setItem(
    'habita_tasks',
    JSON.stringify({ q1: [{ id: 7, text: 'legacy', completed: false }], q2: [], q3: [], q4: [] })
  );
  const migrated = Habita.loadTasks().q1[0];
  assert.equal(migrated.id, '7', 'numeric ids become strings');
  assert.equal(migrated.start, null);
  assert.equal(migrated.duration, Habita.DEFAULT_DURATION);
  assert.equal(migrated.eventId, null);
  assert.ok(Number.isFinite(migrated.createdAt));
});

// --- view switching -----------------------------------------------------
check('the bottom nav switches between the matrix and the day', () => {
  Habita.showView('timeline');
  assert.equal(doc.getElementById('timelineView').hidden, false);
  assert.equal(doc.getElementById('matrixView').hidden, true);
  assert.ok(doc.querySelector('.nav-tab[data-view="timeline"]').classList.contains('active'));

  Habita.showView('matrix');
  assert.equal(doc.getElementById('matrixView').hidden, false);
  assert.equal(doc.getElementById('timelineView').hidden, true);
});

// --- report -------------------------------------------------------------
const failures = results.filter(([status]) => status === 'FAIL');
for (const [status, name] of results) {
  console.log(`${status === 'pass' ? '  ok  ' : ' FAIL '} ${name}`);
}
console.log(`\n${results.length - failures.length}/${results.length} checks passed`);
process.exit(failures.length ? 1 : 0);
