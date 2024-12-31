import { Database } from '@/lib/schema'
import { SupabaseClient } from '@supabase/supabase-js'

export type Tables = Database['public']['Tables']
export type TypedSupabaseClient = SupabaseClient<Database>

// Base table row types
export type Board = Tables['boards']['Row']
export type Column = Tables['columns']['Row']
export type Item = Tables['items']['Row']
export type Client = Tables['clients']['Row']
export type Invoice = Tables['invoices']['Row']
export type TimeEntry = Tables['time_entries']['Row']
export type WindowTracking = Tables['window_tracking']['Row']

// Extended types for nested relationships
export type BoardWithRelations = Board & {
  columns: Column[]
  items: Item[]
}

// Table insert types
export type BoardInsert = Tables['boards']['Insert']
export type ColumnInsert = Tables['columns']['Insert']
export type ItemInsert = Tables['items']['Insert']
export type ClientInsert = Tables['clients']['Insert']
export type InvoiceInsert = Tables['invoices']['Insert']
export type TimeEntryInsert = Tables['time_entries']['Insert']
export type WindowTrackingInsert = Tables['window_tracking']['Insert']

// Table update types
export type BoardUpdate = Tables['boards']['Update']
export type ColumnUpdate = Tables['columns']['Update']
export type ItemUpdate = Tables['items']['Update']
export type ClientUpdate = Tables['clients']['Update']
export type InvoiceUpdate = Tables['invoices']['Update']
export type TimeEntryUpdate = Tables['time_entries']['Update']
export type WindowTrackingUpdate = Tables['window_tracking']['Update']
