import { ipcMain } from "electron";
import Store from "electron-store";
import activeWin from "active-win";
import {
  WIN_GET_ACTIVE_CHANNEL,
  WIN_START_TRACKING_CHANNEL,
  WIN_STOP_TRACKING_CHANNEL,
  WIN_CLEAR_ACTIVITY_DATA_CHANNEL,
  WIN_GET_TRACKING_STATE_CHANNEL,
} from "../helpers/ipc/window/window-channels";
import { ActivityRecord } from "@/types/activity";

export class ActivityTracker {
  private interval: NodeJS.Timeout | null = null;

  private readonly STORAGE_KEY = "window-activity-data";
  private readonly TRACKING_STATE_KEY = "tracking-enabled";
  private store: Store;

  constructor() {
    console.log("ActivityTracker: Initializing");
    this.store = new Store();
  }

  public setupIPC() {
    console.log("ActivityTracker: Setting up IPC handlers");

    // Check if tracking was enabled in previous session
    const wasTracking = this.store.get(this.TRACKING_STATE_KEY, false) as boolean;
    if (wasTracking) {
      console.log("ActivityTracker: Auto-starting tracking from previous session");
      this.startTracking();
    }

    // Handle requests for current active window
    ipcMain.handle(WIN_GET_ACTIVE_CHANNEL, async () => {
      console.log("ActivityTracker: Handling get-active-window");
      try {
        const result = this.getAllActivityData();
        console.log("ActivityTracker: Active window result:", result);
        return result;
      } catch (error) {
        console.error("ActivityTracker: Error getting active window:", error);
        return null;
      }
    });

    // Get tracking state
    ipcMain.handle(WIN_GET_TRACKING_STATE_CHANNEL, () => {
      console.log("ActivityTracker: Handling get-tracking-state");
      return this.getTrackingState();
    });

    // Start tracking
    ipcMain.handle(WIN_START_TRACKING_CHANNEL, () => {
      console.log("ActivityTracker: Handling start-tracking");
      return this.startTracking();
    });

    // Stop tracking
    ipcMain.handle(WIN_STOP_TRACKING_CHANNEL, () => {
      console.log("ActivityTracker: Handling stop-tracking");
      return this.stopTracking();
    });

    ipcMain.handle(WIN_CLEAR_ACTIVITY_DATA_CHANNEL, () => {
      console.log("ActivityTracker: Handling clear-activity-data");
      return this.clearActivityData();
    });
  }

  private getTrackingState(): boolean {
    return this.store.get(this.TRACKING_STATE_KEY, false) as boolean;
  }

  private startTracking(): boolean {
    console.log("ActivityTracker: Starting tracking");
    if (this.interval) {
      console.log("ActivityTracker: Already tracking");
      return false;
    }

    this.store.set(this.TRACKING_STATE_KEY, true);
    this.interval = setInterval(async () => {
      try {
        const result = await activeWin();
        if (result) {
          if (result.platform === "macos") {
            console.log(
              `ActivityTracker: Active window - ${result.title} (Bundle ID: ${result.owner.bundleId})`
            );
          } else {
            console.log(
              `ActivityTracker: Active window - ${result.title} (Path: ${result.owner.path})`
            );
          }

          const activityRecord: ActivityRecord = {
            ...result,
            timestamp: Date.now(),
          };
          this.saveActivityRecord(activityRecord);
        }
      } catch (error) {
        console.error("ActivityTracker: Error tracking window:", error);
      }
    }, 3000);

    return true;
  }

  public stopTracking(): boolean {
    console.log("ActivityTracker: Stopping tracking");
    if (!this.interval) {
      console.log("ActivityTracker: Not tracking");
      return false;
    }

    clearInterval(this.interval);
    this.interval = null;
    this.store.set(this.TRACKING_STATE_KEY, false);
    return true;
  }

  private saveActivityRecord(record: ActivityRecord): void {
    try {
      const activities = this.store.get(this.STORAGE_KEY, []) as ActivityRecord[];
      activities.push(record);
      this.store.set(this.STORAGE_KEY, activities);
    } catch (error) {
      console.error("ActivityTracker: Error saving activity record:", error);
    }
  }

  private clearActivityData(): boolean {
    try {
      this.store.set(this.STORAGE_KEY, []);
      return true;
    } catch (error) {
      console.error("ActivityTracker: Error clearing activity data:", error);
      return false;
    }
  }

  private getAllActivityData(): ActivityRecord[] {
    return this.store.get(this.STORAGE_KEY, []) as ActivityRecord[];
  }
}
