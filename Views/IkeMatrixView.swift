import SwiftUI
import SwiftData

struct IkeMatrixView: View {
    @Query(filter: #Predicate<HabitaTask> { !$0.isInInbox && $0.quadrant != nil }, sort: \.createdAt) var matrixTasks: [HabitaTask]
    @Query(filter: #Predicate<HabitaTask> { $0.isInInbox }, sort: \.createdAt, order: .reverse) var inboxTasks: [HabitaTask]
    @Environment(\.modelContext) var modelContext
    @State private var showAddTask = false
    @State private var selectedTask: HabitaTask?
    @State private var showAIRating = false
    @State private var draggedTaskID: UUID?
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Title & Legend
                VStack(spacing: 8) {
                    Text("Priority Matrix")
                        .font(.headline)
                    
                    Text("Drag tasks from inbox onto the matrix")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding()
                
                Divider()
                
                // Main Content: Split View
                HStack(spacing: 0) {
                    // Inbox Column
                    VStack(spacing: 0) {
                        Text("Inbox")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundStyle(.secondary)
                            .padding(.vertical, 8)
                        
                        Divider()
                        
                        if inboxTasks.isEmpty {
                            VStack(spacing: 8) {
                                Image(systemName: "inbox.fill")
                                    .font(.system(size: 24))
                                    .foregroundStyle(.gray.opacity(0.5))
                                Text("Inbox empty")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .frame(maxHeight: .infinity)
                            .frame(maxWidth: .infinity)
                        } else {
                            ScrollView {
                                VStack(spacing: 8) {
                                    ForEach(inboxTasks, id: \.id) { task in
                                        InboxDragTaskView(
                                            task: task,
                                            selectedTask: $selectedTask,
                                            draggedTaskID: $draggedTaskID,
                                            onDragEnded: {
                                                draggedTaskID = nil
                                            }
                                        )
                                    }
                                }
                                .padding(8)
                            }
                        }
                    }
                    .frame(maxWidth: 120)
                    .background(Color(.systemGray6))
                    
                    Divider()
                    
                    // 2x2 Matrix
                    VStack(spacing: 1) {
                        HStack(spacing: 1) {
                            MatrixQuadrantView(
                                title: "High Energy\nShort Time",
                                quadrant: "highEnergyShortTime",
                                tasks: matrixTasks.filter { $0.quadrant == "highEnergyShortTime" },
                                draggedTaskID: $draggedTaskID,
                                modelContext: modelContext
                            )
                            .background(Color.blue.opacity(0.08))
                            
                            MatrixQuadrantView(
                                title: "High Energy\nLong Time",
                                quadrant: "highEnergyLongTime",
                                tasks: matrixTasks.filter { $0.quadrant == "highEnergyLongTime" },
                                draggedTaskID: $draggedTaskID,
                                modelContext: modelContext
                            )
                            .background(Color.purple.opacity(0.08))
                        }
                        
                        HStack(spacing: 1) {
                            MatrixQuadrantView(
                                title: "Low Energy\nShort Time",
                                quadrant: "lowEnergyShortTime",
                                tasks: matrixTasks.filter { $0.quadrant == "lowEnergyShortTime" },
                                draggedTaskID: $draggedTaskID,
                                modelContext: modelContext
                            )
                            .background(Color.green.opacity(0.08))
                            
                            MatrixQuadrantView(
                                title: "Low Energy\nLong Time",
                                quadrant: "lowEnergyLongTime",
                                tasks: matrixTasks.filter { $0.quadrant == "lowEnergyLongTime" },
                                draggedTaskID: $draggedTaskID,
                                modelContext: modelContext
                            )
                            .background(Color.orange.opacity(0.08))
                        }
                    }
                }
                
                Divider()
                
                // Axes Labels
                HStack(spacing: 0) {
                    VStack(spacing: 4) {
                        Text("Energy")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Image(systemName: "arrow.up")
                            .font(.system(size: 10))
                            .foregroundStyle(.secondary)
                    }
                    .frame(width: 30)
                    
                    Spacer()
                    
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.left")
                            .font(.system(size: 10))
                            .foregroundStyle(.secondary)
                        Text("Time")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                        Image(systemName: "arrow.right")
                            .font(.system(size: 10))
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 12)
            }
            .navigationTitle("Matrix")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button(action: { showAddTask = true }) {
                            Label("New Task", systemImage: "plus")
                        }
                        
                        if let selected = selectedTask {
                            Divider()
                            Button(action: autoRateSelectedTask) {
                                Label("Auto Rate", systemImage: "wand.and.stars")
                            }
                            Button(action: { showAIRating = true }) {
                                Label("Manual Rate", systemImage: "sliders.horizontal")
                            }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $showAddTask) {
                AddTaskView()
            }
            .sheet(isPresented: $showAIRating) {
                if let task = selectedTask {
                    AIRatingView(task: task, showAIRating: $showAIRating)
                }
            }
        }
    }
    
    private func autoRateSelectedTask() {
        guard let task = selectedTask else { return }
        
        let ratings = AIRatingService.suggestRatings(for: task.title)
        task.complexity = ratings.complexity
        task.urgency = ratings.urgency
        task.energyLevel = AIRatingService.mapUrgencyToEnergyLevel(ratings.urgency)
        task.quadrant = AIRatingService.quadrantForTask(timeRequired: task.timeRequired, energyLevel: task.energyLevel ?? 3)
        
        try? modelContext.save()
    }
}

// MARK: - Inbox Drag Task View

struct InboxDragTaskView: View {
    let task: HabitaTask
    @Binding var selectedTask: HabitaTask?
    @Binding var draggedTaskID: UUID?
    let onDragEnded: () -> Void
    
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
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Image(systemName: task.icon)
                    .font(.system(size: 12))
                    .foregroundStyle(colorForLabel(task.colorLabel))
                
                Text(task.title)
                    .font(.caption)
                    .lineLimit(1)
            }
            
            Text("\(Int(task.timeRequired / 60))m")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding(6)
        .background(colorForLabel(task.colorLabel).opacity(0.15))
        .cornerRadius(4)
        .draggable(task.id.uuidString) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Image(systemName: task.icon)
                        .font(.system(size: 12))
                        .foregroundStyle(colorForLabel(task.colorLabel))
                    
                    Text(task.title)
                        .font(.caption)
                        .lineLimit(1)
                }
                
                Text("\(Int(task.timeRequired / 60))m")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .padding(6)
            .background(colorForLabel(task.colorLabel).opacity(0.3))
            .cornerRadius(4)
        }
        .onTapGesture {
            selectedTask = task
        }
    }
}

// MARK: - Matrix Quadrant View

struct MatrixQuadrantView: View {
    let title: String
    let quadrant: String
    let tasks: [HabitaTask]
    @Binding var draggedTaskID: UUID?
    let modelContext: ModelContext
    
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
        VStack(alignment: .leading, spacing: 8) {
            // Quadrant Title
            Text(title)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(.secondary)
            
            // Drop Zone
            VStack(spacing: 8) {
                if tasks.isEmpty {
                    VStack(spacing: 4) {
                        Image(systemName: "plus.circle")
                            .font(.system(size: 20))
                            .foregroundStyle(.gray.opacity(0.3))
                        Text("Drop here")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        VStack(spacing: 6) {
                            ForEach(tasks, id: \.id) { task in
                                MatrixTaskCardView(task: task)
                            }
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .onDrop(of: ["public.utf8-plain-text"], isTargeted: nil) { providers in
                handleDrop(providers: providers)
                return true
            }
            .padding(8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private func handleDrop(providers: [NSItemProvider]) -> Bool {
        guard let provider = providers.first else { return false }
        
        provider.loadItem(forTypeIdentifier: "public.utf8-plain-text") { data, error in
            if let data = data as? Data,
               let uuidString = String(data: data, encoding: .utf8),
               let uuid = UUID(uuidString: uuidString) {
                
                // Find all tasks in the model container and update the matching one
                let fetchRequest = FetchDescriptor<HabitaTask>()
                if let fetchedTasks = try? modelContext.fetch(fetchRequest) {
                    for task in fetchedTasks {
                        if task.id == uuid {
                            task.quadrant = quadrant
                            task.isInInbox = false
                            task.scheduledDate = Date()
                            
                            do {
                                try modelContext.save()
                                print("Task moved to quadrant: \(quadrant)")
                            } catch {
                                print("Error saving task: \(error)")
                            }
                            break
                        }
                    }
                }
            }
        }
        return true
    }
}

// MARK: - Matrix Task Card

struct MatrixTaskCardView: View {
    let task: HabitaTask
    
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
        HStack(spacing: 6) {
            Image(systemName: task.icon)
                .font(.system(size: 14))
                .foregroundStyle(colorForLabel(task.colorLabel))
            
            VStack(alignment: .leading, spacing: 1) {
                Text(task.title)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .lineLimit(1)
                
                Text("\(Int(task.timeRequired / 60))m")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            if let energy = task.energyLevel {
                Text("\(energy)/5")
                    .font(.caption2)
                    .foregroundStyle(.orange)
            }
        }
        .padding(6)
        .background(colorForLabel(task.colorLabel).opacity(0.2))
        .cornerRadius(4)
    }
}

// MARK: - AI Rating View

struct AIRatingView: View {
    @State var task: HabitaTask
    @Binding var showAIRating: Bool
    @Environment(\.modelContext) var modelContext
    @State private var complexity: Int = 3
    @State private var urgency: Int = 3
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Task") {
                    HStack {
                        Image(systemName: task.icon)
                            .font(.system(size: 20))
                        Text(task.title)
                            .font(.headline)
                        Spacer()
                    }
                }
                
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Complexity")
                                Spacer()
                                Text("\(complexity)/5")
                                    .fontWeight(.semibold)
                                    .foregroundStyle(.blue)
                            }
                            Slider(value: .init(get: { Double(complexity) }, set: { complexity = Int($0) }), in: 1...5, step: 1)
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Urgency")
                                Spacer()
                                Text("\(urgency)/5")
                                    .fontWeight(.semibold)
                                    .foregroundStyle(.orange)
                            }
                            Slider(value: .init(get: { Double(urgency) }, set: { urgency = Int($0) }), in: 1...5, step: 1)
                        }
                    }
                } header: {
                    Text("AI Ratings")
                }
            }
            .navigationTitle("Rate Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        showAIRating = false
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        task.complexity = complexity
                        task.urgency = urgency
                        task.energyLevel = urgency // Map urgency to energy for now
                        showAIRating = false
                    }
                }
            }
            .onAppear {
                if let c = task.complexity {
                    complexity = c
                }
                if let u = task.urgency {
                    urgency = u
                }
            }
        }
    }
}

#Preview {
    IkeMatrixView()
        .modelContainer(for: HabitaTask.self, inMemory: true)
}
