import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

const client = createClient({
  url: "file:local.db"
});
const db = drizzle(client);

export default db;
