# System Logout/Idle Detection Implementation

This document describes the implementation of system logout and idle detection functionality that automatically pauses tracking when the user is away and resumes when they return.

## Overview

The system monitoring feature detects when a user's system becomes inactive through:

- **System Sleep/Resume**: When the computer goes to sleep or wakes up
- **Screen Lock/Unlock**: When the user locks or unlocks their screen
- **Idle Detection**: When the system has been idle for a configurable period (default: 5 minutes)

## Components

### 1. System Monitor (`systemMonitor.ts`)

- Uses Electron's `powerMonitor` API to detect system state changes
- Monitors sleep/resume, lock/unlock, and idle states
- Provides a subscription system for other components to listen to state changes
- Configurable idle threshold and check intervals

### 2. Session Pause Management (`sessionPause.ts`)

- Handles pausing and resuming active time entries
- Adjusts session start times to exclude paused periods
- Maintains state of paused sessions across system state changes
- Ensures accurate time tracking by compensating for inactive periods

### 3. Enhanced Tracking Service (`trackingIntervalActivity.ts`)

- Integrates with system monitor to pause/resume activity tracking
- Updates tray icon to show paused state (💤) when system is inactive
- Automatically resumes tracking and updates UI when system becomes active
- Maintains tracking accuracy by skipping intervals during inactive periods

### 4. Debug Utilities (`systemMonitorDebug.ts`)

- Provides debugging functions to check system state
- Includes manual testing instructions
- Logs system state changes for troubleshooting

## Configuration

Configuration options are defined in `config/tracking.ts`:

```typescript
// System monitoring configuration
export const IDLE_THRESHOLD_MINUTES = 5; // Minutes of inactivity before considering system idle
export const SYSTEM_MONITOR_CHECK_INTERVAL = 30000; // Check system idle state every 30 seconds
```

## Features

### Automatic Pause/Resume

- **When System Becomes Inactive**:
  - Tracking is paused
  - Current session time is preserved
  - Tray icon shows "💤" to indicate paused state
  - Session start time is tracked for later adjustment

- **When System Becomes Active**:
  - Tracking resumes automatically
  - Session start time is adjusted to exclude paused period
  - Tray icon returns to normal display (🎯 for focus, 🚀 for break)
  - Activity tracking continues normally

### Accurate Time Tracking

- Paused periods are excluded from session duration calculations
- Session timers continue accurately after resume
- Target duration countdowns work correctly across pause/resume cycles

### Visual Feedback

- Tray icon changes to indicate system state
- Clock window updates reflect actual active time
- Logging provides detailed state change information

## Usage

The system monitoring is automatically initialized when the application starts. No manual intervention is required from users.

### For Developers

Debug the system state:

```typescript
import { debugSystemState, testSystemMonitoring } from "./api/services/trackingIntervalActivity";

// Check current system state
debugSystemState();

// Get testing instructions
testSystemMonitoring();
```

## Testing

### Manual Testing Steps

1. **Screen Lock Test**:
   - Lock your screen (Cmd+Ctrl+Q on macOS)
   - Verify tray shows "💤"
   - Unlock screen
   - Verify tray returns to normal

2. **Idle Test**:
   - Leave system idle for the configured threshold (default: 5 minutes)
   - Verify tracking pauses
   - Move mouse or type
   - Verify tracking resumes

3. **Sleep Test**:
   - Put system to sleep
   - Wake system
   - Verify session time adjusted correctly

### Verification

- Check logs for system state change messages
- Verify session durations exclude paused periods
- Confirm tray icon updates appropriately

## Technical Details

### Dependencies

- Electron's `powerMonitor` API for system state detection
- Existing time entry and activity tracking services
- Tray icon management from main process

### Event Flow

1. System state change detected by `powerMonitor`
2. `systemMonitor` service notifies subscribers
3. `trackingIntervalActivity` receives notification
4. Session is paused/resumed via `sessionPause` service
5. UI elements (tray, clock) are updated
6. Activity tracking continues/stops as appropriate

### Error Handling

- Graceful degradation if system monitoring fails
- Cleanup of paused session state on errors
- Proper unsubscription from system events

## Benefits

1. **Accurate Time Tracking**: Users get precise session durations without manual intervention
2. **Automatic Operation**: No user action required to pause/resume tracking
3. **Better User Experience**: Visual feedback shows current system state
4. **Data Integrity**: Time entries reflect actual work time, not idle time
5. **Battery Efficiency**: Reduced activity monitoring during inactive periods

This implementation ensures that the time tracking application accurately reflects user productivity time while providing a seamless experience across different system states.
