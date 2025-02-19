import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";
import { getDatabasePath } from "../../utils/paths";

async function main() {
  const client = createClient({
    url: getDatabasePath(),
  });

  const db = drizzle(client);

  console.log("Running migrations...");

  await migrate(db, {
    migrationsFolder: "drizzle",
  });

  console.log("Migrations completed!");

  await client.close();
}

main().catch((err) => {
  console.error("Migration failed!");
  console.error(err);
  process.exit(1);
});
