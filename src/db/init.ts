import { migrate } from "drizzle-orm/libsql/migrator";
import fs from "fs";
import path from "path";
import { app } from "electron";
import { getDatabasePath } from "../utils/paths";
import db from ".";
import { logger } from "../helpers/logger";

export const initializeDatabase = async () => {
  try {
    const dbPath = getDatabasePath().replace("file:", "");
    logger.info("Database path:", dbPath);

    const dbDir = path.dirname(dbPath);
    logger.info("Database directory:", dbDir);

    // Create database directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      logger.info("Creating database directory...");
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Create empty database file if it doesn't exist
    if (!fs.existsSync(dbPath)) {
      logger.info("Creating empty database file...");
      fs.writeFileSync(dbPath, "");
    }

    // Verify file permissions
    try {
      const stats = fs.statSync(dbPath);
      logger.info("Database file permissions:", {
        mode: stats.mode.toString(8),
        uid: stats.uid,
        gid: stats.gid,
        readable: stats.mode & fs.constants.S_IRUSR,
        writable: stats.mode & fs.constants.S_IWUSR,
      });
    } catch (error) {
      logger.error("Failed to check file permissions:", error);
    }

    // Get migrations path based on environment
    const migrationsPath = app.isPackaged
      ? path.join(process.resourcesPath, "drizzle")
      : path.join(app.getAppPath(), "drizzle");
    
    logger.info("Migrations folder path:", migrationsPath);
    if (!fs.existsSync(migrationsPath)) {
      logger.error("Migrations folder not found at:", migrationsPath);
      // Try to list parent directory contents
      try {
        const parentDir = path.dirname(migrationsPath);
        logger.info("Parent directory contents:", fs.readdirSync(parentDir));
      } catch (error) {
        logger.error("Failed to list parent directory:", error);
      }
    } else {
      logger.info("Migrations folder contents:", fs.readdirSync(migrationsPath));
    }

    // Run migrations
    await migrate(db, { migrationsFolder: migrationsPath });
    logger.info("Database migrations completed successfully");
  } catch (error) {
    logger.error("Failed to initialize database:", error);
    // Log additional error details if available
    if (error instanceof Error) {
      logger.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
};
