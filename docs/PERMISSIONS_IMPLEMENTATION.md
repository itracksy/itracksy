# macOS Permissions Implementation Summary

## Overview

This implementation adds comprehensive macOS system permission handling to iTracksy, enabling the `get-windows` library to access browser URLs for detailed activity tracking.

## Required Permissions

### 1. Accessibility Permission

- **API**: `systemPreferences.isTrustedAccessibilityClient()`
- **Purpose**: Access window information and detect active applications
- **System Path**: System Settings > Privacy & Security > Accessibility

### 2. Screen Recording Permission

- **API**: `systemPreferences.getMediaAccessStatus('screen')`
- **Purpose**: Access browser URLs and window content
- **System Path**: System Settings > Privacy & Security > Screen Recording

## Implementation Details

### Core Permission Functions (`src/api/services/userSettings.ts`)

- `checkAccessibilityPermission()` - Check if accessibility permission is granted
- `checkScreenRecordingPermission()` - Check if screen recording permission is granted
- `requestAccessibilityPermission()` - Open System Settings to accessibility panel
- `requestScreenRecordingPermission()` - Open System Settings to screen recording panel
- `getDetailedPermissionStatus()` - Get comprehensive permission status with descriptions

### App Initialization (`src/main.ts`)

- Added `checkAndRequestPermissions()` function that runs on app startup
- Shows user-friendly dialogs explaining why permissions are needed
- Automatically opens System Settings when user chooses to grant permissions
- Provides follow-up instructions and warnings about limited functionality

### TPRC API Endpoints (`src/api/routers/user.ts`)

- `getPermissions` - Get basic permission status (existing)
- `getDetailedPermissionStatus` - Get detailed permission info with descriptions (new)
- `setPermissions` - Request permissions (existing)

### Enhanced Settings UI (`src/pages/settings-page/SettingsPage.tsx`)

- Visual indicators showing permission status (✓ for granted)
- Detailed descriptions explaining what each permission does
- System Settings path guidance for manual setup
- Warning messages when permissions are missing
- Success confirmation when all permissions are granted

### Entitlements (`entitlements.plist`)

- Added `com.apple.security.device.screen-capture` entitlement
- Added `com.apple.security.device.audio-input` entitlement

### get-windows Integration (`src/api/services/trackingIntervalActivity.ts`)

- Properly configured with both permission flags:
  ```typescript
  const result = await getWindows.activeWindow({
    accessibilityPermission: true,
    screenRecordingPermission: true,
  });
  ```

## User Experience Flow

### First Launch

1. App starts and checks permission status
2. If permissions missing, shows informative dialog
3. User can choose to grant permissions or skip
4. If granting, System Settings opens automatically
5. Follow-up dialog provides setup instructions
6. App restart required for permissions to take effect

### Settings Management

- Users can view permission status in Settings
- Visual indicators show granted/missing permissions
- One-click access to System Settings panels
- Clear guidance on what each permission enables

### Developer Tools

- `npm run test-permissions` - Test script to verify permission setup
- Comprehensive logging of permission status
- Error handling for permission-related issues

## Files Modified/Created

### Core Implementation

- `src/main.ts` - Added permission checking on app startup
- `src/api/services/userSettings.ts` - Enhanced permission functions
- `src/api/routers/user.ts` - Added detailed permission endpoint
- `src/pages/settings-page/SettingsPage.tsx` - Enhanced UI

### Configuration

- `entitlements.plist` - Added screen capture entitlements
- `package.json` - Added test-permissions script

### Documentation

- `docs/MACOS_PERMISSIONS.md` - Comprehensive user guide
- `README.md` - Added macOS permissions section
- `scripts/test-permissions.js` - Permission testing utility

## Browser Support

The implementation supports URL extraction from:

- Safari
- Google Chrome
- Mozilla Firefox
- Microsoft Edge

## Privacy & Security

- All data remains local to the device
- No external data transmission
- User has full control over tracked data
- Transparent permission requirements
- Clear explanations of data usage

## Testing

- Run `npm run test-permissions` to verify setup
- Check Settings page for permission status
- Monitor logs for permission-related errors
- Test with different browsers to verify URL capture

## Troubleshooting

- Permissions not working → Restart app after granting
- Can't find app in System Settings → Run app first, then check settings
- URLs not capturing → Verify both permissions are granted
- Permission errors in logs → Check System Settings and restart app

This implementation provides a comprehensive, user-friendly solution for managing macOS permissions required for browser URL tracking with the `get-windows` library.
