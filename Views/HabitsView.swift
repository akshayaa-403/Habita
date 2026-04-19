import SwiftUI
import SwiftData

struct HabitsView: View {
    @Query(sort: \.createdAt) var habits: [Habit]
    @Environment(\.modelContext) var modelContext
    @State private var showAddHabit = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                if habits.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 48))
                            .foregroundStyle(.gray)
                        Text("No Habits Yet")
                            .font(.headline)
                            .foregroundStyle(.gray)
                        Text("Create a habit to start tracking")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(.systemBackground))
                } else {
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(habits, id: \.id) { habit in
                                HabitCardView(habit: habit)
                                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                        Button(role: .destructive) {
                                            modelContext.delete(habit)
                                        } label: {
                                            Label("Delete", systemImage: "trash")
                                        }
                                    }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Habits")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { showAddHabit = true }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 24))
                            .foregroundStyle(.blue)
                    }
                }
            }
            .sheet(isPresented: $showAddHabit) {
                AddHabitView()
            }
        }
    }
}

// MARK: - Habit Card View

struct HabitCardView: View {
    @ObservedReferencedObject var habit: Habit
    @Environment(\.modelContext) var modelContext
    @State private var animateCheckbox = false
    
    var todayCompletion: Double {
        habit.todayCompletionPercentage()
    }
    
    var todayCount: Int {
        habit.todayCount()
    }
    
    var body: some View {
        VStack(spacing: 12) {
            // Header: Icon + Name + Target
            HStack(spacing: 12) {
                Image(systemName: habit.icon)
                    .font(.system(size: 20))
                    .foregroundStyle(ColorConstants.colorForLabel(habit.colorLabel))
                    .frame(width: 40, height: 40)
                    .background(ColorConstants.colorForLabel(habit.colorLabel).opacity(0.1))
                    .cornerRadius(8)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(habit.name)
                        .font(.headline)
                    Text("Target: \(habit.dailyTarget)/day")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                // Square Checkbox with Animation
                SquareCheckboxView(
                    percentage: todayCompletion,
                    isComplete: todayCompletion >= 100,
                    animateCheckbox: $animateCheckbox
                )
            }
            
            // Counter + Plus/Minus Buttons
            HStack(spacing: 12) {
                // Left: minus button
                Button(action: decrementCount) {
                    Image(systemName: "minus.circle.fill")
                        .font(.system(size: 24))
                        .foregroundStyle(.red.opacity(0.6))
                }
                .disabled(todayCount == 0)
                
                Spacer()
                
                // Center: count display
                VStack(spacing: 4) {
                    Text("\(todayCount)")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(ColorConstants.colorForLabel(habit.colorLabel))
                    
                    Text("of \(habit.dailyTarget)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                // Right: plus button
                Button(action: incrementCount) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 24))
                        .foregroundStyle(.green)
                }
            }
            .padding(.horizontal, 8)
            
            // Progress bar
            ProgressView(value: min(todayCompletion, 100) / 100)
                .tint(ColorConstants.colorForLabel(habit.colorLabel))
                .scaleEffect(y: 2, anchor: .center)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    private func incrementCount() {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        var todayLog = habit.logs.first { calendar.isDate($0.date, inSameDayAs: today) }
        
        if todayLog == nil {
            todayLog = HabitLog(date: today)
            habit.logs.append(todayLog!)
        }
        
        todayLog?.count += 1
        
        // Trigger animation if we just hit the target
        if Double(todayLog!.count) >= Double(habit.dailyTarget) {
            animateCheckbox = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                animateCheckbox = false
            }
        }
        
        try? modelContext.save()
    }
    
    private func decrementCount() {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        guard let todayLog = habit.logs.first(where: { calendar.isDate($0.date, inSameDayAs: today) }) else {
            return
        }
        
        if todayLog.count > 0 {
            todayLog.count -= 1
        }
        
        try? modelContext.save()
    }
}

// MARK: - Square Checkbox View

struct SquareCheckboxView: View {
    let percentage: Double
    let isComplete: Bool
    @Binding var animateCheckbox: Bool
    
    var body: some View {
        ZStack {
            // Background square
            RoundedRectangle(cornerRadius: 8)
                .fill(Color(.systemGray5))
                .frame(width: 56, height: 56)
            
            // Progress fill
            if percentage > 0 {
                RoundedRectangle(cornerRadius: 8)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [.blue, .blue.opacity(0.6)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 56, height: 56)
                    .scaleEffect(y: percentage / 100, anchor: .bottom)
                    .animation(.spring(response: 0.6, dampingFraction: 0.7), value: percentage)
            }
            
            // Checkmark
            if isComplete {
                Image(systemName: "checkmark")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(.white)
                    .scaleEffect(animateCheckbox ? 1.2 : 1.0)
                    .animation(.spring(response: 0.4, dampingFraction: 0.6), value: animateCheckbox)
            } else {
                Text("\(Int(percentage))%")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.gray)
            }
        }
        .frame(width: 56, height: 56)
    }
}

#Preview {
    HabitsView()
        .modelContainer(for: Habit.self, inMemory: true)
}
