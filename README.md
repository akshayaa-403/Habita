# Habita

**A calm, frictionless productivity web app** that combines visual task prioritization (Ike matrix) with gentle habit formation.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black) ![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Development](#development)
- [Data & Privacy](#data--privacy)
- [Browser Support](#browser-support)
- [License](#license)

## About

Habita helps you manage time and energy without the usual pressure of productivity apps.

- 📊 **Ike Matrix** – Drag tasks onto a 2×2 visual prioritization matrix (Time vs Energy)
- ✨ **Habit Tracking** – Log habits with a simple +/− strip (no streak shaming)
- 📈 **Beautiful Analytics** – Completion tables, trend graphs, and distribution charts
- 🎯 **Gamification** – Wins counter to celebrate progress
- 📆 **Calendar Overview** – Visual view of scheduled tasks and completed habits
- 🌙 **Dark Mode** – Eye-friendly interface for nighttime use
- 💾 **Local Storage** – All data saved in your browser (works offline)
- 📤 **Export/Import** – Backup and restore data as JSON

Built entirely with **HTML5, CSS3, and Vanilla JavaScript** for a lightweight, framework-independent web experience.

## Features

✨ **Core Functionality:**
- ✅ Ike Matrix – visual 2×2 task prioritization
- ✅ Habit tracking with +/− buttons and progress bars
- ✅ Calendar view showing scheduled tasks and completed habits
- ✅ Analytics dashboard with three chart types
- ✅ Wins counter with gamification
- ✅ Dark mode support
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Data export/import as JSON

🎓 **User Experience:**
- ✅ Interactive 7-step tutorial for first-time users
- ✅ Accessible tutorial button (?) for quick reference
- ✅ Smooth animations and transitions
- ✅ Comprehensive onboarding flow
- ✅ Settings and preferences management

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Architecture:** Object-Oriented JavaScript with MVC pattern
- **Persistence:** Browser LocalStorage API
- **Styling:** CSS3 with custom properties and responsive design
- **Icons:** Font Awesome 6.4.0
- **Framework:** None (vanilla JavaScript)

## Quick Start

### Open in Browser
```bash
# Simply open public/index.html in any modern browser
# Windows
start public/index.html

# macOS
open public/index.html

# Linux
xdg-open public/index.html
```

### Using a Local Server (Recommended)
```bash
# Python 3
python -m http.server 8000
# Visit http://localhost:8000/public/

# Node.js
npx http-server
# Visit http://localhost:8080/public/
```

## Project Structure

```
Habita/
├── 📁 public/
│   └── index.html              # Main web app entry point (single-page app)
│
├── 📁 src/
│   ├── app.js                  # Application controller (750+ lines)
│   ├── models.js               # Data model classes (250+ lines)
│   └── storage.js              # LocalStorage persistence layer (250+ lines)
│
├── 📁 styles/
│   └── main.css                # All styling & responsive design (1200+ lines)
│
├── 📁 docs/
│   └── MIGRATION.md            # iOS to Web migration documentation
│
├── 📄 README.md                # This file
├── 📄 LICENSE                  # MIT License
└── 📄 .gitignore               # Git configuration
```

### Directory Guide

| Directory | Contents | Purpose |
|-----------|----------|---------|
| **public/** | `index.html` | Static HTML entry point served to users |
| **src/** | `app.js`, `models.js`, `storage.js` | JavaScript application logic and data models |
| **styles/** | `main.css` | CSS stylesheets with responsive design and dark mode |
| **docs/** | `MIGRATION.md`, etc. | Project documentation and guides |

## Installation & Setup

### Prerequisites
- Any modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- No server or build tools required

### Option 1: Open in Browser (Simplest)
```bash
# Double-click public/index.html or
open public/index.html
```

### Option 2: Python Local Server
```bash
cd Habita
python -m http.server 8000
# Open http://localhost:8000/public/
```

### Option 3: Node.js Local Server
```bash
cd Habita
npx http-server
# Open http://localhost:8080/public/
```

### Option 4: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `public/index.html`
3. Select "Open with Live Server"

### Option 5: Deploy Online

**GitHub Pages:**
```bash
# Push to gh-pages branch
git subtree push --prefix public origin gh-pages
```

**Netlify:**
1. Connect your GitHub repository
2. Set build folder to `public`
3. Deploy

**Vercel:**
```bash
npm i -g vercel
vercel
```

## Usage

### First Time Using Habita

1. **Open** `public/index.html` in your browser
2. **Complete** the onboarding flow (5 screens)
3. **Follow** the interactive 7-step tutorial
4. **Start** creating tasks and habits!

### Interactive Tutorial

- 📍 **Auto-launches** after onboarding completes
- 🔵 **Always accessible** via the blue **?** button (bottom-right corner)
- 📚 **7 comprehensive steps** covering:
  - Welcome to Habita
  - Inbox management
  - Ike Matrix explanation
  - Creating habits
  - Calendar overview
  - Analytics dashboard
  - Tips & tricks
- ⬅️ **Full navigation** – Next, Previous, Skip buttons

### Creating Tasks

1. Click **"Add Task"** in the Inbox tab
2. Enter **title** and **time required** (minutes)
3. Choose a **color** label
4. Task appears in inbox

**Organizing in Matrix:**
- Assign **energy level** (1-5) and **urgency** (1-5)
- Task automatically moves to appropriate quadrant
- Quadrants: Do First | Schedule | Delegate | Eliminate

### Creating Habits

1. Click **"Add Habit"** in the Habits tab
2. Set **name**, **daily target**, and **icon**
3. Choose a **color** label
4. Track daily with **+** and **−** buttons
5. Progress bar shows completion %

### Ike Matrix Explanation

```
                 SHORT TIME          LONG TIME
        ┌─────────────────────┬──────────────────────┐
HIGH    │   DO FIRST          │   SCHEDULE           │
ENERGY  │   (Priority)        │   (Plan These)       │
        ├─────────────────────┼──────────────────────┤
LOW     │   DELEGATE          │   ELIMINATE          │
ENERGY  │   (Quick Wins)      │   (Reconsider)       │
        └─────────────────────┴──────────────────────┘
```

### Analytics Dashboard

**Completion Table:**
- View daily, weekly, monthly habit completion %
- Track progress over time

**Distribution Chart:**
- Visualize task status breakdown
- Inbox | Scheduled | Completed

**Trend Graph:**
- Last 7 days of task completion
- Identify patterns and streaks

### Settings

Access from the **Settings** tab:
- 🌙 **Dark Mode** – Toggle light/dark theme
- 🔔 **Notifications** – Enable/disable
- 💡 **Energy Hints** – Show recovery suggestions
- 📤 **Export Data** – Download JSON backup
- 🔄 **Reset Data** – Clear everything (⚠️ irreversible)

## Development

### Architecture

```
┌─────────────────────────────────────────────┐
│  View Layer (public/index.html)             │
│  └─ HTML structure, forms, modals          │
│  └─ Styled by styles/main.css              │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Controller (src/app.js)                    │
│  └─ Event handling, rendering, logic       │
│  └─ Orchestrates Model & View              │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Model Layer                                │
│  ├─ src/models.js (Data structures)        │
│  └─ src/storage.js (Persistence)           │
│     └─ LocalStorage abstraction            │
└─────────────────────────────────────────────┘
```

**MVC Pattern:**
- **Model** – Data management (`models.js`, `storage.js`)
- **View** – User interface (`index.html`, `main.css`)
- **Controller** – Application logic (`app.js`)

### File Descriptions

#### `public/index.html` (~500 lines)
- Complete DOM structure for single-page app
- 6 main tabs: Inbox, Matrix, Calendar, Habits, Progress, Settings
- Modal dialogs for task/habit creation
- Onboarding and tutorial components

#### `src/app.js` (~750 lines)
Main application controller:
- Tab navigation and view rendering
- Task and habit CRUD operations
- Calendar generation
- Analytics calculations
- Dark mode management
- Tutorial system
- Event handlers

#### `src/models.js` (~250 lines)
Data model classes:
- `Habit` – Daily habit with tracking
- `HabitLog` – Individual log entries
- `HabitaTask` – Task with matrix properties
- `WinsTracker` – Gamification counter
- `AppState` – User preferences

#### `src/storage.js` (~250 lines)
Persistence service:
- CRUD operations for all models
- JSON serialization/deserialization
- Export/import functionality
- LocalStorage wrapper

#### `styles/main.css` (~1200 lines)
Responsive styling:
- CSS custom properties for theming
- Flexbox and CSS Grid layouts
- Dark mode support
- Mobile-first responsive design
- Smooth animations
- Tutorial styling

### Adding a Feature

1. **Define model** in `src/models.js` (if needed)
2. **Add storage methods** in `src/storage.js`
3. **Create UI** in `public/index.html`
4. **Style component** in `styles/main.css`
5. **Implement logic** in `src/app.js`

### Code Style

- ES6+ JavaScript (no transpilation)
- Semantic HTML5
- CSS custom properties for colors
- Descriptive naming conventions
- Comments for complex logic
- ~100 characters line length

### Running Tests

No automated tests currently. Manual testing:
```bash
# Open public/index.html
# Test all features:
# - Create/edit/delete tasks
# - Create/edit/delete habits
# - Toggle dark mode
# - Export/import data
# - Mobile responsiveness
```

## Data & Privacy

### Data Storage

- 📍 **Location:** Browser LocalStorage (client-side only)
- 🔒 **Sync:** No server sync (offline-first)
- ⏱️ **Persistence:** Survives browser restarts
- 🗑️ **Deletion:** Clearing cache removes data

### Privacy Guarantee

- ✅ **Zero server communication** – No data sent anywhere
- ✅ **No tracking** – No analytics or telemetry
- ✅ **No collection** – No personal data collection
- ✅ **No third-party APIs** – Only Font Awesome CDN for icons
- ✅ **Complete ownership** – You own all your data

### Backup & Restore

**Create Backup:**
```
Settings → "Export Data" → Save JSON file
```

**Restore from Backup:**
```
Settings → "Import Data" → Select JSON file
```

### Limitations

- ⚠️ Single browser only (not synced across devices)
- ⚠️ Tied to specific domain and browser
- ⚠️ Clearing browser cache deletes everything
- ⚠️ No automatic cloud backup

## Browser Support

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Chrome | 90 | ✅ Full support |
| Firefox | 88 | ✅ Full support |
| Safari | 14 | ✅ Full support |
| Edge | 90 | ✅ Full support |
| Opera | 76 | ✅ Full support |
| IE | All | ❌ Not supported |

## Performance

- ⚡ **Load Time:** < 1 second
- 💾 **File Size:** 89 KB (22 KB gzipped)
- 🚀 **Memory:** < 5 MB typical
- 🎨 **Frame Rate:** 60 FPS
- 📱 **Mobile:** Optimized for all screen sizes

## Roadmap

**Planned Features:**
- ☐ Drag & drop task arrangement
- ☐ Cloud sync (Firebase/Supabase)
- ☐ Collaborative tasks
- ☐ Mobile apps (React Native)
- ☐ Desktop app (Electron)
- ☐ PWA installation
- ☐ Pomodoro timer
- ☐ Calendar API integration
- ☐ AI recommendations

## Troubleshooting

### Data not saving?
- Check browser LocalStorage is enabled
- Try exporting data first
- Clear browser cache and refresh

### Tutorial not showing?
- Click the blue **?** button (bottom-right)
- Disable browser extensions
- Try a different browser

### Styles not loading?
- Ensure served via local server (not file://)
- Check browser console for errors
- Clear cache and reload

### Can't export data?
- Download folder may have permission issues
- Try saving to Desktop
- Check browser security settings

## File Sizes

| Component | Size | Gzipped |
|-----------|------|---------|
| public/index.html | 25 KB | 6 KB |
| src/app.js | 25 KB | 7 KB |
| styles/main.css | 22 KB | 5 KB |
| src/models.js | 8 KB | 2 KB |
| src/storage.js | 9 KB | 2 KB |
| **Total** | **89 KB** | **22 KB** |

## License

MIT License – See [LICENSE](LICENSE) for full text

```
Copyright (c) 2025 Habita Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

## Contributing

This project is open for contributions!

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Before Contributing

- Follow the code style (see Development section)
- Test thoroughly in multiple browsers
- Update documentation
- Keep changes focused and minimal

## Support & Issues

**Have a question or found a bug?**

1. 🐛 **GitHub Issues** – [Report bugs](https://github.com/akshayaa-403/Habita/issues)
2. 💡 **Discussions** – [Share ideas](https://github.com/akshayaa-403/Habita/discussions)
3. 📧 **Email** – [Contact maintainer](mailto:support@habita.app)

## Acknowledgments

- [Font Awesome](https://fontawesome.com/) – Icon library
- [Eisenhower Matrix](https://en.wikipedia.org/wiki/Time_management#Eisenhower_matrix) – Methodology
- Built for calm, frictionless productivity

## Related Resources

- [Eisenhower Matrix](https://en.wikipedia.org/wiki/Time_management#Eisenhower_matrix)
- [Habit Formation](https://jamesclear.com/habits)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Made with 💙 for productivity without pressure**

*Last updated: April 2026*
