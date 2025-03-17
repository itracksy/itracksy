import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { getDatabasePath } from "../../utils/paths";
import * as schema from "./schema";

const client = createClient({
  url: getDatabasePath(),
  authToken: "",
});
const db = drizzle(client, { schema });

export default db;
export type Database = typeof db;
