# Auto-Dismiss Notification Feature

## Overview

The notification system now supports an optional auto-dismiss feature. By default, notifications will **NOT** auto-dismiss and will require user interaction to close.

## Usage

### Basic API

```typescript
// Send a notification with auto-dismiss enabled
await sendNotificationToWindow({
  title: "Focus Session Complete!",
  body: "Great job! Take a break.",
  autoDismiss: true, // Will auto-close in 5 seconds
});

// Send a notification without auto-dismiss (default)
await sendNotificationToWindow({
  title: "Important Alert",
  body: "This requires your attention.",
  autoDismiss: false, // User must manually dismiss
});

// Auto-dismiss defaults to false, so this is the same as above
await sendNotificationToWindow({
  title: "Important Alert",
  body: "This requires your attention.",
});
```

### Service Layer

```typescript
// In notification service, specify auto-dismiss as third parameter
await sendNotification(
  {
    title: "Break Time!",
    body: "You've been working for 90 minutes.",
    userId: "user123",
    type: "engagement_time_entry",
    timeEntryId: "entry456",
    createdAt: Date.now(),
  },
  undefined,
  true
); // Enable auto-dismiss
```

### Router/API Usage

```typescript
// Via tRPC router
await utils.sendNotification.mutate({
  title: "Session Reminder",
  description: "Time to start your next focus session!",
  autoDismiss: true, // Will auto-close
});
```

## Behavior

### Auto-Dismiss Enabled (autoDismiss: true)

- Notification shows countdown: "Auto-closing in 5s"
- Automatically closes after 5 seconds
- User can still manually dismiss before auto-close
- Timer resets if new notification with auto-dismiss arrives

### Auto-Dismiss Disabled (autoDismiss: false, default)

- Notification shows: "Click dismiss to close"
- Stays open until user manually closes
- No countdown timer
- Persistent until user action

## Default Settings by Notification Type

### Auto-Dismiss Enabled (Non-Critical)

- Motivational messages ("Time for a New Focus Session!")
- Reminder notifications when no active session
- Informational updates

### Auto-Dismiss Disabled (Critical/Important)

- Target duration exceeded notifications
- Focus mode alerts requiring attention
- Error notifications
- Block/activity warnings

## UI Changes

The notification window now dynamically shows either:

- **Auto-dismiss enabled**: "Auto-closing in Xs" with countdown
- **Auto-dismiss disabled**: "Click dismiss to close" with static text

Both modes still show the "Dismiss" button for manual closure.

## Implementation Details

### Files Modified

- `/src/helpers/notification/notification-window-utils.ts` - Core utility with auto-dismiss support
- `/src/api/services/notification.ts` - Service layer with auto-dismiss parameter
- `/src/api/routers/utils.ts` - Router procedures with auto-dismiss option
- `/src/renderer/notification/NotificationApp.tsx` - UI component with conditional timer
- `/src/helpers/ipc/notification/notification-listeners.ts` - IPC handlers updated

### Interface Changes

```typescript
interface NotificationData {
  title: string;
  body: string;
  autoDismiss?: boolean; // Default: false
}
```

This ensures backward compatibility while providing the new auto-dismiss functionality.
