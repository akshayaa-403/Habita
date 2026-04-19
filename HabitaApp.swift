import SwiftUI
import SwiftData

@main
struct HabitaApp: App {
    let modelContainer: ModelContainer
    @State var appState = AppState.shared
    @State var cloudKitService = CloudKitService.shared
    
    init() {
        do {
            // Initialize ModelContainer with CloudKit support
            modelContainer = try ModelContainer(
                for: HabitaTask.self, Habit.self, HabitLog.self, WinsTracker.self,
                configurations: ModelConfiguration(isStoredInMemoryOnly: false)
            )
            
            // Initialize WinsTracker if it doesn't exist
            let context = modelContainer.mainContext
            let fetchRequest = FetchDescriptor<WinsTracker>()
            if try context.fetch(fetchRequest).isEmpty {
                let tracker = WinsTracker()
                context.insert(tracker)
            }
        } catch {
            fatalError("Could not initialize ModelContainer: \(error)")
        }
    }
    
    var body: some Scene {
        WindowGroup {
            Group {
                if appState.showOnboarding {
                    // Show onboarding for first-time users
                    OnboardingView()
                        .environment(appState)
                } else {
                    // Main app interface
                    MainAppView()
                }
            }
            .modelContainer(modelContainer)
            .environment(appState)
            .environment(cloudKitService)
            .preferredColorScheme(appState.darkModeSetting.userInterfaceStyle == .unspecified ? nil : appState.darkModeSetting.userInterfaceStyle == .dark)
        }
    }
}

// MARK: - Main App View (Tab Navigation)

struct MainAppView: View {
    var body: some View {
        TabView {
            InboxView()
                .tabItem {
                    Label("Inbox", systemImage: "inbox.fill")
                }
            
            IkeMatrixView()
                .tabItem {
                    Label("Matrix", systemImage: "square.grid.2x2")
                }
            
            CalendarView()
                .tabItem {
                    Label("Calendar", systemImage: "calendar")
                }
            
            HabitsView()
                .tabItem {
                    Label("Habits", systemImage: "star.fill")
                }
            
            AnalyticsView()
                .tabItem {
                    Label("Progress", systemImage: "chart.bar")
                }
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
        }
    }
}

#Preview {
    HabitaApp()
}
