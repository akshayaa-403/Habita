import SwiftUI

struct HabitDistributionPieView: View {
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
    
    var habitCounts: [(habit: Habit, count: Int)] {
        habits.map { habit in
            let totalCount = dateRange.reduce(0) { sum, date in
                let log = habit.logs.first { log in
                    let calendar = Calendar.current
                    return calendar.isDate(log.date, inSameDayAs: date)
                }
                return sum + (log?.count ?? 0)
            }
            return (habit: habit, count: totalCount)
        }
        .filter { $0.count > 0 }
        .sorted { $0.count > $1.count }
    }
    
    var totalCount: Int {
        habitCounts.reduce(0) { $0 + $1.count }
    }
    
    var body: some View {
        VStack(spacing: 16) {
            VStack(spacing: 8) {
                Text("Habit Distribution")
                    .font(.headline)
                
                Text("Total logged occurrences over \(dayCount) days")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            
            if habitCounts.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "chart.pie")
                        .font(.system(size: 40))
                        .foregroundStyle(.gray)
                    Text("No logged data")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    VStack(spacing: 20) {
                        // Pie Chart
                        Canvas { context in
                            let center = CGPoint(x: context.size.width / 2, y: 120)
                            let radius: CGFloat = 80
                            
                            var startAngle: Double = -90 * .pi / 180
                            
                            for (index, item) in habitCounts.enumerated() {
                                let percentage = Double(item.count) / Double(totalCount)
                                let sliceAngle = percentage * 2 * .pi
                                let endAngle = startAngle + sliceAngle
                                
                                // Draw slice
                                var path = Path()
                                path.move(to: center)
                                path.addArc(
                                    center: center,
                                    radius: radius,
                                    startAngle: .radians(startAngle),
                                    endAngle: .radians(endAngle),
                                    clockwise: false
                                )
                                path.closeSubpath()
                                
                                let color = ColorConstants.colorForLabel(item.habit.colorLabel)
                                context.fill(path, with: .color(color))
                                
                                // Draw border
                                context.stroke(path, with: .color(.white), lineWidth: 1)
                                
                                startAngle = endAngle
                            }
                        }
                        .frame(height: 240)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                        .padding()
                        
                        // Legend
                        VStack(spacing: 8) {
                            Text("Legend")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal)
                            
                            ForEach(habitCounts.indices, id: \.self) { index in
                                let item = habitCounts[index]
                                let percentage = Double(item.count) / Double(totalCount) * 100
                                
                                HStack(spacing: 12) {
                                    // Color dot
                                    Circle()
                                        .fill(ColorConstants.colorForLabel(item.habit.colorLabel))
                                        .frame(width: 12, height: 12)
                                    
                                    // Habit name
                                    VStack(alignment: .leading, spacing: 2) {
                                        HStack {
                                            Image(systemName: item.habit.icon)
                                                .font(.system(size: 12))
                                            Text(item.habit.name)
                                                .font(.caption)
                                                .fontWeight(.semibold)
                                        }
                                        
                                        Text("\(item.count) logs")
                                            .font(.caption2)
                                            .foregroundStyle(.secondary)
                                    }
                                    
                                    Spacer()
                                    
                                    // Percentage
                                    VStack(alignment: .trailing, spacing: 2) {
                                        Text("\(Int(percentage))%")
                                            .font(.caption)
                                            .fontWeight(.semibold)
                                            .foregroundStyle(ColorConstants.colorForLabel(item.habit.colorLabel))
                                    }
                                }
                                .padding(8)
                                .background(Color(.systemGray6))
                                .cornerRadius(6)
                            }
                        }
                        .padding()
                    }
                }
            }
        }
    }
}

#Preview {
    HabitDistributionPieView(habits: [], dayCount: 7)
}
