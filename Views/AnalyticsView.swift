import SwiftUI
import SwiftData

struct AnalyticsView: View {
    @Query(sort: \.createdAt) var habits: [Habit]
    @State private var selectedView: AnalyticsTab = .table
    @State private var dateRange: DateRange = .past7Days
    
    enum AnalyticsTab {
        case table
        case graph
        case pie
    }
    
    var dateRangeValue: Int {
        switch dateRange {
        case .past7Days: return 7
        case .past14Days: return 14
        case .past30Days: return 30
        }
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Date Range Picker
                Picker("Date Range", selection: $dateRange) {
                    Text("Last 7 Days").tag(DateRange.past7Days)
                    Text("Last 14 Days").tag(DateRange.past14Days)
                    Text("Last 30 Days").tag(DateRange.past30Days)
                }
                .pickerStyle(.segmented)
                .padding()
                
                Divider()
                
                // Tab Selector
                HStack(spacing: 0) {
                    Button(action: { selectedView = .table }) {
                        Label("Table", systemImage: "table")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .foregroundStyle(selectedView == .table ? .blue : .gray)
                            .borderBottom(width: selectedView == .table ? 2 : 0, color: .blue)
                    }
                    
                    Button(action: { selectedView = .graph }) {
                        Label("Trend", systemImage: "chart.line")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .foregroundStyle(selectedView == .graph ? .blue : .gray)
                            .borderBottom(width: selectedView == .graph ? 2 : 0, color: .blue)
                    }
                    
                    Button(action: { selectedView = .pie }) {
                        Label("Pie", systemImage: "chart.pie")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .foregroundStyle(selectedView == .pie ? .blue : .gray)
                            .borderBottom(width: selectedView == .pie ? 2 : 0, color: .blue)
                    }
                }
                .font(.caption)
                
                Divider()
                
                // Content
                if habits.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "chart.bar")
                            .font(.system(size: 48))
                            .foregroundStyle(.gray)
                        Text("No Data Yet")
                            .font(.headline)
                            .foregroundStyle(.gray)
                        Text("Create habits to see analytics")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    switch selectedView {
                    case .table:
                        HabitCompletionTableView(habits: habits, dayCount: dateRangeValue)
                    case .graph:
                        TrendGraphView(habits: habits, dayCount: dateRangeValue)
                    case .pie:
                        HabitDistributionPieView(habits: habits, dayCount: dateRangeValue)
                    }
                }
            }
            .navigationTitle("Progress")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

enum DateRange {
    case past7Days
    case past14Days
    case past30Days
}

// MARK: - Border Modifier

extension View {
    func borderBottom(width: CGFloat, color: Color) -> some View {
        VStack {
            self
            if width > 0 {
                color.frame(height: width)
            }
        }
    }
}

#Preview {
    AnalyticsView()
        .modelContainer(for: Habit.self, inMemory: true)
}
