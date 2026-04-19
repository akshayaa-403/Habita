import SwiftUI

/// AccessibilityHelper provides utilities for enhanced VoiceOver and accessibility support
/// Includes custom labels, hints, and traits for better screen reader experience
struct AccessibilityHelper {
    /// Formats task information for VoiceOver announcements
    static func taskAccessibilityLabel(
        title: String,
        timeRequired: TimeInterval,
        energyLevel: Int? = nil,
        quadrant: String? = nil
    ) -> String {
        var components: [String] = [title]
        
        let minutes = Int(timeRequired) / 60
        if minutes > 0 {
            components.append("\(minutes) minutes")
        }
        
        if let energyLevel = energyLevel {
            components.append("energy level \(energyLevel) out of 5")
        }
        
        if let quadrant = quadrant {
            components.append("in \(quadrantLabel(quadrant))")
        }
        
        return components.joined(separator: ", ")
    }
    
    /// Provides accessible label for matrix quadrants
    static func quadrantLabel(_ quadrant: String) -> String {
        switch quadrant {
        case "highEnergyShortTime":
            return "High Energy, Short Time quadrant"
        case "highEnergyLongTime":
            return "High Energy, Long Time quadrant"
        case "lowEnergyShortTime":
            return "Low Energy, Short Time quadrant"
        case "lowEnergyLongTime":
            return "Low Energy, Long Time quadrant"
        default:
            return "Inbox"
        }
    }
    
    /// Formats habit completion for VoiceOver announcements
    static func habitAccessibilityLabel(
        name: String,
        dailyTarget: Int,
        todayCount: Int,
        completionPercentage: Double
    ) -> String {
        let percentage = Int(completionPercentage)
        return "\(name), logged \(todayCount) out of \(dailyTarget) target, \(percentage)% complete"
    }
    
    /// Formats wins tracker information for accessibility
    static func winsAccessibilityLabel(
        totalWins: Int,
        completedTasks: Int,
        habitDaysLogged: Int,
        bonusPointsEarned: Int
    ) -> String {
        var details: [String] = []
        
        if completedTasks > 0 {
            details.append("\(completedTasks) tasks completed")
        }
        
        if habitDaysLogged > 0 {
            details.append("\(habitDaysLogged) habit days logged")
        }
        
        if bonusPointsEarned > 0 {
            details.append("\(bonusPointsEarned) bonus points")
        }
        
        let breakdown = details.joined(separator: ", ")
        return "Total \(totalWins) wins. \(breakdown)"
    }
}

// MARK: - Accessible View Modifiers

extension View {
    /// Adds custom accessibility label and hint
    func accessibleTask(
        title: String,
        timeRequired: TimeInterval = 0,
        energyLevel: Int? = nil,
        quadrant: String? = nil,
        hint: String? = nil
    ) -> some View {
        self.accessibilityLabel(
            AccessibilityHelper.taskAccessibilityLabel(
                title: title,
                timeRequired: timeRequired,
                energyLevel: energyLevel,
                quadrant: quadrant
            )
        )
        .accessibilityHint(hint ?? "Double tap to open task details")
        .accessibilityAddTraits(.isButton)
    }
    
    /// Adds custom accessibility label and hint for habits
    func accessibleHabit(
        name: String,
        dailyTarget: Int,
        todayCount: Int,
        completionPercentage: Double,
        hint: String? = nil
    ) -> some View {
        self.accessibilityLabel(
            AccessibilityHelper.habitAccessibilityLabel(
                name: name,
                dailyTarget: dailyTarget,
                todayCount: todayCount,
                completionPercentage: completionPercentage
            )
        )
        .accessibilityHint(hint ?? "Double tap to see options")
        .accessibilityElement(children: .combine)
    }
    
    /// Adds accessibility for chart/graph data
    func accessibleChart(
        title: String,
        description: String,
        summary: String
    ) -> some View {
        self.accessibilityLabel(title)
            .accessibilityHint("\(description). \(summary)")
            .accessibilityElement(children: .combine)
    }
    
    /// Makes VoiceOver skip decorative elements
    func accessibilityHidden() -> some View {
        self.accessibility(hidden: true)
    }
    
    /// Groups related accessibility elements
    func accessibilityGroup() -> some View {
        self.accessibilityElement(children: .combine)
    }
}

// MARK: - Color Accessibility Helpers

extension Color {
    /// Returns a string name for the color (for screen readers)
    var accessibilityName: String {
        // These would be extended based on ColorConstants colors
        switch self {
        case .blue:
            return "Blue"
        case .red:
            return "Red"
        case .green:
            return "Green"
        case .orange:
            return "Orange"
        case .purple:
            return "Purple"
        case .pink:
            return "Pink"
        case .yellow:
            return "Yellow"
        default:
            return "Color"
        }
    }
}

// MARK: - Dynamic Type Support

extension Font {
    /// Returns font with dynamic type support
    static func body(weight: Font.Weight = .regular) -> Font {
        .system(.body, design: .default).weight(weight)
    }
    
    static func headline(weight: Font.Weight = .semibold) -> Font {
        .system(.headline, design: .default).weight(weight)
    }
    
    static func title(weight: Font.Weight = .bold) -> Font {
        .system(.title, design: .default).weight(weight)
    }
}

// MARK: - Haptic Feedback for Accessibility

struct HapticFeedbackHelper {
    /// Provides haptic feedback for common actions
    static func buttonTapped() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }
    
    static func taskCompleted() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }
    
    static func habitLogged() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }
    
    static func error() {
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    }
}
