# Habita

**A calm, frictionless productivity app** that combines visual task prioritization with gentle habit formation and beautiful analytics.

![SwiftUI](https://img.shields.io/badge/SwiftUI-000000?logo=swift&logoColor=white) ![SwiftData](https://img.shields.io/badge/SwiftData-FF2D55?logo=swift&logoColor=white) ![iOS](https://img.shields.io/badge/iOS-17+-000000?logo=apple&logoColor=white)

## Features

- **Ike Matrix** – Visual 2×2 task prioritization with drag & drop  
- **Habits** – Simple +/− logging with daily targets (no streak pressure)  
- **Calendar View** – Time-block your schedule  
- **Analytics** – Completion rates, trends, and distribution charts  
- **Wins Counter** – Celebrate your progress with confetti animations  
- **Inbox** – Tasks that carry over until completed  
- **Dark Mode & Accessibility** – Full system integration  
- **Optional AI** – GPT-powered task ratings & icon suggestions  
- **Optional CloudKit Sync** – Cloud backup and multi-device sync

## Tech Stack

- **Language**: Swift  
- **UI Framework**: SwiftUI  
- **Data Persistence**: SwiftData  
- **Cloud Sync**: CloudKit (optional)  
- **AI**: OpenAI GPT-4o-mini + on-device NaturalLanguage  

## Getting Started

### Prerequisites
- Xcode 15.0+
- iOS 17 or later
- A Mac with macOS 13+

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/akshayaa-403/Habita.git
   cd Habita
   ```

2. Open `Habita.xcodeproj` in Xcode:
   ```bash
   open Habita.xcodeproj
   ```

3. Select a simulator or device and press **⌘R** to build and run

### Project Structure

```
Habita/
├── Models/              # SwiftData models (Habit, Task, Log, Wins)
├── ViewModels/          # State management & business logic
├── Views/               # SwiftUI views & screens
├── Utilities/           # Services (CloudKit, AI, Theme, Accessibility)
├── HabitaApp.swift      # App entry point & navigation
└── README.md
```

## Development

### Build & Run

- **Build**: ⌘B  
- **Run**: ⌘R  
- **Test**: ⌘U

### Code Style

The project follows Swift language conventions. Consider using [SwiftLint](https://github.com/realm/SwiftLint) for consistency:

```bash
brew install swiftlint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] CloudKit sync implementation
- [ ] AI task rating refinement  
- [ ] Custom habit categories  
- [ ] Export analytics as PDF  
- [ ] iPad support  
- [ ] Apple Watch companion app  

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with ❤️ using SwiftUI and SwiftData
- Inspired by the Eisenhower Matrix for task prioritization
- Special thanks to the Swift and open-source communities