# Xcode Project Setup Guide

This repository contains the source files for Habita. To build and run the app, you'll need to create an Xcode project structure.

## Prerequisites

- Xcode 15.0 or later
- macOS 13.0 or later
- iOS 17 or later (for devices/simulators)
- Apple Developer Account (optional, for CloudKit sync)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/akshayaa-403/Habita.git
cd Habita
```

### 2. Create the Xcode Project

**Option A: Using Xcode GUI (Recommended for beginners)**

1. Open Xcode
2. Click **File** → **New** → **Project**
3. Select **iOS** → **App**
4. Configure the project:
   - Product Name: `Habita`
   - Organization: Your name or company
   - Organization Identifier: `com.yourcompany` (e.g., `com.example`)
   - Interface: **SwiftUI**
   - Language: **Swift**
   - ✅ **Core Data** - Uncheck this (we use SwiftData instead)
   - ✅ **Include Tests** - Optional
5. Choose a location to save (navigate to the cloned `Habita` folder)
6. Click **Create**

**Option B: Using Command Line**

```bash
cd Habita
mkdir -p Habita.xcodeproj
```

Then create the project manually through Xcode as shown in Option A.

### 3. Organize Project Structure

Once the Xcode project is created:

1. In Xcode, select the project → **File** → **Add Files to "Habita"...**
2. Select the following folders (hold Cmd to select multiple):
   - `Models/`
   - `ViewModels/`
   - `Views/`
   - `Utilities/`
3. Make sure **Copy items if needed** is checked
4. Click **Add**

### 4. Clean Up Default Files

1. Delete the default `ContentView.swift` and `HabitaApp.swift` (if created by template)
2. Add the repository's `HabitaApp.swift` from the root folder to the project

### 5. Configure Build Settings

1. Select the **Habita** project in the navigator
2. Select the **Habita** target
3. Go to **Build Settings**
4. Search for **Swift Language Version** and ensure it's set to **Swift 5.9** or later
5. Search for **iOS Deployment Target** and set it to **17.0** or later

### 6. Add App Icons & Launch Screen (Optional)

1. Select the **Assets.xcassets** folder
2. Add your app icon (1024×1024) by dragging into the **AppIcon** slot
3. Create a launch screen in **Assets** or use a **LaunchScreen.storyboard**

### 7. Enable CloudKit (Optional but Recommended)

To enable CloudKit sync:

1. Select the **Habita** target
2. Go to **Signing & Capabilities**
3. Click **+ Capability**
4. Search for and add **iCloud**
5. Enable **CloudKit**
6. Keep the default container name

*Note: This requires an Apple Developer account and a valid provisioning profile.*

### 8. Build & Run

1. Select a simulator or device from the top toolbar
2. Press **⌘R** or click **Product** → **Run**
3. The app will build and launch

## Common Issues & Fixes

### Issue: "Module not found" errors

**Solution**: Ensure all files are added to the Habita target:
1. Select each file
2. In the **File Inspector**, check the **Target Membership** and select **Habita**

### Issue: "Cannot find Habit in scope"

**Solution**: Confirm the Models folder is properly added and all model files are in the Habita target.

### Issue: CloudKit errors

**Solution**: 
- Ensure you have a valid Apple Developer account
- Verify iCloud capability is enabled
- Check that your app's bundle identifier is configured

### Issue: Build fails with "Code signing"

**Solution**:
1. Select the project
2. Under **Targets** → **Signing & Capabilities**
3. Choose your team from the dropdown
4. Select an appropriate provisioning profile

## Configuration Files

The Xcode project will need these essential files (already in the repo):

- `Habita.xcodeproj/` – Project configuration (not included in repo)
- `Habita.xcodeproj/project.pbxproj` – Build configuration (auto-generated)
- `HabitaApp.swift` – App entry point ✅
- `Models/*.swift` – Data models ✅
- `Views/*.swift` – UI layers ✅
- `ViewModels/*.swift` – State management ✅
- `Utilities/*.swift` – Services ✅

## Next Steps

Once the project builds successfully:

1. Run on a simulator: Press **⌘R**
2. Run on a device: Connect via USB and select the device in the toolbar
3. Review the code and customize as needed
4. Build your own features!

## Troubleshooting

For additional help:

- Check the [Swift Forums](https://forums.swift.org/)
- Review [Apple's SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- Visit [SwiftData Docs](https://developer.apple.com/documentation/swiftdata)

## Contributing

Once you have the project running, feel free to contribute!

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines (if available).

---

**Happy coding! 🎉**
