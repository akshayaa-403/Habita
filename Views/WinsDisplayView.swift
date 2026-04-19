import SwiftUI
import SwiftData

struct WinsDisplayView: View {
    @Query(sort: \.lastUpdated, order: .reverse) var winsTrackers: [WinsTracker]
    
    var currentWins: Int {
        winsTrackers.first?.totalWins ?? 0
    }
    
    var currentStats: (tasks: Int, habits: Int, bonus: Int) {
        guard let tracker = winsTrackers.first else {
            return (0, 0, 0)
        }
        return (tracker.completedTasks, tracker.habitDaysLogged, tracker.bonusPointsEarned)
    }
    
    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [.blue, .blue.opacity(0.6)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 48, height: 48)
                
                VStack(spacing: 2) {
                    Text("🏆")
                        .font(.system(size: 20))
                    Text("\(currentWins)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white)
                }
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Wins")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                HStack(spacing: 8) {
                    Label("\(currentStats.tasks)", systemImage: "checkmark.circle")
                        .font(.caption2)
                    
                    Divider()
                        .frame(height: 10)
                    
                    Label("\(currentStats.habits)", systemImage: "star")
                        .font(.caption2)
                    
                    Divider()
                        .frame(height: 10)
                    
                    Label("+\(currentStats.bonus)", systemImage: "bolt")
                        .font(.caption2)
                        .foregroundStyle(.orange)
                }
            }
        }
        .padding(8)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

// MARK: - Stats Breakdown View

struct WinsStatsView: View {
    @Query(sort: \.lastUpdated, order: .reverse) var winsTrackers: [WinsTracker]
    
    var tracker: WinsTracker? {
        winsTrackers.first
    }
    
    var body: some View {
        NavigationStack {
            if let tracker = tracker {
                Form {
                    Section("Total Wins") {
                        HStack {
                            Text("🏆 Cumulative Wins")
                            Spacer()
                            Text("\(tracker.totalWins)")
                                .font(.headline)
                                .foregroundStyle(.blue)
                        }
                    }
                    
                    Section("Breakdown") {
                        HStack {
                            Label("Tasks Completed", systemImage: "checkmark.circle")
                            Spacer()
                            Text("\(tracker.completedTasks)")
                                .fontWeight(.semibold)
                        }
                        
                        HStack {
                            Label("Habit Days Logged", systemImage: "star")
                            Spacer()
                            Text("\(tracker.habitDaysLogged)")
                                .fontWeight(.semibold)
                        }
                        
                        HStack {
                            Label("Bonus Points", systemImage: "bolt")
                            Spacer()
                            Text("+\(tracker.bonusPointsEarned)")
                                .fontWeight(.semibold)
                                .foregroundStyle(.orange)
                        }
                    }
                    
                    Section("Last Updated") {
                        Text(tracker.lastUpdated.formatted(date: .abbreviated, time: .shortened))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .navigationTitle("Wins")
                .navigationBarTitleDisplayMode(.inline)
            } else {
                Text("No wins tracked yet")
                    .foregroundStyle(.secondary)
                    .navigationTitle("Wins")
            }
        }
    }
}

#Preview {
    WinsDisplayView()
        .modelContainer(for: WinsTracker.self, inMemory: true)
}
