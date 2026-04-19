import Foundation
import SwiftData

/// HabitLog tracks daily habit occurrences
/// Each log entry represents the count of a habit completed on a specific day
@Model
final class HabitLog {
    @Attribute(.unique) var id: UUID
    
    /// Date normalized to start of day (no time component)
    var date: Date
    
    /// Number of times this habit was completed on this date
    var count: Int
    
    /// Reference to parent habit
    var habit: Habit?
    
    init(
        id: UUID = UUID(),
        date: Date = Calendar.current.startOfDay(for: Date()),
        count: Int = 0,
        habit: Habit? = nil
    ) {
        self.id = id
        self.date = date
        self.count = count
        self.habit = habit
    }
}
