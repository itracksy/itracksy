import { createClient } from "@supabase/supabase-js";
import { getConfig } from "@/config/env";
import { Database } from "./schema";

export const supabase = createClient<Database>(getConfig("supabaseUrl"), getConfig("supabaseKey"), {
  auth: {
    persistSession: true,
    storageKey: "itracksy-anonymous-key",
    storage: localStorage,
    autoRefreshToken: true,
  },
});
