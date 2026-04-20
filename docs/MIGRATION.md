# Habita: iOS → Web Migration

## Overview

This document outlines the transformation of Habita from a native iOS app (SwiftUI + SwiftData) to a web application (HTML5 + CSS3 + JavaScript).

## Architecture Changes

### Before (iOS - SwiftUI)
```
SwiftUI Views → SwiftData Models → CloudKit Services
```

### After (Web - HTML5/JS)
```
HTML DOM ← JavaScript Controllers → LocalStorage Models
```

## File Structure Changes

### iOS Structure
```
Models/
  - Habit.swift
  - HabitaTask.swift
  - HabitLog.swift
  - WinsTracker.swift
  
Utilities/
  - CloudKitService.swift
  - AIRatingService.swift
  - AppState.swift
  - ColorConstants.swift
  
ViewModels/
  - MatrixViewModel.swift
  
Views/
  - AddHabitView.swift
  - HabitsView.swift
  - IkeMatrixView.swift
  - AnalyticsView.swift
  - [etc - 16 view files]
```

### Web Structure
```
index.html          - Single HTML file (UI + DOM structure)
styles.css          - All styling (responsive design)
app.js              - Main application controller
models.js           - Data model classes (equivalent to Swift models)
storage.js          - Persistence layer (equivalent to CloudKit/SwiftData)
```

## Mapping: iOS → Web

### Models

| iOS (Swift) | Web (JavaScript) |
|---|---|
| `@Model class Habit` | `class Habit` |
| `@Model class HabitaTask` | `class HabitaTask` |
| `@Model class HabitLog` | `class HabitLog` |
| `@Model class WinsTracker` | `class WinsTracker` |
| `@Observable AppState` | `class AppState` |

### Storage/Persistence

| iOS (Swift) | Web (JavaScript) |
|---|---|
| SwiftData Container | Browser LocalStorage |
| `@Query` property wrapper | `storage.getTasks()` |
| `@Environment \.modelContext` | `storage` global instance |
| CloudKit sync | Export/Import JSON |
| UserDefaults | localStorage API |

### Views

| iOS (SwiftUI) | Web (HTML/JS) |
|---|---|
| `NavigationStack` | Tab-based navigation |
| `TabView` | `.tab-navigation` element |
| `@State` properties | Instance variables in `HabitaApp` |
| `@Environment` | Global `app` instance |
| `.sheet()` modifier | CSS `.modal` with flex display |
| `ScrollView` + `VStack` | Flexbox containers |

### Services

| iOS (Swift) | Web (JavaScript) |
|---|---|
| `CloudKitService.shared` | Removed (no cloud sync) |
| `AIRatingService` | Not implemented in v1 |
| `AppState.shared` | `app.appState` instance |
| `ColorConstants` | CSS variables + helper functions |

## Functional Equivalents

### Onboarding
- **iOS**: SwiftUI conditional views with `@State`
- **Web**: Modal pages with display toggling

### Task Management
- **iOS**: SwiftData queries with `@Query`
- **Web**: Array methods on `storage.getTasks()`

### Habit Tracking
- **iOS**: Core Data relationships + computed properties
- **Web**: JavaScript methods on `Habit` class

### Analytics
- **iOS**: SwiftUI Charts + computed properties
- **Web**: CSS flexbox charts with calculated values

### Dark Mode
- **iOS**: `.preferredColorScheme()` + UIUserInterfaceStyle
- **Web**: CSS class toggle + localStorage

## Technical Decisions

### 1. Vanilla JavaScript (No Framework)
**Why**: Keep app lightweight, offline-capable, and framework-independent.

### 2. LocalStorage Instead of Cloud
**Why**: Simpler development, works offline, no backend needed for MVP.

### 3. Single-Page Application (SPA)
**Why**: Smooth tab navigation, instant rendering, better UX.

### 4. CSS Custom Properties for Theming
**Why**: Dynamic dark mode, easy color customization.

### 5. Modal Dialogs for Forms
**Why**: Mobile-friendly, prevents context loss.

## Feature Parity

✅ **Implemented**
- Inbox (task list)
- Ike Matrix (2×2 layout)
- Habit tracking (+/− buttons)
- Calendar view
- Analytics (3 charts)
- Dark mode
- Settings/Preferences
- Data export/import
- Wins counter
- Responsive design

⚠️ **Not Implemented (v1)**
- Drag & drop (planned)
- Cloud sync
- AI rating service
- Push notifications
- Icon picker
- Complex filtering

## Data Model Conversion

### Example: Habit Class

**iOS (Swift)**
```swift
@Model
final class Habit {
    var id: UUID = UUID()
    var name: String
    var logs: [HabitLog] = []
    
    func todayCount() -> Int {
        let today = calendar.startOfDay(for: Date())
        let todayLog = logs.first { 
            calendar.isDate($0.date, inSameDayAs: today) 
        }
        return todayLog?.count ?? 0
    }
}
```

**Web (JavaScript)**
```javascript
class Habit {
    constructor(name, icon, colorLabel, dailyTarget = 1) {
        this.id = this.generateId();
        this.name = name;
        this.logs = [];
    }
    
    todayCount() {
        const today = this.getToday();
        const todayLog = this.logs.find(log => 
            this.isSameDay(log.date, today)
        );
        return todayLog ? todayLog.count : 0;
    }
}
```

## Performance Considerations

### iOS App
- Native performance (Swift compiled)
- On-device processing
- CloudKit sync overhead

### Web App
- Lightweight (~50KB total, uncompressed)
- Instant load time
- No build step required
- LocalStorage for persistence

## Browser Compatibility

Works on all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Not compatible with:
- Internet Explorer (no ES6 support)
- Older Safari versions (no LocalStorage)

## Migration Path (If Needed)

To move data from iOS app to web:
1. Export data from iOS Settings
2. Open web app
3. Use Import feature in Settings
4. Data restored to browser LocalStorage

## Future Roadmap

- **Phase 2**: Add Firebase backend for cloud sync
- **Phase 3**: PWA (Progressive Web App) support
- **Phase 4**: Mobile app with React Native
- **Phase 5**: Desktop app with Electron

## Development Experience

### iOS (Xcode)
- Requires macOS + Xcode
- Swift compiler + iOS simulator
- Git-based distribution

### Web (Any Editor)
- Works on Windows/Mac/Linux
- Any text editor (VS Code recommended)
- Direct browser testing
- Instant reload (with Live Server)

## Maintenance

### iOS
- SwiftUI updates quarterly
- iOS version support requirements
- App Store submission process

### Web
- No dependencies to update (vanilla JS)
- Works on all modern browsers automatically
- Deploy anywhere (GitHub Pages, Netlify, etc.)

---

**Last Updated**: April 2025  
**Version**: 1.0 (Web)
