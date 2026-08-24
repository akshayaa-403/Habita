# Habita

![License](https://img.shields.io/badge/License-MIT-blue.svg) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow.svg) ![HTML5](https://img.shields.io/badge/HTML5-E34F26.svg?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6.svg?logo=css3&logoColor=white) ![Android](https://img.shields.io/badge/Android-Capacitor-3DDC84.svg?logo=android&logoColor=white) ![LocalStorage](https://img.shields.io/badge/storage-localStorage-brightgreen.svg)

An Android task manager built on the Eisenhower Matrix. Sort tasks by urgency and
importance, then **drag them onto a day timeline that writes real events into the
phone's own calendar** — so the time you set aside shows up wherever you already
look, not only inside this app.

Two views, one model:

- **Matrix** — four colour-coded quadrants (Focus, Backburner, Fit In, Goals) with progress rings.
- **Day** — an hour grid where each task becomes a block in its quadrant's colour. Drag to place it, drag again to move it, pull the bottom edge to change how long it takes.

## Features

| Feature | Description |
|---|---|
| **Quadrant Matrix View** | Four colour-coded boards: `Urgent & Important`, `Not Urgent & Important`, `Urgent & Not Important`, `Not Urgent & Not Important`. Tap any quadrant to drill down. |
| **Day Timeline** | A 24-hour grid with 15-minute snapping. Unscheduled tasks wait in a tray; drag one onto an hour to block out time for it. |
| **Calendar Sync** | Every scheduled task becomes a real event in a calendar you choose, tinted to match its quadrant. Move or resize the block and the event follows; unschedule it and the event goes away. |
| **Your Existing Events** | The day view reads what is already in your calendar and draws it in its own lane, so you can see what a slot would collide with before you take it. |
| **Tap to Auto-Place** | Tapping a task in the tray drops it into the earliest slot that clears both your other blocks and your existing calendar events. |
| **Live Progress Rings** | Each quadrant shows an SVG ring with the number of remaining tasks, updating as you check things off. |
| **Drag & Drop Reordering** | Inside a task list, reorder by dragging the six-dot handle. |
| **Inline Task Editing** | Double-click a task name to edit it. Renaming a scheduled task renames its calendar event too. |
| **Dark Mode** | Follows the system preference on first run and remembers your choice. |
| **Persistent Storage** | Tasks, schedules and settings live in `localStorage`; nothing is sent anywhere. |
| **Haptic Feedback** | Completing a task triggers a light vibration via Capacitor Haptics, with a Web Vibration fallback. |
| **Keyboard & A11y** | Quadrants and blocks are focusable, controls carry ARIA labels, and a focused block can be nudged with `↑`/`↓`, resized with `+`/`-`, and unscheduled with `Delete`. |

---

## How the calendar integration works

There is no third-party calendar dependency. `android/app/src/main/java/com/habita/app/CalendarPlugin.java`
is a local Capacitor plugin over Android's `CalendarContract`, exposing exactly
what the timeline needs:

| Method | Purpose |
|---|---|
| `ensurePermission` / `isAvailable` | Request and check `READ_CALENDAR` / `WRITE_CALENDAR` |
| `listCalendars` / `getDefaultCalendar` | Discover writable calendars; prefer the primary one |
| `listEvents` | Occurrences overlapping a range, read from the **Instances** table so recurring events expand properly |
| `createEvent` / `updateEvent` / `deleteEvent` | Keep one event per scheduled task |

Details that matter in practice:

- **Colours** go through the account's own palette (`EVENT_COLOR_KEY`, matched to
  the nearest entry) because several providers ignore a raw `EVENT_COLOR`; writing
  the literal value is the fallback.
- **Events Habita created carry a marker** in their description, so the timeline
  can tell its own blocks apart from the rest of your calendar and never draws
  them twice.
- **Updates are partial.** Moving a block writes only the times, so a description
  you edited in your calendar app survives.
- **A deleted event is not an error.** If `updateEvent` reports that the event has
  gone — because you deleted it elsewhere — the block is recreated rather than
  silently lost.
- **Permission is requested after first paint**, never as the app's opening move,
  and everything still works if you decline: the timeline just stays local. Blocks
  made before you granted access are pushed to the calendar once you do.

---

## Getting Started

```bash
git clone https://github.com/akshayaa-403/Habita.git
cd Habita
npm install
```

### Run in a browser

The app is authored in `src/` and copied into `www/` (Capacitor's web dir) by a
tiny build step — no bundler, just a file copy:

```bash
npm start                      # → npm run build, then npx serve www
npm run build                  # copy src/ → www/ on its own
```

`www/` is generated, so edit files under `src/` and re-run the build (or `npm start`).

The matrix and the timeline both work in a browser; only the device-calendar sync
is unavailable there, and the day view says so instead of failing.

### Build and run on Android

```bash
npm run android      # cap sync android && cap open android
```

Then Run ▶ from Android Studio. Or straight from the command line:

```bash
npm run sync
cd android && ./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

Requires the Android SDK (compileSdk 36, minSdk 24) and a JDK 21 — the one bundled
with Android Studio works.

### Tests

```bash
npm test
```

Loads `www/index.html` in jsdom and drives the real UI — dragging a chip out of
the tray onto an hour, moving the block, resizing it, ticking it off, unscheduling
it — then asserts on the persisted model. Covers the pixel-to-time maths, the
overlap layout, and the migration of tasks saved by earlier versions.

---

## Project Structure

```
Habita/
├── src/                          # Web app source — edit here (grouped by feature)
│   ├── index.html                # Matrix, timeline, task list, bottom nav
│   ├── styles/styles.css         # Themes, quadrant grid, timeline, responsive layout
│   ├── assets/                   # Images/icons bundled into the web app
│   ├── app/
│   │   └── main.js               # Bootstraps theme, UI, rings and the timeline
│   ├── core/                     # Platform + data layer
│   │   ├── storage.js            # Load/save, id generation, shape migration
│   │   └── calendar.js           # Bridge to the native plugin, with a browser fallback
│   └── features/
│       ├── tasks/tasks.js        # CRUD, completion, reordering, scheduling, haptics
│       ├── matrix/progress.js    # SVG progress rings
│       ├── timeline/timeline.js  # Day grid, drag/move/resize, auto-placement
│       └── shared/
│           ├── theme.js          # Dark mode, localStorage, system preference
│           └── ui.js             # Task lists, inline editing, navigation
├── scripts/build.js              # Copies src/ → www/ (run before cap sync / tests)
├── www/                          # Generated web build output (git-ignored)
├── android/                      # Native Android project (Capacitor)
│   └── app/src/main/java/com/habita/app/
│       ├── MainActivity.java     # Registers the local plugin before the bridge starts
│       └── CalendarPlugin.java   # CalendarContract read/write
├── tests/timeline.test.mjs       # Headless jsdom test of the timeline
├── capacitor.config.json
├── package.json
├── LICENSE
└── .gitignore
```

---

## How to Use

1. **Sort first.** On the matrix, tap a quadrant to open its list, or drag the centre **+** onto a quadrant to add a task straight there.
2. **Then schedule.** Switch to **Day**. Open tasks wait in the *Waiting* tray at the top.
3. **Place a block.** Drag a chip from the tray onto an hour — it snaps to 15 minutes and a live read-out shows the exact slot. Tapping the chip instead drops it in the next free slot.
4. **Adjust it.** Drag the block to move it; pull its bottom edge to change the duration. Both write straight through to your calendar.
5. **Check the collisions.** Your existing calendar events sit in the left lane, so you can see what a slot runs into.
6. **Finish or free it.** ✓ ticks the task off; ↩ sends it back to the tray and removes the calendar event.
7. **Change day.** Use ‹ / › or **Today**. Blocks can sit on any day, not just today.
8. **Connect or pause sync.** The line under the date shows the calendar status — tap it to grant access, or to pause syncing and keep the schedule local.

---

## Design Notes

- **Sorting and scheduling are separate acts.** The matrix answers *does this matter*; the timeline answers *when*. Nothing is auto-scheduled — deciding what gets real time is the point of the exercise.
- **The phone's calendar is the source of truth for time.** Habita writes to it rather than keeping a private schedule, so a blocked-out hour is visible to everything else that reads your calendar.
- **Overlapping blocks split the width** instead of hiding one another, so a double-booked hour looks double-booked.
- **Nothing leaves the device.** No account, no network calls, no analytics.

## 📜 License

Distributed under the **MIT License**. See the `LICENSE` file for full text.
