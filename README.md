# Habita

![License](https://img.shields.io/badge/License-MIT-blue.svg) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow.svg) ![HTML5](https://img.shields.io/badge/HTML5-E34F26.svg?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6.svg?logo=css3&logoColor=white) ![LocalStorage](https://img.shields.io/badge/storage-localStorage-brightgreen.svg) ![Status](https://img.shields.io/badge/status-production-important.svg)

Habita is a visual task manager based on the Eisenhower Matrix that organizes tasks into four urgency-importance quadrants. It eliminates scattered to-do lists, helping you focus on what truly matters and ship high-impact work faster — all with drag-and-drop, dark mode, and persistent local storage.

## Features

| Feature                    | Description                                                                                           |
|----------------------------|-------------------------------------------------------------------------------------------------------|
| **Quadrant Matrix View**   | Four colour‑coded boards: `Urgent & High`, `Not Urgent & High`, `Urgent & Low`, `Not Urgent & Low`. Click any quadrant to drill down. |
| **Live Progress Rings**    | Each quadrant shows an SVG progress ring with the number of remaining tasks. Updates instantly as you check or add tasks. |
| **Drag & Drop Reordering** | Inside any task list, reorder tasks by dragging the six‑dot handle. No accidental moves – only intentional reordering. |
| **Inline Task Editing**    | Double‑click any task name to edit it inline. Press Enter or blur to save.                            |
| **Dark Mode**              | Toggle between light and dark themes. Respects system preference on first visit and stores your choice in `localStorage`. |
| **Splash Animation**       | Entering a quadrant triggers a subtle full‑screen splash animation for smooth visual feedback.       |
| **Persistent Storage**     | All tasks and theme settings are saved automatically in the browser’s `localStorage`. Refresh or close – your data stays. |
| **Haptic Feedback**        | Completing a task triggers a light vibration — the native Capacitor Haptics plugin on Android, with a Web Vibration API fallback in the browser. |
| **Keyboard & A11y**        | Quadrants are keyboard-focusable, controls carry ARIA labels, focus rings are visible, and animations respect `prefers-reduced-motion`. |

---

## Tech Stack

| Layer       | Technology                                                          |
|-------------|---------------------------------------------------------------------|
| Structure   | HTML5                                                               |
| Styling     | CSS3 (Grid, Flexbox, CSS Variables, transitions)                    |
| Behaviour   | Vanilla JavaScript (ES6)                                            |
| Graphics    | SVG + canvas‑like ring drawing                                      |
| Persistence | Web LocalStorage API                                                |

---

## Getting Started

### Clone & Run

```bash
git clone https://github.com/akshayaa-403/Habita.git
cd Habita
```

The web app lives in the `www/` folder and needs no build step. Serve that folder with any static server:

```bash
# npm (uses the bundled script)
npm start                     # → npx serve www

# Python 3
python -m http.server 8000 -d www

# Node.js (npx)
npx serve www
```

Then open the printed URL (e.g. `http://localhost:3000`) in your browser.

### Build the Android app (Capacitor)

```bash
npm install          # install Capacitor + plugins
npm run sync         # copy www/ into the native project (cap sync)
npm run open:android # open the project in Android Studio (cap open android)
```

---

## Project Structure

```
Habita/
├── www/                       # Web app (served as-is / copied into the native shell)
│   ├── index.html             # Main entry point
│   ├── css/
│   │   └── styles.css         # Light/dark themes, quadrant grid, responsive layout
│   └── js/
│       ├── main.js            # Bootstraps theme, UI, and progress rings on load
│       ├── theme.js           # Dark mode logic, localStorage sync, system preference
│       ├── storage.js         # load/save + id generation, shape validation & migration
│       ├── tasks.js           # CRUD, completion toggling, reordering, haptics, counts
│       ├── ui.js              # Task list rendering, drag-and-drop, inline editing, navigation
│       └── progress.js        # SVG progress ring drawing and animation
├── android/                   # Capacitor Android project
├── capacitor.config.json      # Capacitor configuration
├── package.json               # Metadata, scripts, and Capacitor dependencies
├── LICENSE                    # MIT License
└── .gitignore
```

---

## How to Use

1. **Start at the matrix** – You see four quadrants with progress rings.  
2. **Open a quadrant** – Click (or focus with `Tab` and press `Enter`/`Space`) any quadrant to drill into its task list.  
3. **Add a task** – Inside a quadrant, click **"+ Add Task"** — a new row opens ready to type. Or, from the matrix, **drag** the central **+** button onto a quadrant to jump straight into a new task there.  
4. **Complete a task** – Tick the checkbox inside any task row.  
5. **Edit a task** – Double‑click the task text, type a new name, and press `Enter` to save.  
6. **Delete a task** – Click the trash bin icon.  
7. **Reorder tasks** – Drag the **⋮⋮** handle vertically.  
8. **Toggle dark mode** – Click the sun/moon icon in the top‑right corner.  
9. **Track progress** – The outer ring fills in proportion to completed tasks; the inner count shows how many are left.

---

## Design Highlights

- **Smooth transitions** – Theme switch and splash animation feel fluid.  
- **Responsive grid** – Quadrants wrap on narrow screens.  
- **Accessible contrast** – Both light and dark modes meet readability standards.  
- **No external fonts** – Uses system‑default sans‑serif for fast loading.  

## 📜 License

Distributed under the **MIT License**. See the `LICENSE` file for full text.
