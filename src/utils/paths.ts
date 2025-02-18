import { app } from "electron";
import path from "path";

export const getDatabasePath = () => {
  // In development
  if (app && app.isPackaged) {
    // In production, store in user data directory
    return `file:${path.join(app.getPath("userData"), "local.db")}`;
  }

  // In development
  return "file:local.db";
};
