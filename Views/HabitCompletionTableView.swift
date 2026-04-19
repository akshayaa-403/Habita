import SwiftUI

struct HabitCompletionTableView: View {
    let habits: [Habit]
    let dayCount: Int
    
    var dateRange: [Date] {
        var dates: [Date] = []
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        for i in (0..<dayCount).reversed() {
            if let date = calendar.date(byAdding: .day, value: -i, to: today) {
                dates.append(date)
            }
        }
        return dates
    }
    
    var body: some View {
        ScrollView(.horizontal) {
            VStack(alignment: .leading, spacing: 0) {
                // Header Row
                HStack(spacing: 0) {
                    Text("Habit")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(width: 90, alignment: .leading)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 8)
                    
                    Divider()
                    
                    ForEach(dateRange, id: \.self) { date in
                        Text(date.formatted(date: .abbreviated, time: .omitted).split(separator: " ")[0])
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .frame(width: 45, alignment: .center)
                            .padding(.vertical, 8)
                        
                        Divider()
                    }
                    
                    Text("Avg")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(width: 45, alignment: .center)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 8)
                }
                .background(Color(.systemGray6))
                
                Divider()
                
                // Data Rows
                ForEach(habits, id: \.id) { habit in
                    HStack(spacing: 0) {
                        // Habit Name + Icon
                        HStack(spacing: 6) {
                            Image(systemName: habit.icon)
                                .font(.system(size: 12))
                                .foregroundStyle(ColorConstants.colorForLabel(habit.colorLabel))
                            
                            Text(habit.name)
                                .font(.caption)
                                .lineLimit(1)
                        }
                        .frame(width: 90, alignment: .leading)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 8)
                        
                        Divider()
                        
                        // Completion Cells
                        ForEach(dateRange, id: \.self) { date in
                            let percentage = habit.completionPercentageForDate(date)
                            
                            VStack(spacing: 2) {
                                Text("\(Int(percentage))%")
                                    .font(.caption2)
                                    .fontWeight(.semibold)
                                    .foregroundStyle(.white)
                                
                                // Color intensity based on percentage
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(
                                        ColorConstants.colorForLabel(habit.colorLabel)
                                            .opacity(max(0.2, min(1.0, percentage / 100)))
                                    )
                                    .frame(height: 4)
                            }
                            .frame(width: 45)
                            .padding(.vertical, 8)
                            
                            Divider()
                        }
                        
                        // Average Column
                        let avgPercentage = dateRange.map { habit.completionPercentageForDate($0) }.reduce(0, +) / Double(dateRange.count)
                        
                        VStack(spacing: 2) {
                            Text("\(Int(avgPercentage))%")
                                .font(.caption2)
                                .fontWeight(.semibold)
                                .foregroundStyle(.white)
                            
                            RoundedRectangle(cornerRadius: 2)
                                .fill(
                                    ColorConstants.colorForLabel(habit.colorLabel)
                                        .opacity(max(0.2, min(1.0, avgPercentage / 100)))
                                )
                                .frame(height: 4)
                        }
                        .frame(width: 45)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 8)
                    }
                    .background(Color(.systemBackground))
                    
                    Divider()
                }
            }
        }
    }
}

#Preview {
    HabitCompletionTableView(habits: [], dayCount: 7)
}
