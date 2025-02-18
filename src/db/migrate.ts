import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { getDatabasePath } from "../utils/paths";

const client = createClient({
  url: getDatabasePath(),
});
const db = drizzle(client);

// this will automatically run needed migrations on the database
migrate(db, { migrationsFolder: "./drizzle" });
