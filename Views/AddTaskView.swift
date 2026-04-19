import SwiftUI
import SwiftData
import NaturalLanguage

struct AddTaskView: View {
    @Environment(\.dismiss) var dismiss
    @Environment(\.modelContext) var modelContext
    
    @State private var taskTitle: String = ""
    @State private var durationMinutes: String = "15"
    @State private var suggestedIcon: String = "questionmark"
    @State private var selectedColor: String = "Blue"
    
    let colors = ["Blue", "Red", "Green", "Orange", "Purple", "Pink", "Yellow"]
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Task Details") {
                    TextField("Task name", text: $taskTitle)
                        .onChange(of: taskTitle) { oldValue, newValue in
                            updateSuggestedIcon()
                        }
                    
                    HStack {
                        TextField("Duration (minutes)", text: $durationMinutes)
                            .keyboardType(.numberPad)
                        Text("min")
                            .foregroundStyle(.secondary)
                    }
                }
                
                Section("Icon & Label") {
                    HStack {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Suggested Icon")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            HStack(spacing: 12) {
                                Image(systemName: suggestedIcon)
                                    .font(.system(size: 24))
                                    .foregroundStyle(.blue)
                                Text("Tap to change")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        Spacer()
                        NavigationLink(destination: IconPickerView(selectedIcon: $suggestedIcon)) {
                            Image(systemName: "chevron.right")
                                .foregroundStyle(.gray)
                        }
                    }
                    .padding(.vertical, 4)
                    
                    Picker("Color Label", selection: $selectedColor) {
                        ForEach(colors, id: \.self) { color in
                            HStack {
                                Circle()
                                    .fill(colorForLabel(color))
                                    .frame(width: 12, height: 12)
                                Text(color)
                            }
                            .tag(color)
                        }
                    }
                }
            }
            .navigationTitle("Add Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        saveTask()
                    }
                    .disabled(taskTitle.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
    
    // MARK: - Private Methods
    
    private func updateSuggestedIcon() {
        // Simple NLP-based icon suggestion using task keywords
        let lowercased = taskTitle.lowercased()
        
        let iconMappings: [String: String] = [
            "gym": "dumbbell",
            "exercise": "figure.walk",
            "run": "figure.run",
            "walk": "figure.walk",
            "meditate": "sparkles",
            "yoga": "figure.yoga",
            "doctor": "stethoscope",
            "call": "phone",
            "meeting": "person.2",
            "email": "envelope",
            "write": "pencil",
            "read": "book",
            "cook": "fork.knife",
            "eat": "fork.knife",
            "sleep": "moon.zzz",
            "shower": "drop",
            "water": "water.circle",
            "shop": "cart",
            "work": "briefcase",
            "study": "book.closed",
            "code": "terminal",
            "debug": "ant",
            "music": "music.note",
            "draw": "paintbrush",
            "photo": "camera",
            "video": "video",
            "paint": "paintbrush",
            "clean": "sparkles"
        ]
        
        for (keyword, icon) in iconMappings {
            if lowercased.contains(keyword) {
                suggestedIcon = icon
                return
            }
        }
        
        suggestedIcon = "questionmark"
    }
    
    private func saveTask() {
        let minutes = Double(durationMinutes) ?? 15
        let newTask = HabitaTask(
            title: taskTitle.trimmingCharacters(in: .whitespaces),
            timeRequired: minutes * 60 // Convert to seconds
        )
        newTask.icon = suggestedIcon
        newTask.colorLabel = selectedColor
        newTask.createdAt = Date()
        newTask.isInInbox = true
        
        modelContext.insert(newTask)
        dismiss()
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

// MARK: - Icon Picker View

struct IconPickerView: View {
    @Environment(\.dismiss) var dismiss
    @Binding var selectedIcon: String
    
    let systemIcons = [
        "questionmark", "dumbbell", "figure.walk", "figure.run", "sparkles",
        "figure.yoga", "stethoscope", "phone", "person.2", "envelope",
        "pencil", "book", "fork.knife", "moon.zzz", "drop",
        "water.circle", "cart", "briefcase", "book.closed", "terminal",
        "ant", "music.note", "paintbrush", "camera", "video"
    ]
    
    var body: some View {
        NavigationStack {
            let columns = [GridItem(.adaptive(minimum: 50))]
            
            ScrollView {
                LazyVGrid(columns: columns, spacing: 16) {
                    ForEach(systemIcons, id: \.self) { icon in
                        Button(action: {
                            selectedIcon = icon
                            dismiss()
                        }) {
                            Image(systemName: icon)
                                .font(.system(size: 20))
                                .frame(height: 50)
                                .frame(maxWidth: .infinity)
                                .background(selectedIcon == icon ? Color.blue.opacity(0.2) : Color.gray.opacity(0.1))
                                .cornerRadius(8)
                                .foregroundStyle(selectedIcon == icon ? .blue : .gray)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Choose Icon")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    AddTaskView()
        .modelContainer(for: HabitaTask.self, inMemory: true)
}
