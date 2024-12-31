import { supabase } from "@/lib/supabase";
import type { TimeEntry, TimeEntryInsert } from "@/types/supabase";

export async function getActiveTimeEntry() {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .is("end_time", null)
    .single();

  if (error) throw error;
  return data;
}

export async function createTimeEntry(timeEntry: Omit<TimeEntryInsert, "user_id">) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  return await supabase
    .from("time_entries")
    .insert({ ...timeEntry, user_id: user.id })
    .select()
    .single();
}

export async function updateTimeEntry(id: string, timeEntry: Partial<TimeEntryInsert>) {
  return await supabase.from("time_entries").update(timeEntry).eq("id", id).select().single();
}

export async function deleteTimeEntry(id: string) {
  return await supabase.from("time_entries").delete().eq("id", id);
}

export async function getTimeEntriesForItem(itemId: string) {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("item_id", itemId)
    .order("start_time", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTimeEntriesForBoard(boardId: string) {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*, items(*)")
    .eq("board_id", boardId)
    .order("start_time", { ascending: false });

  if (error) throw error;
  return data;
}
