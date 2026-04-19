import SwiftUI
import SwiftData

@Model
final class HabitaTask {
    var id: UUID = UUID()
    var title: String = ""
    var timeRequired: TimeInterval = 900 // Default 15min in seconds
    var icon: String = "questionmark" // NLP placeholder
    var colorLabel: String = "Blue"
    var energyLevel: Int? = nil // 1-5, manually assigned or from AI
    var complexity: Int? = nil // 1-5, from AI rating
    var urgency: Int? = nil // 1-5, from AI rating
    var quadrant: String? = nil // "highEnergyShortTime", "highEnergyLongTime", etc.
    var createdAt: Date = Date()
    var isInInbox: Bool = true
    var scheduledDate: Date? = nil
    var isCompleted: Bool = false
    
    init(title: String, timeRequired: TimeInterval) {
        self.title = title
        self.timeRequired = timeRequired
    }
}
