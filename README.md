# Habita: Complete Product Requirements Document (PRD)

## 1. Product Vision
**Habita** is a frictionless productivity system that combines visual task prioritization (Ike matrix) with gentle habit formation (Structured + Habitica). It helps users manage their energy and time while providing clear, non-judgmental analytics on their consistency.

## 2. Core User Flows

### Flow A: Task Capture & Prioritization (The "Ike" Loop)
1.  User taps **"+"** (floating, draggable).
2.  Enters **Task Name** & **Time Required**.
3.  Optional: Attach photo, select color label.
4.  **NLP Icon Suggestion**: App suggests an icon based on task name (e.g., "Doctor" → 🩺). User can override.
5.  Task appears in **Inbox**.
6.  User can select tasks and tap **"AI Rate"** to get Complexity (1-5) and Urgency (1-5) scores.
7.  User drags task from Inbox onto the **2x2 Matrix** (Time Required vs. Energy Required).
8.  Once placed, task is **time-blocked** on the calendar for its duration.

### Flow B: Habit & Daily Tracking (The "All-Day" Loop)
1.  User navigates to **Habits** tab.
2.  Creates a **Habit** with name, icon, and optional target frequency.
3.  Habit appears in the **"All-Day"** strip at the top of the Calendar view.
4.  Throughout the day, user taps **+** to log an occurrence, **-** to correct.
5.  Habit data flows into the **Analytics** section (table, graph, pie chart).

### Flow C: Analytics Review (The "Image Reference" Loop)
1.  User opens **Progress** tab.
2.  Views:
    - **Habit Completion Table**: Rows = Habits, Columns = Dates, Cells = Percentage completion for that day.
    - **Trend Graph**: Line chart of overall daily completion % over time.
    - **Pie Chart**: Distribution of logged habit occurrences across habits.

---

## 3. Detailed Feature Specifications

### 3.1. Matrix & Calendar (Time/Energy View)
| Feature | Implementation Details |
| :--- | :--- |
| **Axes** | X: Time Required (Short ↔ Long). Y: Energy Required (Low ↔ High). |
| **Quadrants** | High Energy/Short Time, High Energy/Long Time, Low Energy/Short Time, Low Energy/Long Time. |
| **Drag & Drop** | Long-press Inbox item → Drag to quadrant. Snaps to grid with haptic feedback. |
| **AI Rating** | Calls local or cloud model. Returns JSON `{ complexity: 3, urgency: 4 }`. Displayed as badge. |
| **Empty Space Detection** | Calendar highlights hours with no scheduled tasks using a subtle "Energy Recovery" placeholder. |
| **Inbox Rollover** | Unmoved tasks stay in Inbox and appear the next day (no pressure, no notification). |

### 3.2. Habit Tracking (Dailies with Plus/Minus)
| Feature | Implementation Details |
| :--- | :--- |
| **All-Day Strip** | Horizontal scrollable list above calendar timeline. Shows habit icon, name, and **Square Checkbox** with current day's count. |
| **Logging** | Tap **+** increments count for today; tap **-** decrements (minimum 0). |
| **Targets** | Each habit can have a daily target count (e.g., "Drink Water: 8"). |
| **Completion Logic** | Percentage for the day = `min(count / target, 1.0)`. |
| **Concatenation Bonus** | If habit logged within 5 minutes of starting a Matrix task, bonus points awarded. |

### 3.3. Analytics Dashboard (Based on Your Image)
This is a dedicated tab with three main components:

**A. Habit Completion Table**
- **Structure:** Rows = Habits, Columns = Dates (last 7-30 days).
- **Cell Data:** Completion percentage for that habit on that day.
- **Visual Encoding:** Background color intensity or a small progress bar inside the cell.
- **"Percentage" Column:** Average completion for that habit over the period.
- **"Loaded" Column:** (From image) Possibly a count of days with non-zero logs? We'll define as **"Active Days"** (days with at least one log).

**B. Trend Graph (Line Chart)**
- **X-Axis:** Dates (daily).
- **Y-Axis:** Overall Completion % (0-100%).
- **Data Point:** Average of all habit percentages for that day.
- **Goal Line:** User can set a target line (e.g., 70%).

**C. Pie Chart (Habit Distribution)**
- **Slices:** Each habit.
- **Value:** Total logged count across the selected date range.
- **Legend:** Habit names with corresponding colors.

### 3.4. Gamification & Delight
- **Checkbox Animation:** When a Matrix task or Habit target is met, the square fills with a gradient and a micro-confetti pops.
- **Wins Counter:** Top-right profile icon shows cumulative "Wins" (completed tasks + habit days).
- **No Streak Shaming:** No red X, no threatening notifications. Missed day simply shows 0% in the table.

### 3.5. Notifications (Strictly Controlled)
- **Only** user-set reminders for time-blocked tasks.
- **Optional** gentle nudge at day end: *"Log your habits for today?"* (can be disabled).

---

## 4. Technical Architecture

### 4.1. Tech Stack
- **iOS:** SwiftUI + SwiftData (local persistence). CloudKit for optional sync.
- **Android:** Jetpack Compose + Room. Firebase for optional sync.
- **NLP Icon Selection:** On-device NaturalLanguage framework (iOS) / ML Kit (Android) with custom mapping dictionary.
- **AI Rating (Pro Feature):** Cloud function calling OpenAI GPT-4o-mini or Gemini Flash.

### 4.2. Data Models (SwiftData Example)
```swift
@Model
class Habit {
    var id: UUID
    var name: String
    var icon: String // SF Symbol or Emoji
    var colorHex: String
    var dailyTarget: Int // e.g., 1 for binary, 8 for water
    var logs: [HabitLog] // Relationship
}

@Model
class HabitLog {
    var date: Date // Normalized to day start
    var count: Int // Logged count for that day
    var habit: Habit?
}

@Model
class MatrixTask {
    var id: UUID
    var title: String
    var timeRequired: TimeInterval // Duration in seconds
    var energyLevel: Int? // 1-5, assigned by AI or manual drag
    var scheduledStart: Date?
    var quadrantRaw: String // "highEnergyShortTime", etc.
    var isCompleted: Bool
    var imageData: Data?
    var inboxDate: Date? // When created; null when scheduled
}
```

### 4.3. Analytics Calculation Logic
- **Daily Habit Completion %**: For a given habit and day, `min(logs.count / dailyTarget, 1.0) * 100`.
- **Overall Daily %**: Average of all habit completion % for that day.
- **Pie Chart Data**: `SUM(logs.count)` grouped by habit over the selected date range.

---

## 5. UI/UX Mockup Descriptions

### 5.1. Main Calendar View
```
[ --------------------------------------------------- ]
[ All-Day: 🧘 Meditate [+2] [■]  📖 Read [+1] [■]    ]  <- Horizontal scroll
[ --------------------------------------------------- ]
[ 8 AM  [                   ]                          ]
[ 9 AM  [   🏋️ Gym (1h)    ] (High E / Long T)        ]
[10 AM  [                   ]                          ]
[11 AM  [  📞 Call (15m)    ] (Low E / Short T)        ]
[ --------------------------------------------------- ]
[  +  ] (Floating draggable button)
```
*Inbox accessible via pull-up drawer from bottom.*

### 5.2. Analytics Tab (Inspired by Your Image)
```
[ < Week of Mar 11, 2026 > ]  [ Graph | Table | Pie ]

┌─────────────────────────────────────────────────┐
│ Habit / Date       | 11 | 12 | 13 | ... | %    │
├─────────────────────────────────────────────────┤
│ 🧘 Meditate 15min  | 71%| 38%| 75%| ... | 45%  │
│ ✍️ Write Substack  | 50%| 50%| 40%| ... | 30%  │
│ 💼 Apply to jobs   | 75%| 44%| 56%| ... | 45%  │
│ 🚿 Take a shower   |100%|100%|100%| ... | 90%  │
└─────────────────────────────────────────────────┘

[ Graph Area: Line chart with X=Dates, Y=Overall % ]
[ Pie Chart: Distribution of total logs by habit   ]
```

---

## 6. Development Roadmap (Prioritized)

| Phase | Deliverable | Timeline |
| :--- | :--- | :--- |
| **1. Foundation** | Data models, local persistence, basic calendar UI, floating "+" button, task creation modal. | Week 1-2 |
| **2. Ike Matrix** | 2x2 draggable grid, Inbox drawer, drag-to-schedule logic, time-block rendering. | Week 3-4 |
| **3. Habits Core** | All-day strip, habit creation with NLP icon picker, plus/minus logging, square checkbox animation. | Week 5-6 |
| **4. Analytics MVP** | Habit completion table with percentage columns, simple line graph. | Week 7-8 |
| **5. AI & Polish** | AI rating integration (cloud function), empty space detection, concatenation bonuses, pie chart. | Week 9-10 |
| **6. Sync & Release** | CloudKit/Firebase sync, onboarding flow, App Store/Play Store preparation. | Week 11-12 |

---

## 7. Final Clarifications Resolved

- **Inbox Rollover:** Tasks left in Inbox at day end remain there and appear the next day. They are not lost, but they also do not clutter the calendar.
- **Icon Selection:** NLP suggests an icon based on task name. User can tap to change from a picker.
- **Habit Table "Loaded" Column:** Defined as "Days with at least one log" for that habit over the period.
- **Pie Chart Legend:** Will display habit names and percentages, as shown in your image.
