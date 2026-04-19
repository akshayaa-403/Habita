import SwiftUI
import SwiftData

@Model
final class WinsTracker {
    var id: UUID = UUID()
    var totalWins: Int = 0
    var lastUpdated: Date = Date()
    
    // Win categories
    var completedTasks: Int = 0
    var habitDaysLogged: Int = 0
    var bonusPointsEarned: Int = 0
    
    var createdAt: Date = Date()
    
    func recordTaskCompletion() {
        totalWins += 1
        completedTasks += 1
        lastUpdated = Date()
    }
    
    func recordHabitDay() {
        totalWins += 1
        habitDaysLogged += 1
        lastUpdated = Date()
    }
    
    func recordBonus(_ points: Int = 10) {
        totalWins += points
        bonusPointsEarned += points
        lastUpdated = Date()
    }
}
