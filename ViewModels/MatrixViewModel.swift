import SwiftUI
import SwiftData

@Observable
class MatrixViewModel {
    var modelContext: ModelContext?
    var inboxTasks: [HabitaTask] = []
    var matrixTasks: [HabitaTask] = []
    var selectedTask: HabitaTask?
    
    func updateTaskQuadrant(_ task: HabitaTask, to quadrant: String) {
        task.quadrant = quadrant
        task.isInInbox = false
        task.scheduledDate = Date()
        
        do {
            try modelContext?.save()
        } catch {
            print("Error saving task: \(error)")
        }
    }
    
    func deleteTask(_ task: HabitaTask) {
        modelContext?.delete(task)
        do {
            try modelContext?.save()
        } catch {
            print("Error deleting task: \(error)")
        }
    }
    
    func moveTaskToInbox(_ task: HabitaTask) {
        task.isInInbox = true
        task.quadrant = nil
        
        do {
            try modelContext?.save()
        } catch {
            print("Error moving task to inbox: \(error)")
        }
    }
}
