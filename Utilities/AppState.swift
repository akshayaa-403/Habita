import Foundation
import UIKit

/// AppState manages app-level state including onboarding and user preferences
/// Uses @Observable for SwiftUI integration without @State wrapper
@Observable
final class AppState {
    static let shared = AppState()
    
    // MARK: - Onboarding State
    
    /// Whether user has completed onboarding (persisted to UserDefaults)
    @ObservationIgnored
    var hasCompletedOnboarding: Bool {
        get {
            UserDefaults.standard.bool(forKey: "hasCompletedOnboarding")
        }
        set {
            UserDefaults.standard.set(newValue, forKey: "hasCompletedOnboarding")
        }
    }
    
    /// Current onboarding page (0-4)
    @ObservationIgnored
    var currentOnboardingPage: Int = 0
    
    /// Whether to show onboarding on next launch
    @ObservationIgnored
    var showOnboarding: Bool {
        !hasCompletedOnboarding
    }
    
    // MARK: - User Preferences
    
    /// Whether notifications are enabled
    @ObservationIgnored
    var notificationsEnabled: Bool {
        get {
            UserDefaults.standard.bool(forKey: "notificationsEnabled")
        }
        set {
            UserDefaults.standard.set(newValue, forKey: "notificationsEnabled")
        }
    }
    
    /// Whether dark mode is forced on/off or system default
    @ObservationIgnored
    var darkModeSetting: DarkModeSetting {
        get {
            let rawValue = UserDefaults.standard.string(forKey: "darkModeSetting") ?? "system"
            return DarkModeSetting(rawValue: rawValue) ?? .system
        }
        set {
            UserDefaults.standard.set(newValue.rawValue, forKey: "darkModeSetting")
        }
    }
    
    /// Whether to show energy recovery hints on calendar
    @ObservationIgnored
    var showEnergyRecoveryHints: Bool {
        get {
            UserDefaults.standard.bool(forKey: "showEnergyRecoveryHints") || UserDefaults.standard.object(forKey: "showEnergyRecoveryHints") == nil // Default true
        }
        set {
            UserDefaults.standard.set(newValue, forKey: "showEnergyRecoveryHints")
        }
    }
    
    /// Whether accessibility features are enabled
    @ObservationIgnored
    var accessibilityEnabled: Bool {
        get {
            UIAccessibility.isVoiceOverRunning
        }
    }
    
    // MARK: - Methods
    
    /// Marks onboarding as completed and persists to UserDefaults
    func completeOnboarding() {
        hasCompletedOnboarding = true
        currentOnboardingPage = 0
    }
    
    /// Resets onboarding state (for testing or user request)
    func resetOnboarding() {
        UserDefaults.standard.removeObject(forKey: "hasCompletedOnboarding")
        currentOnboardingPage = 0
    }
    
    /// Clears all user data (for data reset in settings)
    func resetAllData() {
        UserDefaults.standard.removeObject(forKey: "hasCompletedOnboarding")
        UserDefaults.standard.removeObject(forKey: "notificationsEnabled")
        UserDefaults.standard.removeObject(forKey: "darkModeSetting")
        UserDefaults.standard.removeObject(forKey: "showEnergyRecoveryHints")
    }
}

// MARK: - Dark Mode Setting

enum DarkModeSetting: String, CaseIterable {
    case light = "light"
    case dark = "dark"
    case system = "system"
    
    var description: String {
        switch self {
        case .light:
            return "Light"
        case .dark:
            return "Dark"
        case .system:
            return "System Default"
        }
    }
    
    var userInterfaceStyle: UIUserInterfaceStyle {
        switch self {
        case .light:
            return .light
        case .dark:
            return .dark
        case .system:
            return .unspecified
        }
    }
}
