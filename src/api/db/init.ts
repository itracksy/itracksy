import { migrate } from "drizzle-orm/libsql/migrator";
import fs from "fs";
import path from "path";
import { app } from "electron";
import { getDatabasePath } from "../../utils/paths";
import db from ".";
import { logger } from "../../helpers/logger";

const initDb = async () => {
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

  // Get migrations path based on environment
  const migrationsPath = app.isPackaged
    ? path.join(process.resourcesPath, "drizzle")
    : path.join(app.getAppPath(), "drizzle");

  logger.info("Migrations folder path:", migrationsPath);

  // Run migrations
  await migrate(db, { migrationsFolder: migrationsPath });
  logger.info("Database migrations completed successfully");
};

export const initializeDatabase = async () => {
  try {
    await initDb();
  } catch (error) {
    logger.fatal("Failed to initialize database:", error);
    // Log additional error details if available
    if (error instanceof Error) {
      logger.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    // Try to recover by renaming the old database and creating a new one
    try {
      const dbPath = getDatabasePath().replace("file:", "");
      if (fs.existsSync(dbPath)) {
        const appVersion = app.getVersion();
        const backupPath = `${dbPath}.${appVersion}.backup`;
        logger.info(`Renaming old database to: ${backupPath}`);
        fs.renameSync(dbPath, backupPath);

        // Try initialization again with a fresh database
        logger.info("Attempting to initialize fresh database...");
        await initDb();
        logger.info("Successfully recovered with fresh database");
      } else {
        throw new Error("Database file not found for backup");
      }
    } catch (recoveryError) {
      logger.fatal("Failed to recover database:", recoveryError);
      throw recoveryError;
    }
  }
};
