import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";
import { getDatabasePath } from "../../utils/paths";
import * as fs from "fs";

async function main() {
  // Log the database path
  const dbPath = getDatabasePath();
  console.log(`Using database at: ${dbPath}`);

  // Check if file exists
  if (fs.existsSync(dbPath.replace("file:", ""))) {
    console.log("Database file exists");
  } else {
    console.log("Database file does not exist");
  }

  const client = createClient({
    url: dbPath,
  });

  const db = drizzle(client);

  // Check for drizzle migrations table
  try {
    const result = await client.execute(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='__drizzle_migrations'
    `);
    console.log(
      "Drizzle migrations table check:",
      result.rows.length > 0 ? "exists" : "does not exist"
    );

    if (result.rows.length > 0) {
      const migrations = await client.execute(`SELECT * FROM __drizzle_migrations`);
      console.log("Applied migrations:", migrations.rows);
    }
  } catch (err) {
    console.log("Error checking migrations table:", err);
  }

  console.log("Running migrations...");

  await migrate(db, {
    migrationsFolder: "drizzle",
  });

  console.log("Migrations completed!");

  client.close();
}

main().catch((err) => {
  console.error("Migration failed!");
  console.error(err);
  process.exit(1);
});
