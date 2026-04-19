import SwiftUI
import SwiftData

struct AllDayHabitStripView: View {
    @Query(sort: \.createdAt) var habits: [Habit]
    @Environment(\.modelContext) var modelContext
    
    var body: some View {
        if habits.isEmpty {
            EmptyView()
        } else {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(habits, id: \.id) { habit in
                        AllDayHabitItemView(habit: habit)
                    }
                }
                .padding(.horizontal)
            }
            .frame(height: 100)
            .background(Color(.systemGray6))
        }
    }
}

// MARK: - All Day Habit Item

struct AllDayHabitItemView: View {
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
        VStack(spacing: 8) {
            // Icon + Name
            VStack(spacing: 4) {
                Image(systemName: habit.icon)
                    .font(.system(size: 16))
                    .foregroundStyle(ColorConstants.colorForLabel(habit.colorLabel))
                
                Text(habit.name)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .lineLimit(1)
            }
            
            // Counter with +/- buttons
            HStack(spacing: 4) {
                Button(action: decrementCount) {
                    Image(systemName: "minus")
                        .font(.system(size: 10, weight: .bold))
                        .frame(width: 20, height: 20)
                        .background(Color.red.opacity(0.3))
                        .cornerRadius(4)
                        .foregroundStyle(.red)
                }
                .disabled(todayCount == 0)
                
                Text("\(todayCount)")
                    .font(.system(size: 14, weight: .bold))
                    .frame(width: 24)
                    .foregroundStyle(ColorConstants.colorForLabel(habit.colorLabel))
                
                Button(action: incrementCount) {
                    Image(systemName: "plus")
                        .font(.system(size: 10, weight: .bold))
                        .frame(width: 20, height: 20)
                        .background(Color.green.opacity(0.3))
                        .cornerRadius(4)
                        .foregroundStyle(.green)
                }
            }
            
            // Square Checkbox
            SquareCheckboxSmallView(
                percentage: todayCompletion,
                isComplete: todayCompletion >= 100,
                animateCheckbox: $animateCheckbox
            )
        }
        .frame(width: 80)
        .padding(8)
        .background(Color(.systemBackground))
        .cornerRadius(8)
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

// MARK: - Small Square Checkbox for Strip

struct SquareCheckboxSmallView: View {
    let percentage: Double
    let isComplete: Bool
    @Binding var animateCheckbox: Bool
    
    var body: some View {
        ZStack {
            // Background
            RoundedRectangle(cornerRadius: 4)
                .fill(Color(.systemGray5))
                .frame(width: 40, height: 40)
            
            // Progress fill
            if percentage > 0 {
                RoundedRectangle(cornerRadius: 4)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [.blue, .blue.opacity(0.6)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 40, height: 40)
                    .scaleEffect(y: percentage / 100, anchor: .bottom)
                    .animation(.spring(response: 0.6, dampingFraction: 0.7), value: percentage)
            }
            
            // Checkmark or percentage
            if isComplete {
                Image(systemName: "checkmark")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .scaleEffect(animateCheckbox ? 1.15 : 1.0)
                    .animation(.spring(response: 0.4, dampingFraction: 0.6), value: animateCheckbox)
            } else if percentage > 0 {
                Text("\(Int(percentage))%")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(.gray)
            }
        }
        .frame(width: 40, height: 40)
    }
}

#Preview {
    AllDayHabitStripView()
        .modelContainer(for: Habit.self, inMemory: true)
}
