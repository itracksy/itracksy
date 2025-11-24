import { app } from "electron";
import path from "path";
import os from "os";

export const getDatabasePath = () => {
  // In development (not packaged), use local.db in project root
  if (!app.isPackaged) {
    return "file:local.db";
  }

  // In production (packaged), store in user data directory
  // Handle case where this is called before app.whenReady()
  try {
    if (app.isReady()) {
      return `file:${path.join(app.getPath("userData"), "local.db")}`;
    } else {
      // If app is not ready yet, use a temporary path
      // This will be replaced once the app initializes properly
      const tempPath = path.join(os.tmpdir(), "itracksy-temp", "local.db");
      console.warn("App not ready, using temporary database path:", tempPath);
      return `file:${tempPath}`;
    }
  } catch (error) {
    // Fallback to temp directory if there's any error
    const tempPath = path.join(os.tmpdir(), "itracksy-temp", "local.db");
    console.error("Error getting userData path, using temp:", error);
    return `file:${tempPath}`;
  }
};
