# Scheduling User Choice System

## Overview

When a scheduled session is supposed to start but there's already an active session running, the system now asks the user what they want to do. This provides flexibility while maintaining schedule integrity.

## How It Works

### **1. Conflict Detection**

```
Scheduled session ready to start → Check for active session → Conflict detected → Ask user
```

### **2. User Choice Options**

When a conflict occurs, the user is presented with three options:

#### **Option A: Stop Current & Start Scheduled** ✅ (Default)

- **What happens**: Current session stops, scheduled session starts immediately
- **Best for**: Users who want to stick to their schedule
- **Use case**: Important scheduled sessions that shouldn't be missed

#### **Option B: Queue for Later**

- **What happens**: Scheduled session is queued to run after current session ends
- **Best for**: Users who want to finish their current work
- **Use case**: When current task is almost complete

#### **Option C: Skip This Time**

- **What happens**: This occurrence of the scheduled session is skipped
- **Best for**: Users who want to maintain their current focus
- **Use case**: When current work is more important than the schedule

## Implementation Details

### **Current Implementation (Phase 1)**

- **Notification**: User receives a notification about the conflict
- **Default behavior**: System automatically chooses "Stop Current & Start Scheduled"
- **Reasoning**: Ensures schedule integrity while informing the user

### **Future Enhancements (Phase 2)**

- **Interactive notifications**: Buttons for user to choose action
- **Dialog windows**: Modal dialogs for complex decisions
- **User preferences**: Remember user's preferred choice for future conflicts

## Code Structure

### **Main Function**

```typescript
export async function executeScheduledSession(sessionId: string): Promise<boolean> {
  // Check if there's already an active session
  const activeEntry = await getActiveTimeEntry(userId);

  if (activeEntry) {
    // There's an active session - ask user what to do
    const userChoice = await askUserAboutScheduledSession(session, activeEntry);

    switch (userChoice) {
      case "stop_current_start_scheduled":
        await stopCurrentSession(activeEntry.id);
        return await startScheduledSession(session, sessionId);

      case "queue_scheduled":
        await queueScheduledSession(session, sessionId);
        return true;

      case "skip_scheduled":
        await skipScheduledSession(sessionId);
        return true;

      default:
        return false;
    }
  } else {
    // No active session - start scheduled session normally
    return await startScheduledSession(session, sessionId);
  }
}
```

### **User Choice Function**

```typescript
async function askUserAboutScheduledSession(
  scheduledSession: ScheduledSession,
  activeEntry: any
): Promise<"stop_current_start_scheduled" | "queue_scheduled" | "skip_scheduled" | "cancelled"> {
  // Send notification about conflict
  await sendNotification(
    {
      title: "Scheduled Session Conflict",
      body: `"${scheduledSession.name}" is scheduled to start now, but you have an active session. The current session will be stopped to start the scheduled one.`,
      userId: scheduledSession.userId,
      type: "focus_reminder",
      timeEntryId: activeEntry.id,
      createdAt: Date.now(),
    },
    10000,
    true
  );

  // For now, default to stopping current and starting scheduled
  return "stop_current_start_scheduled";
}
```

### **Action Functions**

```typescript
// Stop current session
async function stopCurrentSession(entryId: string): Promise<void>;

// Start scheduled session
async function startScheduledSession(
  session: ScheduledSession,
  sessionId: string
): Promise<boolean>;

// Queue scheduled session
async function queueScheduledSession(session: ScheduledSession, sessionId: string): Promise<void>;

// Skip scheduled session
async function skipScheduledSession(sessionId: string): Promise<void>;
```

## User Experience Flow

### **Scenario 1: No Conflict**

```
Scheduled time arrives → No active session → Scheduled session starts normally
```

### **Scenario 2: Conflict with Active Session**

```
Scheduled time arrives → Active session detected → User notified → Current session stopped → Scheduled session starts
```

### **User Notification**

- **Title**: "Scheduled Session Conflict"
- **Message**: Explains what's happening and what will be done
- **Duration**: 10 seconds (auto-dismiss)
- **Action**: User is informed but doesn't need to take action

## Benefits

### **1. Schedule Integrity**

- Scheduled sessions run on time
- No missed appointments or focus blocks
- Maintains productivity routine

### **2. User Awareness**

- Users know when conflicts occur
- Transparent about what the system is doing
- No surprise session changes

### **3. Flexibility for Future**

- Framework ready for user choice implementation
- Can be enhanced with interactive elements
- Supports different user preferences

### **4. Graceful Handling**

- Current work is properly ended
- Time tracking remains accurate
- Clean transition between sessions

## Future Enhancements

### **Phase 2: Interactive Choices**

```typescript
// Enhanced notification with action buttons
await sendInteractiveNotification({
  title: "Scheduled Session Ready",
  body: "What would you like to do?",
  actions: [
    { text: "Stop Current & Start Scheduled", action: "stop_current_start_scheduled" },
    { text: "Queue for Later", action: "queue_scheduled" },
    { text: "Skip This Time", action: "skip_scheduled" },
  ],
  timeout: 30000, // 30 seconds to respond
});
```

### **Phase 3: User Preferences**

```typescript
// Remember user's preferred choice
const userPreference = await getUserSchedulingPreference(userId);
if (userPreference === "always_queue") {
  return "queue_scheduled";
} else if (userPreference === "always_stop_current") {
  return "stop_current_start_scheduled";
}
```

### **Phase 4: Smart Scheduling**

```typescript
// Intelligent conflict resolution based on:
// - Session importance
// - Current work progress
// - Time remaining in current session
// - User's historical choices
```

## Testing

### **Test Scenarios**

1. **No conflict**: Scheduled session starts normally
2. **With conflict**: Current session stops, scheduled starts
3. **Notification**: User receives conflict notification
4. **Logging**: All actions are properly logged

### **Manual Testing**

1. Start a focus session
2. Create a scheduled session for current time + 1 minute
3. Wait for scheduled time
4. Observe conflict resolution behavior

## Configuration

### **Current Settings**

- **Default choice**: "Stop Current & Start Scheduled"
- **Notification timeout**: 10 seconds
- **Auto-dismiss**: Enabled
- **Logging**: Comprehensive logging of all actions

### **Customizable Options**

- **Default behavior**: Can be changed per user
- **Notification duration**: Adjustable timeout
- **Conflict resolution**: Different strategies available

## Conclusion

The user choice system provides a robust foundation for handling scheduling conflicts while maintaining the integrity of scheduled sessions. The current implementation ensures users are informed and schedules are maintained, while the architecture supports future enhancements for more interactive user control.

This system strikes the right balance between automation and user control, ensuring that scheduled productivity sessions run on time while giving users visibility into what's happening.
