/**
 * Global Window Interface Augmentation
 *
 * Extends the Window interface with typed Electron APIs exposed via preload scripts.
 */

import type {
  ElectronClockAPI,
  ElectronNotificationAPI,
  ElectronBlockingNotificationAPI,
  ElectronNavigationAPI,
  ElectronSessionPauseAPI,
} from "./ipc";

declare global {
  interface Window {
    /**
     * Router instance for navigation from main process
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __ITRACKSY_ROUTER__?: any;

    /**
     * Clock window API (exposed in clock preload)
     */
    electronClock?: ElectronClockAPI;

    /**
     * Notification window API (exposed in notification preload)
     */
    electronNotification?: ElectronNotificationAPI;

    /**
     * Blocking notification window API (exposed in blocking-notification preload)
     */
    electronBlockingNotification?: ElectronBlockingNotificationAPI;

    /**
     * Navigation API (exposed in main preload)
     */
    electronNavigation?: ElectronNavigationAPI;

    /**
     * Session pause API (exposed in main preload)
     */
    electronSessionPause?: ElectronSessionPauseAPI;
  }
}

export {};
