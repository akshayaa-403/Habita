import SwiftUI
import SwiftData

@Model
final class Habit {
    var id: UUID = UUID()
    var name: String = ""
    var icon: String = "sparkles"
    var colorLabel: String = "Blue"
    var dailyTarget: Int = 1 // Default target (e.g., 1 for binary habits, 8 for water)
    var createdAt: Date = Date()
    var logs: [HabitLog] = []
    
    init(name: String, icon: String, colorLabel: String, dailyTarget: Int = 1) {
        self.name = name
        self.icon = icon
        self.colorLabel = colorLabel
        self.dailyTarget = dailyTarget
    }
    
    // MARK: - Computed Properties
    
    func todayCount() -> Int {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let todayLog = logs.first { calendar.isDate($0.date, inSameDayAs: today) }
        return todayLog?.count ?? 0
    }
    
    func todayCompletionPercentage() -> Double {
        let count = Double(todayCount())
        let target = Double(dailyTarget)
        return min(count / target, 1.0) * 100
    }
    
    func completionPercentageForDate(_ date: Date) -> Double {
        let calendar = Calendar.current
        let targetDate = calendar.startOfDay(for: date)
        let log = logs.first { calendar.isDate($0.date, inSameDayAs: targetDate) }
        let count = Double(log?.count ?? 0)
        let target = Double(dailyTarget)
        return min(count / target, 1.0) * 100
    }
}

@Model
final class HabitLog {
    var id: UUID = UUID()
    var date: Date // Normalized to day start
    var count: Int = 0 // Logged count for that day
    var habit: Habit?
    
    init(date: Date, count: Int = 0) {
        self.date = date
        self.count = count
    }
}
