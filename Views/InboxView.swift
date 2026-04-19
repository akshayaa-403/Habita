import SwiftUI
import SwiftData

struct InboxView: View {
    @Query(filter: #Predicate<HabitaTask> { $0.isInInbox }, sort: \.createdAt, order: .reverse) var inboxTasks: [HabitaTask]
    @Environment(\.modelContext) var modelContext
    @State private var showAddTask = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                if inboxTasks.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "inbox.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(.gray)
                        Text("Inbox Empty")
                            .font(.headline)
                            .foregroundStyle(.gray)
                        Text("Tap the + button to add a task")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(.systemBackground))
                } else {
                    List {
                        // Wins Display
                        Section {
                            WinsDisplayView()
                        } header: {
                            Text("Stats")
                        }
                        
                        // Tasks
                        Section {
                            ForEach(inboxTasks) { task in
                                InboxTaskRow(task: task)
                                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                        Button(role: .destructive) {
                                            modelContext.delete(task)
                                        } label: {
                                            Label("Delete", systemImage: "trash")
                                        }
                                        
                                        Button {
                                            task.isInInbox = false
                                            task.scheduledDate = Date()
                                        } label: {
                                            Label("Schedule", systemImage: "calendar")
                                        }
                                        .tint(.blue)
                                    }
                            }
                        } header: {
                            Text("Tasks")
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Inbox")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { showAddTask = true }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 24))
                            .foregroundStyle(.blue)
                    }
                }
            }
            .sheet(isPresented: $showAddTask) {
                AddTaskView()
            }
        }
    }
}

// MARK: - Inbox Task Row

struct InboxTaskRow: View {
    let task: HabitaTask
    
    var durationText: String {
        let minutes = Int(task.timeRequired / 60)
        if minutes < 60 {
            return "\(minutes)m"
        } else {
            let hours = minutes / 60
            let mins = minutes % 60
            return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            // Icon
            Image(systemName: task.icon)
                .font(.system(size: 20))
                .foregroundStyle(colorForLabel(task.colorLabel))
                .frame(width: 32, height: 32)
                .background(colorForLabel(task.colorLabel).opacity(0.1))
                .cornerRadius(8)
            
            // Task Info
            VStack(alignment: .leading, spacing: 4) {
                Text(task.title)
                    .font(.headline)
                    .lineLimit(1)
                
                HStack(spacing: 8) {
                    Label(durationText, systemImage: "clock")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    if let energy = task.energyLevel {
                        Label("\(energy)/5", systemImage: "battery.100")
                            .font(.caption)
                            .foregroundStyle(.orange)
                    }
                }
            }
            
            Spacer()
            
            // Created Date
            VStack(alignment: .trailing, spacing: 4) {
                Text(task.createdAt.formatted(date: .omitted, time: .shortened))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 8)
    }
    
    private func colorForLabel(_ label: String) -> Color {
        switch label {
        case "Red": return .red
        case "Green": return .green
        case "Orange": return .orange
        case "Purple": return .purple
        case "Pink": return .pink
        case "Yellow": return .yellow
        default: return .blue
        }
    }
}

#Preview {
    InboxView()
        .modelContainer(for: HabitaTask.self, inMemory: true)
}
