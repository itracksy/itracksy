/**
 * IPC Type Definitions
 *
 * Central type definitions for IPC communication between main and renderer processes.
 */

// Re-export session pause state from its existing location
export { SessionPauseState } from "@/helpers/ipc/session-pause/session-pause-context";

/**
 * Time entry data structure for clock updates
 */
export interface TimeEntry {
  id: string;
  isFocusMode: boolean | null;
  startTime: number;
  endTime?: number | null;
  targetDuration: number | null;
  description: string | null;
}

/**
 * Focus target configuration
 */
export interface FocusTarget {
  id: string;
  userId: string;
  targetMinutes: number;
  enableReminders: boolean;
  reminderIntervalMinutes: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Daily focus progress data
 */
export interface DailyProgress {
  targetMinutes: number;
  completedMinutes: number;
  progressPercentage: number;
  remainingMinutes: number;
  isCompleted: boolean;
  sessionsToday: number;
}

/**
 * Clock control action types
 */
export type ClockControlAction = "start" | "pause" | "stop" | "resume" | "refresh";

/**
 * Clock control action data
 */
export interface ClockControlData {
  isFocusMode?: boolean;
  targetDuration?: number;
  description?: string;
}

/**
 * Data sent to clock window for updates
 */
export interface ClockUpdateData {
  activeEntry: TimeEntry | null;
  action?: ClockControlAction;
  timestamp?: number;
  elapsedSeconds?: number;
  focusTarget?: FocusTarget | null;
  dailyProgress?: DailyProgress | null;
  isPaused?: boolean;
  isManuallyPaused?: boolean;
  pausedAt?: number | null;
  currentTime?: number;
}

/**
 * Notification action definition (for renderer)
 */
export interface NotificationAction {
  label: string;
  action: () => Promise<void>;
  variant?: "primary" | "secondary" | "success" | "warning";
}

/**
 * Notification data sent to notification window
 */
export interface NotificationData {
  title: string;
  body: string;
  autoDismiss?: boolean;
  actions?: NotificationAction[];
  sessionEndTime?: number;
}

/**
 * Blocking notification data
 */
export interface BlockingNotificationData {
  title: string;
  detail: string;
  userId: string;
  timeEntryId: string;
  appOrDomain: string;
  appName?: string;
  domain?: string;
  ruleId?: string;
  ruleName?: string;
}

/**
 * Clock window state from main process
 */
export interface ClockWindowState {
  isPinned: boolean;
  sizeMode: "detailed" | "minimal";
}

/**
 * Clock window API exposed to renderer
 */
export interface ElectronClockAPI {
  control: (action: string, data?: ClockControlData) => Promise<unknown>;
  hide: () => Promise<unknown>;
  show: () => Promise<unknown>;
  showMain: () => Promise<unknown>;
  onUpdate: (callback: (data: ClockUpdateData) => void) => void;
  onShow: (callback: () => void) => void;
  removeAllListeners: () => void;
  togglePin: () => Promise<ClockWindowState>;
  getState: () => Promise<ClockWindowState>;
  setSizeMode: (mode: "detailed" | "minimal") => Promise<unknown>;
  setContentSize: (payload: {
    width: number;
    height: number;
    mode: "detailed" | "minimal";
  }) => Promise<unknown>;
}

/**
 * Notification window API exposed to renderer
 */
export interface ElectronNotificationAPI {
  close: () => Promise<void>;
  action: () => void;
  extendSession: (minutesToAdd: number) => Promise<unknown>;
  notifyReady: () => void;
  onNotification: (callback: (data: NotificationData) => void) => void;
}

/**
 * Blocking notification window API exposed to renderer
 */
export interface ElectronBlockingNotificationAPI {
  respond: (response: number) => Promise<unknown>;
  close: () => Promise<unknown>;
  openMainWindow: (route?: string) => Promise<unknown>;
  onNotification: (callback: (data: BlockingNotificationData) => void) => void;
}

/**
 * Navigation API exposed to renderer
 */
export interface ElectronNavigationAPI {
  onNavigateTo: (callback: (route: string) => void) => () => void;
}

/**
 * Session pause API exposed to renderer
 */
export interface ElectronSessionPauseAPI {
  onPauseStateChange: (
    callback: (
      state: import("@/helpers/ipc/session-pause/session-pause-context").SessionPauseState
    ) => void
  ) => void;
  removePauseStateListener: () => void;
}

/**
 * Permission error data from main process
 */
export interface PermissionErrorData {
  type: "screen-recording" | "accessibility";
  message: string;
  timestamp: number;
}

/**
 * Permission API exposed to renderer
 */
export interface ElectronPermissionAPI {
  onPermissionError: (callback: (data: PermissionErrorData) => void) => () => void;
}
