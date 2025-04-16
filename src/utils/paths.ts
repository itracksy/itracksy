import { app } from "electron";
import path from "path";

export const getDatabasePath = () => {
  if (process.env.NODE_ENV === "development") {
    // In development
    return "file:local.db";
  }

  // In production, store in user data directory
  return `file:${path.join(app.getPath("userData"), "local.db")}`;
};
