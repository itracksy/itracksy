import { app } from "electron";
import path from "path";

export const getDatabasePath = () => {
  // In development
  if (process.env.NODE_ENV === "development") {
    return "file:local.db";
  }
  
  // In production, store in user data directory
  return `file:${path.join(app.getPath("userData"), "local.db")}`;
};
