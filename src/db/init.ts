import { migrate } from "drizzle-orm/libsql/migrator";
import fs from "fs";
import path from "path";
import { getDatabasePath } from "../utils/paths";
import db from ".";

export const initializeDatabase = async () => {
  const dbPath = getDatabasePath().replace("file:", "");
  const dbDir = path.dirname(dbPath);

  // Create database directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create empty database file if it doesn't exist
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, "");
  }

  try {
    // Run migrations
    await migrate(db, { migrationsFolder: "./drizzle" });
  } catch (error) {
    console.error("Failed to run migrations:", error);
    throw error;
  }
};
