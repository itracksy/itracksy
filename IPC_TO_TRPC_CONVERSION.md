# IPC to tRPC Conversion - Window Management

## Overview

Successfully converted 5 window management IPC channels to tRPC endpoints for better type safety and consistency.

## Converted Channels

### Original IPC Channels

- `WIN_MINIMIZE_CHANNEL` → `window.minimize`
- `WIN_MAXIMIZE_CHANNEL` → `window.maximize`
- `WIN_CLOSE_CHANNEL` → `window.close`
- `WIN_UPDATE_TRAY_TITLE_CHANNEL` → `window.updateTrayTitle`
- `WIN_CLOCK_VISIBILITY_CHANGE_CHANNEL` → `window.setClockVisibility`

## Changes Made

### 1. Created New tRPC Router (`src/api/routers/window.ts`)

- **Purpose**: Handles all window management operations
- **Features**:
  - Type-safe input validation using Zod schemas
  - Proper error handling with logging
  - Global references to main window and tray
  - All operations return consistent response format

### 2. Updated Main tRPC Router (`src/api/index.ts`)

- Added `windowRouter` to the main router
- Exported as `window` namespace in tRPC

### 3. Updated Main Process (`src/main.ts`)

- Added `setWindowReferences` import
- Set up window references for tRPC router
- Maintained existing IPC registration for other channels

### 4. Updated IPC Listeners Registration (`src/helpers/ipc/listeners-register.ts`)

- Commented out window event listeners (now handled by tRPC)
- Kept other IPC listeners intact

### 5. Updated Window Context (`src/helpers/ipc/window/window-context.ts`)

- **Before**: Used `ipcRenderer.invoke()` with channel constants
- **After**: Uses `trpcClient.window.*.mutate()` calls
- Maintains same API surface for renderer process

## API Changes

### Before (IPC)

```typescript
// Renderer
window.electronWindow.minimize();
window.electronWindow.maximize();
window.electronWindow.close();
window.electronWindow.updateTrayTitle("New Title");
window.electronWindow.handleClockVisibilityChange(false);

// Main Process
ipcRenderer.invoke(WIN_MINIMIZE_CHANNEL);
ipcRenderer.invoke(WIN_MAXIMIZE_CHANNEL);
ipcRenderer.invoke(WIN_CLOSE_CHANNEL);
ipcRenderer.invoke(WIN_UPDATE_TRAY_TITLE_CHANNEL, title);
ipcRenderer.invoke(WIN_CLOCK_VISIBILITY_CHANGE_CHANNEL, isVisible);
```

### After (tRPC)

```typescript
// Renderer (same API)
window.electronWindow.minimize();
window.electronWindow.maximize();
window.electronWindow.close();
window.electronWindow.updateTrayTitle("New Title");
window.electronWindow.handleClockVisibilityChange(false);

// Main Process (tRPC)
trpcClient.window.minimize.mutate();
trpcClient.window.maximize.mutate();
trpcClient.window.close.mutate();
trpcClient.window.updateTrayTitle.mutate({ title });
trpcClient.window.setClockVisibility.mutate({ isVisible });
```

## Benefits

### 1. **Type Safety**

- Full TypeScript support with autocomplete
- Compile-time error checking
- Input validation with Zod schemas

### 2. **Consistency**

- Same response format across all endpoints
- Consistent error handling
- Unified logging approach

### 3. **Maintainability**

- Centralized window management logic
- Better code organization
- Easier to test and debug

### 4. **Performance**

- No string-based channel routing
- Direct function calls
- Better error propagation

## Files Modified

1. **`src/api/routers/window.ts`** - New tRPC router for window management
2. **`src/api/index.ts`** - Added window router to main tRPC router
3. **`src/main.ts`** - Set up window references for tRPC
4. **`src/helpers/ipc/listeners-register.ts`** - Removed window IPC listeners
5. **`src/helpers/ipc/window/window-context.ts`** - Updated to use tRPC

## Files Unchanged

- All other IPC channels remain unchanged
- Renderer process API remains the same
- Existing functionality preserved

## Testing

- TypeScript compilation passes
- No breaking changes to existing API
- Backward compatible with current usage

## Complete Refactoring

### ✅ **Phase 1: Convert IPC to tRPC** (Completed)

- Created tRPC router for window management
- Updated main process to use tRPC
- Maintained backward compatibility

### ✅ **Phase 2: Remove IPC Dependencies** (Completed)

- Updated UI components to call tRPC directly
- Removed old IPC window folder (`src/helpers/ipc/window/`)
- Updated helper functions to use tRPC
- Removed IPC bridge for window functions
- Cleaned up type definitions

## Final State

### Before (IPC)

```typescript
// UI calls IPC bridge
window.electronWindow.minimize();
window.electronWindow.maximize();
window.electronWindow.close();

// IPC bridge calls main process
ipcRenderer.invoke(WIN_MINIMIZE_CHANNEL);
ipcRenderer.invoke(WIN_MAXIMIZE_CHANNEL);
ipcRenderer.invoke(WIN_CLOSE_CHANNEL);
```

### After (tRPC)

```typescript
// UI calls tRPC directly
trpcClient.window.minimize.mutate();
trpcClient.window.maximize.mutate();
trpcClient.window.close.mutate();
```

## Benefits Achieved

1. **Eliminated IPC Overhead**: Direct tRPC calls instead of IPC bridge
2. **Better Type Safety**: Full TypeScript support throughout the call chain
3. **Cleaner Architecture**: Removed unnecessary IPC layer for window management
4. **Reduced Complexity**: Fewer files and simpler code structure
5. **Better Performance**: Direct function calls without string-based routing

## Files Removed

- `src/helpers/ipc/window/window-channels.ts`
- `src/helpers/ipc/window/window-listeners.ts`
- `src/helpers/ipc/window/window-context.ts`
- `src/helpers/ipc/window/` (entire folder)

## Files Updated

- `src/pages/settings-page/SettingsPage.tsx` - Uses tRPC directly
- `src/helpers/window_helpers.ts` - Uses tRPC directly
- `src/helpers/ipc/context-exposer.ts` - Removed window context
- `src/main.ts` - Removed window type definitions

The refactoring is now complete! Window management is fully converted to tRPC with no remaining IPC dependencies.
