import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import { getDatabasePath } from "../../utils/paths";
import * as schema from "./schema";

let client: Client | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

/**
 * Initialize the database client and drizzle instance
 * This should only be called after app.whenReady() and initializeDatabase()
 */
export function initializeDbClient() {
  if (!dbInstance) {
    client = createClient({
      url: getDatabasePath(),
      authToken: "",
    });
    dbInstance = drizzle(client, { schema });
  }
  return dbInstance;
}

/**
 * Get the database instance
 * Throws an error if called before initialization
 */
function getDb() {
  if (!dbInstance) {
    throw new Error(
      "Database not initialized. Call initializeDbClient() after app.whenReady() first."
    );
  }
  return dbInstance;
}

// Export a Proxy that checks initialization on every access
const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const instance = getDb();
    return (instance as any)[prop];
  },
});

export default db;
export type Database = ReturnType<typeof drizzle>;
