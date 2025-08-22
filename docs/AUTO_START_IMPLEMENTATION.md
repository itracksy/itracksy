# Auto-Start Implementation Documentation

## Overview

iTracksy now supports cross-platform auto-start functionality, allowing the application to launch automatically when the system boots. This feature is implemented using native platform APIs and integrates seamlessly with the app's installer/uninstaller processes.

## Platform Support

### macOS 🍎

- **Method**: Uses Electron's `app.setLoginItemSettings()` API
- **Integration**: Adds iTracksy to macOS Login Items
- **User Control**: Managed through System Preferences → Users & Groups → Login Items
- **Security**: No security warnings (app is properly signed and notarized)

### Windows 🪟

- **Method**: Electron's `app.setLoginItemSettings()` + Squirrel installer events
- **Integration**: Windows Registry entries for startup applications
- **Installer Events**: Handles install/uninstall auto-start configuration via `electron-squirrel-startup`
- **User Control**: Visible in Task Manager → Startup tab

### Linux 🐧

- **Method**: XDG Autostart specification (.desktop files)
- **Integration**: Creates `~/.config/autostart/itracksy.desktop` file
- **Standards Compliant**: Follows freedesktop.org XDG autostart specification
- **Desktop Environment**: Works with GNOME, KDE, XFCE, and other XDG-compliant environments

## Implementation Details

### Core Service (`src/api/services/autoStart.ts`)

#### Key Functions:

- `getAutoStartStatus()`: Retrieves current auto-start status across all platforms
- `setAutoStart(enable: boolean, options?)`: Enables/disables auto-start functionality
- `initializeAutoStart()`: Initializes auto-start system during app startup
- `isAutoStartSupported()`: Checks if current platform supports auto-start

#### Platform-Specific Logic:

- **macOS/Windows**: Uses Electron's built-in `app.getLoginItemSettings()` and `app.setLoginItemSettings()`
- **Linux**: Custom implementation using filesystem operations for .desktop files

### API Layer (`src/api/routers/autoStart.ts`)

#### tRPC Endpoints:

- `getStatus`: Returns current auto-start status
- `setEnabled`: Enables/disables auto-start with options
- `toggle`: Toggles current auto-start state
- `getInfo`: Returns platform information and support status
- `isSupported`: Checks platform compatibility

### User Interface (`src/pages/settings-page/SettingsPage.tsx`)

#### Features:

- Toggle switch for easy enable/disable
- Platform-specific descriptions
- Real-time status updates
- Disabled state for unsupported platforms
- Error handling for permission issues

## Installer Integration

### Windows Squirrel Events

The app handles special Squirrel installer events:

```typescript
--squirrel - install; // App installation
--squirrel - updated; // App update
--squirrel - uninstall; // App uninstallation
--squirrel - obsolete; // Obsolete version cleanup
```

During uninstallation, auto-start is automatically disabled to clean up system startup entries.

## Security Considerations

### macOS

- Uses official Electron APIs that integrate with macOS security model
- No additional permissions required
- Respects user's security preferences

### Windows

- Registry modifications are handled by Electron internally
- Works with Windows Security and antivirus software
- Squirrel installer manages permissions appropriately

### Linux

- Uses standard XDG autostart directory
- No root permissions required
- Follows Linux desktop environment standards

## User Experience

### Settings Interface

- Clear toggle switch with platform-specific descriptions
- Real-time feedback on status changes
- Graceful handling of unsupported platforms
- Error messages for failed operations

### Default Behavior

- Auto-start is **disabled by default**
- Users must explicitly enable the feature
- Respects user choice during app updates

## Testing

### Manual Testing Steps

1. Enable auto-start in Settings
2. Restart the system
3. Verify iTracksy launches automatically
4. Disable auto-start in Settings
5. Restart the system
6. Verify iTracksy does not launch automatically

### Platform-Specific Verification

#### macOS

```bash
# Check Login Items
osascript -e 'tell application "System Events" to get the name of every login item'
```

#### Windows

```cmd
# Check Registry (run as admin)
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run"
```

#### Linux

```bash
# Check autostart directory
ls ~/.config/autostart/
cat ~/.config/autostart/itracksy.desktop
```

## Troubleshooting

### Common Issues

1. **Permission Denied (Linux)**

   - Ensure `~/.config/autostart/` directory exists
   - Check file permissions on .desktop file

2. **Registry Access (Windows)**

   - Antivirus software may block registry modifications
   - Windows security settings may prevent startup changes

3. **Login Items (macOS)**
   - Check System Preferences security settings
   - Verify app signature and notarization

### Debug Logging

Auto-start operations are logged with the following pattern:

```
[AutoStart] Setting auto-start to: true
[AutoStart] Auto-start enabled successfully for darwin
[AutoStart] Current auto-start status: { openAtLogin: true, openAsHidden: false }
```

## Future Enhancements

### Planned Features

- **Hidden startup option**: Launch minimized to system tray
- **Delayed startup**: Start with a configurable delay
- **Startup session**: Automatically begin a focus session on startup
- **Update handling**: Better integration with app update processes

### Technical Debt

- Consider using `auto-launch` npm package for more robust Linux support
- Add Windows Task Scheduler integration for advanced scheduling
- Implement startup impact monitoring and user notifications

## Code Examples

### Basic Usage

```typescript
import { setAutoStart, getAutoStartStatus } from "./api/services/autoStart";

// Enable auto-start
const success = setAutoStart(true);

// Get current status
const status = getAutoStartStatus();
console.log("Auto-start enabled:", status.openAtLogin);
```

### React Component Usage

```tsx
const { data: autoStartStatus } = useQuery({
  queryKey: ["autoStart.getStatus"],
  queryFn: () => trpcClient.autoStart.getStatus.query(),
});

const handleToggle = async () => {
  await trpcClient.autoStart.toggle.mutate();
  queryClient.invalidateQueries({ queryKey: ["autoStart.getStatus"] });
};
```

## Dependencies

- **electron**: Core auto-start APIs (`app.setLoginItemSettings`, `app.getLoginItemSettings`)
- **electron-squirrel-startup**: Windows installer event handling
- **node.js fs/path**: Linux .desktop file management
- **@tanstack/react-query**: React state management
- **tRPC**: Type-safe API communication

---

This implementation provides a robust, cross-platform auto-start solution that integrates seamlessly with iTracksy's existing architecture while following platform-specific best practices and security guidelines.
