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

No installation required. Serve the folder with any static server:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (npx)
npx serve
```

Then visit `http://localhost:8000` in your browser.

---

## Project Structure

```
Habita/
├── index.html             # Main entry point
├── css/
│   └── styles.css         # Light/dark themes, quadrant grid, responsive layout
├── js/
│   ├── main.js            # Initialises theme, UI, and progress rings
│   ├── theme.js           # Dark mode logic, localStorage sync, system preference
│   ├── storage.js         # loadTasks() / saveTasks() wrappers
│   ├── tasks.js           # CRUD, completion toggling, reordering, counts
│   ├── ui.js              # Task list rendering, drag‑and‑drop, inline editing, navigation
│   └── progress.js        # SVG progress ring drawing and animation
├── LICENSE                # MIT License
└── .gitignore
```

---

## How to Use

1. **Start at the matrix** – You see four quadrants with progress rings.  
2. **Add a task** – Tap the central **+** button and drag it onto a quadrant. Or enter a quadrant and click **"+ Add Task"**.  
3. **Complete a task** – Tick the checkbox inside any task row.  
4. **Edit a task** – Double‑click the task text, type a new name, and press Enter.  
5. **Delete a task** – Click the trash bin icon.  
6. **Reorder tasks** – Drag the **⋮⋮** handle vertically.  
7. **Toggle dark mode** – Click the sun/moon icon in the top‑right corner.  
8. **Track progress** – The outer ring fills in proportion to completed tasks; the inner count shows how many are left.

---

## Design Highlights

- **Smooth transitions** – Theme switch and splash animation feel fluid.  
- **Responsive grid** – Quadrants wrap on narrow screens.  
- **Accessible contrast** – Both light and dark modes meet readability standards.  
- **No external fonts** – Uses system‑default sans‑serif for fast loading.  

## 📜 License

Distributed under the **MIT License**. See the `LICENSE` file for full text.
