import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { getDatabasePath } from "../../utils/paths";
import * as schema from "./schema";

const client = createClient({
  url: getDatabasePath(),
  authToken: "",
  syncUrl: "https://api.libsql.com/v1/sync",
});
const db = drizzle(client, { schema });

export default db;
export type Database = typeof db;
