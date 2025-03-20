import { defineConfig } from "drizzle-kit";
import { getDatabasePath } from "./src/utils/paths";

export default defineConfig({
  schema: "./src/api/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: getDatabasePath(),
  },
  // These options make migrations safer
  strict: true,
  verbose: true,
});
