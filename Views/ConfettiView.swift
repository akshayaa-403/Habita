import SwiftUI

struct ConfettiView: View {
    @State private var isAnimating = false
    @State private var confetti: [ConfettiPiece] = []
    
    let isVisible: Bool
    
    var body: some View {
        ZStack {
            ForEach(confetti, id: \.id) { piece in
                Text(piece.emoji)
                    .font(.system(size: piece.size))
                    .offset(x: piece.x, y: piece.y)
                    .opacity(piece.opacity)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .allowsHitTesting(false)
        .onChange(of: isVisible) { oldValue, newValue in
            if newValue {
                triggerConfetti()
            }
        }
    }
    
    private func triggerConfetti() {
        confetti = (0..<30).map { _ in
            ConfettiPiece(
                emoji: ["🎉", "✨", "🌟", "⭐", "🎊"].randomElement() ?? "🎉",
                x: CGFloat.random(in: -50...50),
                y: CGFloat.random(in: -50...0),
                size: CGFloat.random(in: 16...32),
                opacity: 1.0,
                duration: Double.random(in: 0.6...1.2)
            )
        }
        
        withAnimation(.easeOut(duration: 1.0)) {
            for i in 0..<confetti.count {
                confetti[i].y = CGFloat.random(in: 400...600)
                confetti[i].opacity = 0.0
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            confetti = []
        }
    }
}

struct ConfettiPiece: Identifiable {
    let id = UUID()
    let emoji: String
    var x: CGFloat
    var y: CGFloat
    let size: CGFloat
    var opacity: CGFloat
    let duration: Double
}

// MARK: - Confetti Container

struct ConfettiContainer<Content: View>: View {
    @State private var showConfetti = false
    let content: Content
    let onConfetti: () -> Void
    
    init(@ViewBuilder content: () -> Content, onConfetti: @escaping () -> Void) {
        self.content = content()
        self.onConfetti = onConfetti
    }
    
    var body: some View {
        ZStack {
            content
            
            ConfettiView(isVisible: showConfetti)
        }
    }
    
    func triggerConfetti() {
        showConfetti = false
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            showConfetti = true
            onConfetti()
        }
    }
}

#Preview {
    ConfettiView(isVisible: true)
}
