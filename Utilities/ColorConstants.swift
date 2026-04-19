import SwiftUI

struct ColorConstants {
    static func colorForLabel(_ label: String) -> Color {
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
    
    static let colorLabels = ["Blue", "Red", "Green", "Orange", "Purple", "Pink", "Yellow"]
}
