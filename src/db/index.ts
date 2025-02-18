import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { getDatabasePath } from "../utils/paths";

const client = createClient({
  url: getDatabasePath(),
});
const db = drizzle(client);

export default db;
