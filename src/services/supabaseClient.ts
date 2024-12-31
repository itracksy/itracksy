import { createClient } from '@supabase/supabase-js'
import { config } from '../config/env'

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)
