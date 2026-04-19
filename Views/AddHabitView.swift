import SwiftUI
import SwiftData

struct AddHabitView: View {
    @Environment(\.dismiss) var dismiss
    @Environment(\.modelContext) var modelContext
    
    @State private var habitName: String = ""
    @State private var selectedIcon: String = "sparkles"
    @State private var selectedColor: String = "Blue"
    @State private var dailyTarget: String = "1"
    
    let colors = ["Blue", "Red", "Green", "Orange", "Purple", "Pink", "Yellow"]
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Habit Name") {
                    TextField("e.g., Meditate, Drink Water", text: $habitName)
                }
                
                Section("Daily Target") {
                    HStack {
                        TextField("Target count", text: $dailyTarget)
                            .keyboardType(.numberPad)
                        Text("times/day")
                            .foregroundStyle(.secondary)
                    }
                }
                
                Section("Icon & Color") {
                    HStack {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Habit Icon")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            HStack(spacing: 12) {
                                Image(systemName: selectedIcon)
                                    .font(.system(size: 24))
                                    .foregroundStyle(.blue)
                                Text("Tap to change")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        Spacer()
                        NavigationLink(destination: HabitIconPickerView(selectedIcon: $selectedIcon)) {
                            Image(systemName: "chevron.right")
                                .foregroundStyle(.gray)
                        }
                    }
                    .padding(.vertical, 4)
                    
                    Picker("Color Label", selection: $selectedColor) {
                        ForEach(colors, id: \.self) { color in
                            HStack {
                                Circle()
                                    .fill(ColorConstants.colorForLabel(color))
                                    .frame(width: 12, height: 12)
                                Text(color)
                            }
                            .tag(color)
                        }
                    }
                }
            }
            .navigationTitle("Add Habit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        saveHabit()
                    }
                    .disabled(habitName.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
    
    private func saveHabit() {
        let target = Int(dailyTarget) ?? 1
        let newHabit = Habit(
            name: habitName.trimmingCharacters(in: .whitespaces),
            icon: selectedIcon,
            colorLabel: selectedColor,
            dailyTarget: max(1, target)
        )
        
        modelContext.insert(newHabit)
        dismiss()
    }
}

// MARK: - Habit Icon Picker

struct HabitIconPickerView: View {
    @Environment(\.dismiss) var dismiss
    @Binding var selectedIcon: String
    
    let systemIcons = [
        "sparkles", "heart", "dumbbell", "figure.walk", "figure.run",
        "figure.yoga", "book", "pencil", "music.note", "paintbrush",
        "drop.fill", "fork.knife", "moon.zzz", "sun.max", "leaf",
        "flame", "bolt", "wind", "star", "moon.stars",
        "brain.head.profile", "pills", "cup.and.saucer", "apple"
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
    AddHabitView()
        .modelContainer(for: Habit.self, inMemory: true)
}
