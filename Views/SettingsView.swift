import SwiftUI
import SwiftData

struct SettingsView: View {
    @Query(sort: \.lastUpdated, order: .reverse) var winsTrackers: [WinsTracker]
    @Environment(\.modelContext) var modelContext
    @State var appState = AppState.shared
    @State private var showDataResetConfirmation = false
    
    var body: some View {
        NavigationStack {
            Form {
                Section("About Habita") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0")
                            .foregroundStyle(.secondary)
                    }
                    
                    HStack {
                        Text("Build")
                        Spacer()
                        Text("April 19, 2026")
                            .foregroundStyle(.secondary)
                    }
                }
                
                Section("Stats") {
                    if let tracker = winsTrackers.first {
                        NavigationLink(destination: WinsStatsView()) {
                            HStack {
                                Label("View All Wins", systemImage: "chart.bar")
                                Spacer()
                                Text("\(tracker.totalWins)")
                                    .fontWeight(.semibold)
                                    .foregroundStyle(.blue)
                            }
                        }
                    }
                }
                
                Section("Appearance") {
                    Picker("Theme", selection: $appState.darkModeSetting) {
                        ForEach(DarkModeSetting.allCases, id: \.self) { setting in
                            Text(setting.description)
                                .tag(setting)
                        }
                    }
                }
                
                Section("Productivity") {
                    Toggle("Energy Recovery Hints", isOn: $appState.showEnergyRecoveryHints)
                        .help("Show when you can take breaks to recharge")
                    
                    Toggle("Enable Notifications", isOn: $appState.notificationsEnabled)
                        .help("Daily reminders and habit check-ins")
                }
                
                Section("Data", content: {
                    Button(role: .destructive) {
                        showDataResetConfirmation = true
                    } label: {
                        HStack {
                            Image(systemName: "trash")
                            Text("Clear All Data")
                        }
                    }
                    
                    NavigationLink(destination: ConcatenationBonusInfoView()) {
                        HStack {
                            Image(systemName: "wand.and.stars")
                            Text("Concatenation Bonus Info")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundStyle(.gray)
                        }
                    }
                })
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .confirmationDialog(
                "Clear All Data?",
                isPresented: $showDataResetConfirmation,
                actions: {
                    Button("Clear All", role: .destructive) {
                        resetAllData()
                    }
                    Button("Cancel", role: .cancel) {}
                },
                message: {
                    Text("This will delete all tasks, habits, and progress. This action cannot be undone.")
                }
            )
        }
    }
    
    private func resetAllData() {
        // Delete all SwiftData models
        do {
            try modelContext.delete(model: HabitaTask.self)
            try modelContext.delete(model: Habit.self)
            try modelContext.delete(model: HabitLog.self)
            try modelContext.delete(model: WinsTracker.self)
            
            // Reset app state
            appState.resetAllData()
        } catch {
            print("Error clearing data: \(error)")
        }
    }
}

// MARK: - Concatenation Bonus Info View

struct ConcatenationBonusInfoView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    Label("Concatenation Bonus", systemImage: "wand.and.stars")
                        .font(.headline)
                        .fontWeight(.bold)
                    
                    Text("Earn bonus points by stacking productive behaviors.")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                
                VStack(alignment: .leading, spacing: 12) {
                    Text("How It Works")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    BonusExampleRow(
                        title: "Task + Habit",
                        description: "Complete a task while building a habit",
                        bonus: "+5 points",
                        icon: "🎯"
                    )
                    
                    BonusExampleRow(
                        title: "Multiple Habits",
                        description: "Log 3+ habits on the same day as a task",
                        bonus: "+3 points",
                        icon: "⭐"
                    )
                    
                    BonusExampleRow(
                        title: "Quick Wins",
                        description: "Complete tasks under 15 minutes",
                        bonus: "+2 points",
                        icon: "⚡"
                    )
                    
                    BonusExampleRow(
                        title: "Energy Momentum",
                        description: "Tackle low-energy tasks while building habits",
                        bonus: "+3 points",
                        icon: "💪"
                    )
                }
                .padding(12)
                .background(Color(.systemGray6))
                .cornerRadius(8)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Why Concatenation?")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text("The best productivity happens when you combine multiple productive actions. Instead of separating your task work from habit building, Habita rewards you for doing them together. That's concatenation.")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            .padding()
        }
        .navigationTitle("Concatenation Bonus")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Bonus Example Row

struct BonusExampleRow: View {
    let title: String
    let description: String
    let bonus: String
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Text(icon)
                    .font(.system(size: 24))
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text(bonus)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
                    .padding(6)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(4)
            }
        }
        .padding(8)
        .background(Color.white)
        .cornerRadius(6)
    }
}

#Preview {
    SettingsView()
        .modelContainer(for: WinsTracker.self, inMemory: true)
}
