import SwiftUI

/// EnergyRecoveryView displays gaps in the user's schedule where they can recover energy
/// Shows on the calendar timeline to help users find "free time" for rest/recovery
struct EnergyRecoveryView: View {
    @Environment(\.appState) var appState
    let hour: Int
    let tasksInHour: [HabitaTask]
    
    /// Determines if this hour is a recovery opportunity
    var isRecoveryOpportunity: Bool {
        tasksInHour.isEmpty
    }
    
    /// Calculates recovery strength (how much energy can be gained)
    var recoveryStrength: Double {
        // Morning/evening off = good recovery (1.0)
        // Afternoon/late evening off = moderate recovery (0.7)
        // Night/early morning off = light recovery (0.5)
        if hour >= 6 && hour < 9 {
            return 1.0 // Morning = best recovery
        } else if hour >= 21 || hour < 6 {
            return 0.8 // Evening/night = strong recovery
        } else if hour >= 12 && hour < 14 {
            return 0.9 // Lunch = excellent recovery
        } else {
            return 0.6 // Scattered free time = moderate
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            if isRecoveryOpportunity && appState.showEnergyRecoveryHints {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 8) {
                        Image(systemName: "battery.100.bolt")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.green)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Recovery Time")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(.black.opacity(0.7))
                            
                            Text(recoveryDescription)
                                .font(.caption2)
                                .foregroundColor(.gray)
                        }
                        
                        Spacer()
                    }
                    
                    // Recovery strength indicator
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.gray.opacity(0.2))
                            
                            RoundedRectangle(cornerRadius: 2)
                                .fill(
                                    LinearGradient(
                                        gradient: Gradient(colors: [.green, .cyan]),
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(width: geometry.size.width * recoveryStrength)
                        }
                    }
                    .frame(height: 3)
                }
                .padding(10)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.green.opacity(0.05))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.green.opacity(0.2), lineWidth: 1)
                )
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
            }
        }
    }
    
    var recoveryDescription: String {
        if hour >= 6 && hour < 9 {
            return "Morning meditation or exercise recommended"
        } else if hour >= 12 && hour < 14 {
            return "Take a lunch break to recharge"
        } else if hour >= 21 || hour < 6 {
            return "Rest and prepare for tomorrow"
        } else if hour >= 17 && hour < 19 {
            return "Good time for a quick walk or stretch"
        } else {
            return "Use this time to catch your breath"
        }
    }
}

// MARK: - Energy Gauge Component

/// EnergyGaugeView shows cumulative energy level for the day
struct EnergyGaugeView: View {
    let currentEnergy: Int  // 1-5
    let maxEnergy: Int = 5
    let tasks: [HabitaTask]
    
    var energyLabel: String {
        switch currentEnergy {
        case 5:
            return "Fully Charged ⚡"
        case 4:
            return "High Energy 💪"
        case 3:
            return "Balanced ⚖️"
        case 2:
            return "Getting Tired 😴"
        default:
            return "Exhausted 💤"
        }
    }
    
    var energyColor: Color {
        switch currentEnergy {
        case 5, 4:
            return .green
        case 3:
            return .yellow
        case 2:
            return .orange
        default:
            return .red
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Daily Energy")
                .font(.headline)
                .fontWeight(.semibold)
            
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        ForEach(1...maxEnergy, id: \.self) { level in
                            RoundedRectangle(cornerRadius: 4)
                                .fill(level <= currentEnergy ? energyColor : Color.gray.opacity(0.2))
                                .frame(height: 8)
                        }
                    }
                    
                    Text(energyLabel)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(energyColor)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(currentEnergy)/\(maxEnergy)")
                        .font(.title3)
                        .fontWeight(.bold)
                    
                    Text("\(tasks.count) tasks scheduled")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
            }
            .padding(12)
            .background(Color.white)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.gray.opacity(0.1), lineWidth: 1)
            )
        }
    }
}

#Preview {
    VStack {
        EnergyRecoveryView(
            hour: 12,
            tasksInHour: []
        )
        
        EnergyGaugeView(
            currentEnergy: 3,
            tasks: []
        )
    }
    .padding()
}
