# Ghost Window Fix - Clock Window

## Issue Description

The clock window was leaving an untouchable "ghost" area on the screen after being moved and closed. Users could not interact with anything in that area, even though the window was no longer visible.

## Root Cause

The clock window uses a frameless design with `-webkit-app-region: drag` applied to the entire window shell (`.clock-shell` in `clock.css`). This CSS property allows users to drag the window by clicking anywhere on it.

However, when a frameless Electron window with drag regions is hidden or closed, the drag region can persist as an invisible "ghost" that continues to capture mouse events. This prevents users from interacting with anything beneath that area.

This is a known issue with Electron's frameless windows on certain platforms, particularly macOS.

## Solution Implemented

Added `setIgnoreMouseEvents()` calls to properly manage mouse event capture:

### Changes to `showClockWindow()`

```typescript
export function showClockWindow(): void {
  if (!clockWindow || clockWindow.isDestroyed()) {
    createClockWindow();
  }

  if (clockWindow) {
    console.log("Showing clock window");
    // Re-enable mouse events before showing
    clockWindow.setIgnoreMouseEvents(false);
    clockWindow.show();
    // ... rest of the function
  }
}
```

**Why:** When showing the window, we need to re-enable mouse event capture so the window can receive clicks, drags, and other interactions.

### Changes to `hideClockWindow()`

```typescript
export function hideClockWindow(): void {
  if (clockWindow && !clockWindow.isDestroyed() && isClockVisible) {
    console.log("Hiding clock window");
    // Release mouse events before hiding to prevent ghost regions
    clockWindow.setIgnoreMouseEvents(true);
    clockWindow.hide();
    isClockVisible = false;
  }
}
```

**Why:** Before hiding the window, we release mouse event capture. This ensures that the window stops intercepting mouse events immediately, preventing ghost regions.

### Changes to `closeClockWindow()`

```typescript
export function closeClockWindow(): void {
  if (clockWindow && !clockWindow.isDestroyed()) {
    console.log("Closing clock window");
    // Release mouse events before closing to prevent ghost regions
    clockWindow.setIgnoreMouseEvents(true);
    clockWindow.close();
    clockWindow = null;
    isClockVisible = false;
  }
}
```

**Why:** Before closing the window, we release mouse event capture to ensure no ghost regions remain after the window is destroyed.

## How It Works

`setIgnoreMouseEvents(true)` tells Electron to pass all mouse events through the window to whatever is beneath it. This effectively makes the window "transparent" to mouse interactions.

`setIgnoreMouseEvents(false)` tells Electron to capture mouse events normally, allowing the window to receive clicks and drags.

By calling `setIgnoreMouseEvents(true)` before hiding or closing the window, we ensure that:
1. The window immediately stops capturing mouse events
2. No ghost region is left behind
3. Users can interact with the screen area where the window was located

## Testing

To verify the fix:

1. Open the iTracksy app
2. Show the clock window
3. Move it to a specific location on the screen
4. Close or hide the clock window
5. Try clicking and interacting with the area where the window was
6. Verify that the area is fully interactive (no ghost region)

## Files Modified

- [`src/main/windows/clock.ts`](file:///Users/owner/source/itracksy.com/itracksy/src/main/windows/clock.ts) - Added `setIgnoreMouseEvents()` calls to window management functions

## Related Issues

This fix addresses the ghost window issue caused by `-webkit-app-region: drag` in frameless Electron windows, which is a common problem on macOS and some Linux window managers.
