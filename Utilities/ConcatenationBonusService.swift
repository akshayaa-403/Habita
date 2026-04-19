import Foundation
import SwiftData

/// ConcatenationBonusService tracks when habits and task completion overlap
/// Rewards users for combining productive actions (e.g., exercising while on a work call)
/// "Concatenation" = stacking multiple productive behaviors at once
@Observable
final class ConcatenationBonusService {
    static let shared = ConcatenationBonusService()
    
    /// Checks if user earned concatenation bonus and calculates reward
    /// Returns bonus points (0-10 depending on overlap intensity)
    func checkForBonus(
        taskName: String,
        taskDuration: TimeInterval,
        habitLogsToday: [HabitLog],
        taskScheduledTime: Date?
    ) -> (bonusPoints: Int, bonusDescription: String) {
        var totalBonus: Int = 0
        var descriptions: [String] = []
        
        // Bonus 1: Task completed during logged habit time
        // If user logged a habit (e.g., exercise) and also completed a task during that time, bonus!
        if !habitLogsToday.isEmpty {
            // 5 points for completing a task while also practicing a habit
            totalBonus += 5
            descriptions.append("Task completed while building habits +5")
        }
        
        // Bonus 2: Multiple habits logged same day as task completion
        if habitLogsToday.count >= 3 {
            // 3 points for juggling 3+ habits with task work
            totalBonus += 3
            descriptions.append("Multiple habits stacked +3")
        } else if habitLogsToday.count == 2 {
            // 2 points for two concurrent habits
            totalBonus += 2
            descriptions.append("Dual habits with task +2")
        }
        
        // Bonus 3: Quick task completed (less than 15 minutes)
        if taskDuration < 900 { // 15 minutes in seconds
            totalBonus += 2
            descriptions.append("Quick task completed +2")
        }
        
        // Bonus 4: Energy alignment
        // If task is in "low energy" category but user completed high-energy habits, bonus for momentum
        let lowEnergyKeywords = ["email", "admin", "organize", "cleanup", "paperwork", "documentation"]
        let isLowEnergyTask = lowEnergyKeywords.contains { taskName.lowercased().contains($0) }
        
        if isLowEnergyTask && !habitLogsToday.isEmpty {
            totalBonus += 3
            descriptions.append("Energy momentum boost +3")
        }
        
        let bonusDescription = descriptions.isEmpty ? "No bonus this time" : descriptions.joined(separator: " • ")
        
        return (totalBonus, bonusDescription)
    }
    
    /// Records concatenation bonus to WinsTracker
    func recordConcatenationBonus(_ points: Int, in modelContext: ModelContext) {
        do {
            let fetchRequest = FetchDescriptor<WinsTracker>()
            if let tracker = try modelContext.fetch(fetchRequest).first {
                tracker.bonusPointsEarned += points
                tracker.totalWins += points
                tracker.lastUpdated = Date()
                try modelContext.save()
            }
        } catch {
            print("Error recording concatenation bonus: \(error)")
        }
    }
}

// MARK: - Energy Alignment Helper

enum TaskEnergyCategory {
    case highEnergy  // Requires mental focus/creativity
    case lowEnergy   // Administrative/routine work
    
    init(taskName: String) {
        let lowercased = taskName.lowercased()
        
        let highEnergyKeywords = [
            "code", "debug", "develop", "design", "create", "write",
            "plan", "architect", "analyze", "research", "solve",
            "innovate", "build", "implement"
        ]
        
        let hasHighEnergyKeyword = highEnergyKeywords.contains { lowercased.contains($0) }
        
        self = hasHighEnergyKeyword ? .highEnergy : .lowEnergy
    }
    
    var description: String {
        switch self {
        case .highEnergy:
            return "High Energy"
        case .lowEnergy:
            return "Low Energy"
        }
    }
}
