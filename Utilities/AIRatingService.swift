import SwiftUI

struct AIRatingService {
    // MARK: - NLP-Based Rating
    
    static func suggestRatings(for taskName: String) -> (complexity: Int, urgency: Int) {
        let lowercased = taskName.lowercased()
        
        // Complexity indicators
        let highComplexityKeywords = [
            "code", "debug", "develop", "design", "architecture", "algorithm",
            "analysis", "report", "research", "documentation", "planning",
            "negotiation", "presentation", "meeting", "strategic", "complex"
        ]
        
        let mediumComplexityKeywords = [
            "write", "edit", "review", "organize", "setup", "configure",
            "process", "manage", "coordinate", "prepare", "analyze"
        ]
        
        let lowComplexityKeywords = [
            "read", "email", "call", "message", "browse", "check",
            "quick", "simple", "fast", "easy", "view"
        ]
        
        // Urgency indicators
        let highUrgencyKeywords = [
            "urgent", "asap", "emergency", "deadline", "critical", "crisis",
            "urgent", "important", "priority", "immediately", "now",
            "meeting", "appointment", "call", "email", "response"
        ]
        
        let mediumUrgencyKeywords = [
            "follow-up", "tomorrow", "soon", "deadline", "schedule",
            "plan", "prepare", "organize", "coordinate"
        ]
        
        // Calculate complexity
        var complexity = 3 // Default
        if highComplexityKeywords.contains(where: { lowercased.contains($0) }) {
            complexity = 5
        } else if mediumComplexityKeywords.contains(where: { lowercased.contains($0) }) {
            complexity = 3
        } else if lowComplexityKeywords.contains(where: { lowercased.contains($0) }) {
            complexity = 1
        }
        
        // Calculate urgency
        var urgency = 3 // Default
        if highUrgencyKeywords.contains(where: { lowercased.contains($0) }) {
            urgency = 5
        } else if mediumUrgencyKeywords.contains(where: { lowercased.contains($0) }) {
            urgency = 3
        }
        
        return (complexity: complexity, urgency: urgency)
    }
    
    // MARK: - Energy Level Mapping
    
    static func mapUrgencyToEnergyLevel(_ urgency: Int) -> Int {
        // Higher urgency requires higher energy
        switch urgency {
        case 1...2: return 1
        case 3: return 2
        case 4: return 4
        case 5: return 5
        default: return 3
        }
    }
    
    // MARK: - Quadrant Mapping
    
    static func quadrantForTask(timeRequired: TimeInterval, energyLevel: Int) -> String {
        let isShortTime = timeRequired < 1800 // Less than 30 minutes
        let isHighEnergy = energyLevel >= 4
        
        if isHighEnergy && isShortTime {
            return "highEnergyShortTime"
        } else if isHighEnergy && !isShortTime {
            return "highEnergyLongTime"
        } else if !isHighEnergy && isShortTime {
            return "lowEnergyShortTime"
        } else {
            return "lowEnergyLongTime"
        }
    }
}
