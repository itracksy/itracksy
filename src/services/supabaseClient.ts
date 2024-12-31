import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env";
import { TypedSupabaseClient } from "@/types/supabase";

export const supabase: TypedSupabaseClient = createClient(config.supabaseUrl, config.supabaseKey);
