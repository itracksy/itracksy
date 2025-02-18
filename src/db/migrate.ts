import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const client = createClient({
  url: "file:local.db",
});
const db = drizzle(client);

// this will automatically run needed migrations on the database
migrate(db, { migrationsFolder: "./drizzle" });
