import SwiftUI

/// OnboardingView provides a comprehensive tutorial for first-time users
/// Features 5 onboarding pages covering the core Habita workflow
struct OnboardingView: View {
    @Environment(\.dismiss) var dismiss
    @State var appState = AppState.shared
    @State private var currentPage = 0
    
    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.95, green: 0.95, blue: 0.97),
                    Color(red: 0.98, green: 0.96, blue: 0.99)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Page Indicator
                HStack(spacing: 8) {
                    ForEach(0..<5, id: \.self) { index in
                        Capsule()
                            .fill(index == currentPage ? Color.blue : Color.gray.opacity(0.3))
                            .frame(height: 4)
                            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: currentPage)
                    }
                }
                .padding(.horizontal, 40)
                .padding(.top, 20)
                .padding(.bottom, 30)
                
                // Page Content
                TabView(selection: $currentPage) {
                    // Page 1: Welcome
                    OnboardingPageView(
                        icon: "🎯",
                        title: "Welcome to Habita",
                        description: "Your frictionless productivity companion combining task prioritization with habit formation.",
                        details: ["✓ Capture tasks instantly",
                                 "✓ Prioritize with the Ike Matrix",
                                 "✓ Build lasting habits",
                                 "✓ Track your progress"]
                    )
                    .tag(0)
                    
                    // Page 2: Tasks & Matrix
                    OnboardingPageView(
                        icon: "📋",
                        title: "Capture & Prioritize",
                        description: "Add tasks to your Inbox, then position them on the Ike Matrix based on time & energy.",
                        details: ["1. Tap '+' in Inbox to add a task",
                                 "2. Set duration and let AI suggest complexity",
                                 "3. Drag to the 2×2 Matrix to prioritize",
                                 "4. Tasks auto-block on your calendar"]
                    )
                    .tag(1)
                    
                    // Page 3: Habits
                    OnboardingPageView(
                        icon: "⭐",
                        title: "Build Daily Habits",
                        description: "Create habits and log daily occurrences to track progress toward your goals.",
                        details: ["1. Add a habit with daily target",
                                 "2. Log occurrences with +/- buttons",
                                 "3. Watch the checkbox fill as you progress",
                                 "4. Celebrate at 100% completion"]
                    )
                    .tag(2)
                    
                    // Page 4: Analytics
                    OnboardingPageView(
                        icon: "📊",
                        title: "Track Your Progress",
                        description: "Visualize your habit completion trends with table, graph, and pie chart views.",
                        details: ["• Table: Daily completion by habit",
                                 "• Graph: Trend line over time",
                                 "• Pie: Distribution of effort",
                                 "• Compare 7, 14, or 30 day ranges"]
                    )
                    .tag(3)
                    
                    // Page 5: AI & Wins
                    OnboardingPageView(
                        icon: "🏆",
                        title: "Get Rewarded",
                        description: "AI auto-rates tasks, and your wins counter tracks every achievement.",
                        details: ["✓ Auto-Rate button → instant positioning",
                                 "✓ Wins counter → motivation dashboard",
                                 "✓ Confetti celebration → momentum boost",
                                 "✓ Dark mode & accessibility support"]
                    )
                    .tag(4)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .frame(maxHeight: .infinity)
                
                // Navigation Buttons
                HStack(spacing: 16) {
                    // Skip Button
                    Button(action: {
                        appState.completeOnboarding()
                        dismiss()
                    }) {
                        Text("Skip")
                            .font(.body)
                            .foregroundColor(.gray)
                            .frame(maxWidth: .infinity)
                            .padding(12)
                            .background(Color.white)
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                    }
                    
                    // Next / Done Button
                    Button(action: {
                        if currentPage < 4 {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                currentPage += 1
                            }
                        } else {
                            appState.completeOnboarding()
                            dismiss()
                        }
                    }) {
                        HStack(spacing: 8) {
                            Text(currentPage == 4 ? "Get Started" : "Next")
                                .font(.body)
                                .fontWeight(.semibold)
                            
                            if currentPage < 4 {
                                Image(systemName: "arrow.right")
                            } else {
                                Image(systemName: "checkmark")
                            }
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(12)
                        .background(Color.blue)
                        .cornerRadius(8)
                    }
                }
                .padding(20)
            }
        }
    }
}

// MARK: - Onboarding Page Component

struct OnboardingPageView: View {
    let icon: String
    let title: String
    let description: String
    let details: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(spacing: 16) {
                // Icon
                Text(icon)
                    .font(.system(size: 60))
                    .frame(maxWidth: .infinity)
                
                // Title
                Text(title)
                    .font(.system(size: 28, weight: .bold, design: .default))
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                
                // Description
                Text(description)
                    .font(.body)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, 24)
            .padding(.top, 40)
            
            // Details
            VStack(alignment: .leading, spacing: 12) {
                ForEach(details, id: \.self) { detail in
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "circle.fill")
                            .font(.system(size: 6))
                            .foregroundColor(.blue)
                            .padding(.top, 6)
                        
                        Text(detail)
                            .font(.body)
                            .foregroundColor(.black.opacity(0.7))
                        
                        Spacer()
                    }
                }
            }
            .padding(.horizontal, 24)
            .padding(16)
            .background(Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.gray.opacity(0.1), lineWidth: 1)
            )
            .padding(.horizontal, 16)
            
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

#Preview {
    OnboardingView()
}
