# Habita

**A simple, no‑frills habit tracker**  
Track your daily habits without build steps, servers, or complexity. Everything runs locally in your browser – your data stays with you.

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## Features

- **Add habits** – give each habit a name and an optional emoji/icon  
- **Daily check‑off** – mark habits as done for the current day  
- **Streaks & totals** – see your current streak and total completions for each habit  
- **Dark mode** – toggle between light and dark themes  
- **Local storage** – all data stays in your browser; refresh or close the tab, your habits persist  

## Quick Start

**Clone the repository**  
   ```bash
   git clone https://github.com/yourusername/habita.git
   cd habita
   ```

---

## Usage

1. **Add a new habit** – type a name and pick an icon, then click “Add”.  
2. **Check off today** – click the circle or checkbox next to a habit to mark it as complete.  
3. **View progress** – each habit card shows your current streak (consecutive days) and total completions.  
4. **Dark mode** – click the sun/moon icon in the header to switch themes.  

> **Note**: Data is saved automatically to `localStorage`. Clearing your browser data will remove your habits.

---

## Project Structure

```
Habita/
├── index.html               # Main web app entry point (GitHub Pages root)
├── src/
│   ├── app.js                  # Application controller (750+ lines)
│   ├── models.js               # Data model classes (250+ lines)
│   └── storage.js              # LocalStorage persistence layer (250+ lines)
│
├── styles/
│   └── main.css                # All styling & responsive design (1200+ lines)
│
├── docs/
│   └── MIGRATION.md            # iOS to Web migration documentation
│
├── README.md                # This file
├── LICENSE                  # MIT License
└── .gitignore               # Git configuration
```

### Directory Guide

| Item | Contents | Purpose |
|------|----------|---------|
| **index.html** | Main HTML file | GitHub Pages entry point (served at repository root) |
| **src/** | `app.js`, `models.js`, `storage.js` | JavaScript application logic and data models |
| **styles/** | `main.css` | CSS stylesheets with responsive design and dark mode |
| **docs/** | `MIGRATION.md`, etc. | Project documentation and guides |

---

## GitHub Pages Deployment

This repository is configured for GitHub Pages deployment from the main branch at the repository root.

**Configuration:**
- `index.html` at repository root
- Asset paths use relative URLs (e.g., `styles/main.css`, `src/app.js`)
- No build process needed
- Automatic deployment on push to main

**To enable GitHub Pages:**
1. Go to repository **Settings** → **Pages**
2. Set **Source** to `Deploy from a branch`
3. Select **Branch**: `main`
4. Select **Folder**: `/ (root)`
5. Click **Save**

Your app will be live at: `https://akshayaa-403.github.io/Habita/`

---

## License

Distributed under the MIT License. See `LICENSE` file for more information.
