import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";
import { getDatabasePath } from "../../utils/paths";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../../helpers/logger";

async function main() {
  // Log the database path
  const dbPath = getDatabasePath();
  logger.info(`Using database at: ${dbPath}`);

  // Check if file exists
  if (fs.existsSync(dbPath.replace("file:", ""))) {
    logger.info("Database file exists");
  } else {
    logger.warn("Database file does not exist");
  }

  const client = createClient({
    url: dbPath,
  });

  const db = drizzle(client);

  // Check for migration files before migration
  const migrationsDir = path.resolve("drizzle");
  logger.info(`Checking migrations in ${migrationsDir}...`);

  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
    logger.info(`Found ${files.length} migration files:`);
    files.forEach((file) => logger.info(` - ${file}`));
  } else {
    logger.warn(`Migrations directory not found!`);
  }

  // Check for drizzle migrations table
  try {
    const result = await client.execute(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='__drizzle_migrations'
    `);
    logger.info(
      "Drizzle migrations table check:",
      result.rows.length > 0 ? "exists" : "does not exist"
    );

    if (result.rows.length > 0) {
      const migrations = await client.execute(`SELECT * FROM __drizzle_migrations`);
      logger.info("Applied migrations:", migrations.rows);
    }
  } catch (err) {
    logger.error("Error checking migrations table:", err);
  }

  logger.info("\nRunning migrations...");

  await migrate(db, {
    migrationsFolder: "drizzle",
  });

  // Verify after migration
  try {
    const migrationsAfter = await client.execute(`SELECT * FROM __drizzle_migrations`);
    console.log("\nApplied migrations after running migrate:", migrationsAfter.rows);

    // Check tables to verify they exist
    logger.info("\nVerifying tables after migration:");

    // Check if activity_rules table exists
    const activityRulesTable = await client.execute(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='activity_rules'
    `);
    logger.info(
      "activity_rules table:",
      activityRulesTable.rows.length > 0 ? "✓ exists" : "⚠ does not exist"
    );

    // Check if activities table has rating column
    if (activityRulesTable.rows.length > 0) {
      const activityRatingColumn = await client.execute(`
        PRAGMA table_info(activities)
      `);
      const hasRatingColumn = activityRatingColumn.rows.some((row: any) => row.name === "rating");
      logger.info("activities.rating column:", hasRatingColumn ? "✓ exists" : "⚠ does not exist");
    }
  } catch (err) {
    logger.error("Error verifying migration results:", err);
  }

  logger.info("Migrations completed!");

  client.close();
}

main().catch((err) => {
  logger.error("Migration failed!");
  logger.error(err);
  process.exit(1);
});
