# iTracksy Release Notes

## Latest Release - Version 1.0.189

### 🎉 New Features

#### ⏰ Custom Session Times

- **Customizable focus session durations** - Set your own target durations for focus and break sessions
- Sessions remember your last used duration for each mode (focus/break)
- Flexible timing to match your personal productivity patterns

#### ⚙️ Clock Window Controls

- **Toggle clock window visibility** - New setting to show/hide the floating clock window
- Access via Settings → Clock Window
- Automatically appears when starting focus sessions (when enabled)
- Perfect for users who prefer minimal UI distractions

#### 📊 Reports & Export

- **New Reports page** with comprehensive time tracking analytics
- **CSV export functionality** for external analysis
- Export your activity data, time entries, and productivity metrics
- Integrate with spreadsheets and other productivity tools

#### 🎵 Music Page for Focus

- **Curated music playlists** to enhance focus and productivity
- Categories: Focus, Break, and Energize music
- **11 hand-picked YouTube playlists** designed for different work modes
- Search functionality to find the perfect background music
- External link integration for seamless music access

#### 🔕 Time Exceeded Notification Controls

- **New setting to disable time exceeded notifications**
- Prevents interruptions during extended focus sessions
- Access via Settings → Time Exceeded Notifications
- Perfect for deep work sessions where you don't want to be disturbed
- Auto-stop functionality still works regardless of notification setting

#### 📅 Session Scheduling System

- **Automated session scheduling** - Set up focus sessions to start automatically
- **Smart recurring patterns** - Daily, weekly, or custom recurring schedules
- **Quick preset templates** - Choose from 6 built-in session types:
  - 🍅 **Pomodoro**: 25-minute focus + 5-minute break cycles
  - 🎯 **Deep Work**: 90-minute intensive focus sessions
  - 🧠 **Creative Flow**: 45-minute creative sessions with longer breaks
  - ⚡ **Sprint**: 15-minute quick bursts for small tasks
  - 🔬 **Research**: 60-minute sessions perfect for learning
  - 📚 **Study**: 50-minute academic-focused sessions
- **Flexible timing** - Set any start/end times that fit your schedule
- **Project integration** - Link scheduled sessions to specific projects
- **Smart execution** - Sessions start automatically at scheduled times
- **Easy management** - View, edit, or delete scheduled sessions anytime
- **One-time or recurring** - Perfect for both ad-hoc sessions and daily routines

### 🛠️ Technical Improvements

#### Windows Release Changes

- **Removed code signing for Windows executables** due to budget constraints
- Windows users will see security warnings during installation
- **Installation Instructions**: Click "More info" → "Run anyway" to install safely
- This is normal behavior for unsigned applications and the software is completely safe

#### Code Quality & Architecture

- **New scheduling infrastructure** with comprehensive session automation
- **Database schema expansion** with new scheduled_sessions table
- **Enhanced tRPC API** with scheduling endpoints and validation
- Enhanced settings management system
- Improved notification controls
- Better user preference persistence
- Maintained backward compatibility for all existing features

### 📝 Installation Notes

#### Windows Users

The Windows executable is now unsigned (code signing certificates are too expensive for an indie project). When you see the "Windows protected your PC" dialog:

1. Click **"More info"**
2. Click **"Run anyway"** to proceed with installation

This warning is expected and the application is completely safe to use.

#### macOS Users

The macOS version remains properly signed and notarized - no security warnings.

### 🎯 User Experience Enhancements

- **Automated productivity routines** with comprehensive session scheduling
- **Reduced notification fatigue** with granular notification controls
- **Better focus session customization** with flexible timing
- **Enhanced productivity insights** through improved reporting
- **Ambient focus enhancement** with curated music integration
- **Streamlined settings management** with clear categorization
- **Preset-driven workflows** with 6 research-backed session templates

### 💡 Why These Features Matter

1. **Automated Scheduling**: Building consistent productivity habits through automation
2. **Customizable Sessions**: Recognizing that everyone has different optimal focus durations
3. **Notification Control**: Giving users power over when and how they're interrupted
4. **Music Integration**: Research shows the right background music can significantly enhance focus
5. **Better Reporting**: Helping users understand and optimize their productivity patterns
6. **UI Flexibility**: Letting users customize their workspace for minimal distractions
7. **Preset Templates**: Science-backed session patterns (Pomodoro, Deep Work, etc.) for optimal focus

### 🚀 Getting Started

1. **Download** the latest release from [GitHub Releases](https://github.com/hunght/itracksy/releases)
2. **Set up automated sessions** in the new Scheduling page
3. **Explore new settings** in the Settings page
4. **Try the Music page** to find your perfect focus soundtrack
5. **Customize your session times** to match your work style
6. **Export your data** from the new Reports page

### 🐛 Bug Fixes & Stability

- Improved error handling in notification system
- Enhanced settings persistence
- Better memory management for music page
- Stabilized tRPC communication between processes

---

**Download Now**: [GitHub Releases](https://github.com/hunght/itracksy/releases)

**Feedback**: Open an issue on GitHub or reach out on Discord

**Tags**: #productivity #timetracking #focus #indie

---

_iTracksy is an indie project focused on helping you understand and optimize your productivity. Thank you for your support!_
