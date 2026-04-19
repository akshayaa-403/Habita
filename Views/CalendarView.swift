import SwiftUI
import SwiftData

struct CalendarView: View {
    @Query(filter: #Predicate<HabitaTask> { !$0.isInInbox }, sort: \.scheduledDate) var scheduledTasks: [HabitaTask]
    @Environment(\.modelContext) var modelContext
    @State private var showAddTask = false
    @State private var selectedDate = Date()
    
    var todayTasks: [HabitaTask] {
        let calendar = Calendar.current
        return scheduledTasks.filter { task in
            guard let scheduledDate = task.scheduledDate else { return false }
            return calendar.isDate(scheduledDate, inSameDayAs: Date())
        }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                VStack(spacing: 0) {
                    // All-Day Habit Strip
                    AllDayHabitStripView()
                    
                    Divider()
                    
                    // Date Header
                    VStack(spacing: 8) {
                        HStack {
                            Button(action: { selectedDate = Calendar.current.date(byAdding: .day, value: -1, to: selectedDate)! }) {
                                Image(systemName: "chevron.left")
                            }
                            
                            Spacer()
                            
                            Text(selectedDate.formatted(date: .abbreviated, time: .omitted))
                                .font(.headline)
                            
                            Spacer()
                            
                            Button(action: { selectedDate = Calendar.current.date(byAdding: .day, value: 1, to: selectedDate)! }) {
                                Image(systemName: "chevron.right")
                            }
                        }
                        .padding(.horizontal)
                        
                        if todayTasks.isEmpty {
                            Text("No tasks scheduled")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 12)
                    
                    Divider()
                    
                    // Timeline
                    ScrollView {
                        VStack(alignment: .leading, spacing: 0) {
                            ForEach(0..<24, id: \.self) { hour in
                                TimelineHourView(hour: hour, tasks: tasksForHour(hour))
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    Spacer()
                }
                
                // Floating Action Button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: { showAddTask = true }) {
                            Image(systemName: "plus")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(width: 56, height: 56)
                                .background(Color.blue)
                                .clipShape(Circle())
                                .shadow(radius: 4)
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Calendar")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showAddTask) {
                AddTaskView()
            }
        }
    }
    
    private func tasksForHour(_ hour: Int) -> [HabitaTask] {
        let calendar = Calendar.current
        return todayTasks.filter { task in
            guard let scheduledDate = task.scheduledDate else { return false }
            let taskHour = calendar.component(.hour, from: scheduledDate)
            return taskHour == hour
        }
    }
}

// MARK: - Timeline Hour View

struct TimelineHourView: View {
    let hour: Int
    let tasks: [HabitaTask]
    
    var hourLabel: String {
        let period = hour < 12 ? "AM" : "PM"
        let displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour)
        return "\(displayHour) \(period)"
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top, spacing: 12) {
                Text(hourLabel)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .frame(width: 40)
                
                if tasks.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Circle()
                                .fill(Color.green.opacity(0.3))
                                .frame(width: 4, height: 4)
                            Text("Energy Recovery")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(8)
                    .background(Color.green.opacity(0.05))
                    .cornerRadius(6)
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(tasks, id: \.id) { task in
                            TaskTimeBlockView(task: task)
                        }
                    }
                }
            }
            
            Divider()
                .padding(.leading, 52)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Task Time Block

struct TaskTimeBlockView: View {
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
    
    func colorForLabel(_ label: String) -> Color {
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
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: task.icon)
                .font(.system(size: 16))
                .foregroundStyle(colorForLabel(task.colorLabel))
            
            VStack(alignment: .leading, spacing: 2) {
                Text(task.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Label(durationText, systemImage: "clock")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            if let energy = task.energyLevel {
                VStack(spacing: 2) {
                    Image(systemName: "battery.100")
                        .font(.system(size: 12))
                    Text("\(energy)/5")
                        .font(.caption2)
                }
                .foregroundStyle(.orange)
            }
        }
        .padding(8)
        .background(colorForLabel(task.colorLabel).opacity(0.1))
        .cornerRadius(6)
    }
}

#Preview {
    CalendarView()
        .modelContainer(for: HabitaTask.self, inMemory: true)
}
