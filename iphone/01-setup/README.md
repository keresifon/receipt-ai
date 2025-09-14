# 🛠️ Development Environment Setup

Complete guide to set up your Mac Mini for iOS development.

## 📋 Prerequisites Check

### Verify Mac Mini Specifications
```bash
# Check your Mac Mini specs
system_profiler SPHardwareDataType

# Check macOS version
sw_vers

# Check available storage
df -h
```

**Minimum Requirements:**
- **macOS**: 14.0 (Sonoma) or later
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 50GB free space minimum
- **Processor**: Intel or Apple Silicon (M1/M2/M3)

## 🚀 Step 1: Install Xcode

### Method 1: Mac App Store (Recommended)
```bash
# 1. Open Mac App Store
open -a "App Store"

# 2. Search for "Xcode"
# 3. Click "Get" or "Install"
# 4. Wait for download (30-60 minutes)
```

### Method 2: Apple Developer Portal
```bash
# 1. Go to https://developer.apple.com/xcode/
# 2. Download Xcode (requires Apple ID)
# 3. Open downloaded .xip file
# 4. Wait for extraction and installation
```

### Verify Xcode Installation
```bash
# Check Xcode version
xcodebuild -version

# Check available simulators
xcrun simctl list devices

# Check command line tools
xcode-select --print-path
```

## 🍺 Step 2: Install Homebrew

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to PATH (for Apple Silicon Macs)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
brew --version
```

## 🛠️ Step 3: Install Development Tools

```bash
# Install essential development tools
brew install cocoapods
brew install swiftlint
brew install --cask simulators

# Install additional useful tools
brew install git
brew install node  # For any web development
brew install --cask visual-studio-code  # Alternative editor
```

## 🍎 Step 4: Set Up Apple Developer Account

### Free Apple ID (For Simulator Testing)
```bash
# 1. Go to https://developer.apple.com/
# 2. Click "Account" → "Sign In"
# 3. Use your Apple ID or create one
# 4. Accept terms and conditions
```

### Paid Developer Account (For Device Testing & App Store)
```bash
# 1. Go to https://developer.apple.com/programs/
# 2. Click "Enroll" → "Start Your Enrollment"
# 3. Choose "Individual" or "Organization"
# 4. Pay $99/year fee
# 5. Complete verification process
```

## ⚙️ Step 5: Configure Xcode

### Open Xcode and Set Preferences
```bash
# Launch Xcode
open -a Xcode

# Or from command line
xcode
```

### Essential Xcode Settings

1. **Open Preferences** (`Cmd + ,`)
2. **Accounts Tab**:
   - Click "+" → "Apple ID"
   - Sign in with your Apple ID
   - Verify your account appears

3. **Locations Tab**:
   - Set Command Line Tools to latest Xcode version
   - Verify path is correct

4. **Text Editing Tab**:
   - Enable "Show line numbers"
   - Enable "Show page guide"
   - Set tab width to 4 spaces

5. **Key Bindings Tab**:
   - Familiarize yourself with shortcuts
   - `Cmd + R`: Run
   - `Cmd + B`: Build
   - `Cmd + Shift + K`: Clean

## 📱 Step 6: Test Your Setup

### Create a Test Project
```bash
# 1. Open Xcode
# 2. Click "Create a new Xcode project"
# 3. Choose "iOS" → "App"
# 4. Fill in project details:
#    - Product Name: TestApp
#    - Bundle Identifier: com.yourname.testapp
#    - Language: Swift
#    - Interface: SwiftUI
#    - Use Core Data: No
# 5. Choose location and create
```

### Test Simulator
```bash
# 1. In Xcode, select a simulator (iPhone 15 Pro)
# 2. Click Run button (▶️) or press Cmd + R
# 3. Verify app launches in simulator
# 4. Test basic interactions
```

### Test Command Line Tools
```bash
# Test Swift compiler
swift --version

# Test iOS Simulator
xcrun simctl list devices

# Test CocoaPods
pod --version

# Test SwiftLint
swiftlint version
```

## 🔧 Step 7: Additional Configuration

### Set Up Git (if not already done)
```bash
# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Generate SSH key for GitHub
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add SSH key to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy this and add to GitHub Settings → SSH Keys
```

### Install Additional Simulators
```bash
# List available simulators
xcrun simctl list runtimes

# Install specific iOS version
xcrun simctl runtime add "iOS 17.0"
```

### Set Up Development Environment Variables
```bash
# Add to ~/.zshrc or ~/.bash_profile
export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
export PATH="/opt/homebrew/bin:$PATH"

# Reload shell
source ~/.zshrc
```

## 📊 Step 8: Verify Everything Works

### Create a Simple Test App
```swift
// In your test project, replace ContentView.swift with:
import SwiftUI

struct ContentView: View {
    @State private var counter = 0
    
    var body: some View {
        VStack {
            Text("Hello, iOS Development!")
                .font(.largeTitle)
                .padding()
            
            Text("Counter: \(counter)")
                .font(.title)
                .padding()
            
            Button("Increment") {
                counter += 1
            }
            .buttonStyle(.borderedProminent)
            .padding()
        }
    }
}

#Preview {
    ContentView()
}
```

### Test Build and Run
```bash
# 1. Select iPhone 15 Pro simulator
# 2. Press Cmd + R to run
# 3. Verify app launches
# 4. Test button interaction
# 5. Check console for any errors
```

## 🚨 Troubleshooting Common Issues

### Issue: Xcode Won't Launch
```bash
# Reset Xcode
sudo xcode-select --reset
sudo xcode-select --install

# Clear Xcode cache
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### Issue: Simulator Won't Start
```bash
# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all

# Restart simulator
open -a Simulator
```

### Issue: Command Line Tools Missing
```bash
# Install command line tools
xcode-select --install

# Verify installation
xcode-select --print-path
```

### Issue: CocoaPods Installation Fails
```bash
# Update CocoaPods
sudo gem install cocoapods

# Or use Homebrew version
brew install cocoapods
```

## ✅ Final Checklist

- [ ] **Xcode installed** and launches successfully
- [ ] **Apple ID** signed in to Xcode
- [ ] **Command line tools** installed and working
- [ ] **Homebrew** installed with essential tools
- [ ] **CocoaPods** installed and working
- [ ] **SwiftLint** installed for code quality
- [ ] **Simulator** launches and runs test app
- [ ] **Git** configured for version control
- [ ] **Test project** builds and runs successfully

## 💡 Pro Tips for Mac Mini Development

### Performance Optimization
```bash
# Close unnecessary applications
# Use Activity Monitor to check memory usage
# Consider upgrading RAM if you have 8GB or less
```

### Storage Management
```bash
# Xcode can use 20-30GB of space
# Simulators use additional space
# Keep at least 50GB free for development
```

### Multiple Projects
```bash
# Create a dedicated folder for iOS projects
mkdir ~/iOS-Projects
cd ~/iOS-Projects

# Keep projects organized
mkdir ReceiptAI
cd ReceiptAI
```

## 🎯 Next Steps

Once your environment is set up:
1. Move to `../02-project-structure/` to create your ReceiptAI project
2. Follow the project structure guide
3. Set up dependencies and initial configuration

---

**Ready for the next step?** Proceed to `../02-project-structure/README.md`!
