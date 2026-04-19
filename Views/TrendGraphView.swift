import SwiftUI

struct TrendGraphView: View {
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
    
    var dailyAverages: [Double] {
        dateRange.map { date in
            let percentages = habits.map { $0.completionPercentageForDate(date) }
            return percentages.isEmpty ? 0 : percentages.reduce(0, +) / Double(percentages.count)
        }
    }
    
    var maxValue: Double {
        max(100, dailyAverages.max() ?? 100)
    }
    
    var body: some View {
        VStack(spacing: 16) {
            VStack(spacing: 8) {
                Text("Daily Average Completion")
                    .font(.headline)
                
                Text("Overall daily habit completion % across all habits")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            
            // Graph
            VStack(spacing: 0) {
                // Y-Axis Labels
                HStack(alignment: .center, spacing: 8) {
                    VStack(alignment: .trailing, spacing: 0) {
                        ForEach([100, 75, 50, 25, 0], id: \.self) { value in
                            Text("\(value)%")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .frame(height: 20)
                        }
                    }
                    .frame(width: 35)
                    
                    // Chart Area
                    VStack(spacing: 0) {
                        // Grid lines
                        ForEach([100, 75, 50, 25, 0], id: \.self) { _ in
                            Divider()
                                .frame(height: 0.5)
                                .opacity(0.3)
                        }
                    }
                    .frame(height: 100)
                    .overlay(alignment: .bottom) {
                        // Line Chart
                        Canvas { context in
                            let width = CGFloat(dailyAverages.count > 1 ? dailyAverages.count - 1 : 1)
                            let height: CGFloat = 100
                            
                            var path = Path()
                            var firstPoint = true
                            
                            for (index, value) in dailyAverages.enumerated() {
                                let x = CGFloat(index) / width * (context.size.width)
                                let y = height - (value / 100) * height
                                
                                if firstPoint {
                                    path.move(to: CGPoint(x: x, y: y))
                                    firstPoint = false
                                } else {
                                    path.addLine(to: CGPoint(x: x, y: y))
                                }
                            }
                            
                            // Draw line
                            var stroke = StrokeStyle(lineWidth: 2)
                            stroke.lineCap = .round
                            stroke.lineJoin = .round
                            
                            context.stroke(
                                path,
                                with: .color(.blue),
                                style: stroke
                            )
                            
                            // Draw data points
                            for (index, value) in dailyAverages.enumerated() {
                                let x = CGFloat(index) / width * (context.size.width)
                                let y = height - (value / 100) * height
                                
                                let circle = Path(
                                    ellipseIn: CGRect(
                                        x: x - 3,
                                        y: y - 3,
                                        width: 6,
                                        height: 6
                                    )
                                )
                                context.fill(circle, with: .color(.white))
                                context.stroke(circle, with: .color(.blue), lineWidth: 1)
                            }
                        }
                        .frame(maxWidth: .infinity, maxHeight: 100)
                    }
                }
                
                // X-Axis Labels
                HStack(alignment: .top, spacing: 0) {
                    Text("")
                        .frame(width: 35)
                    
                    HStack(spacing: 0) {
                        ForEach(dateRange.indices, id: \.self) { index in
                            let date = dateRange[index]
                            Text(date.formatted(date: .abbreviated, time: .omitted).split(separator: " ").first.map(String.init) ?? "")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, alignment: .center)
                        }
                    }
                }
                .padding(.top, 8)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(8)
            .padding()
            
            // Stats
            VStack(spacing: 8) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Average")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("\(Int(dailyAverages.reduce(0, +) / Double(dailyAverages.count)))%")
                            .font(.headline)
                            .foregroundStyle(.blue)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("Peak Day")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("\(Int(dailyAverages.max() ?? 0))%")
                            .font(.headline)
                            .foregroundStyle(.green)
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }
            .padding()
            
            Spacer()
        }
    }
}

#Preview {
    TrendGraphView(habits: [], dayCount: 7)
}
