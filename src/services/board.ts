import { Board, BoardInsert, BoardWithRelations, ColumnInsert, ItemInsert } from "@/types/supabase";
import { supabase } from "./supabaseClient";

export async function getBoard(id: string): Promise<BoardWithRelations> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("*, columns(*), items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (boardError) throw boardError;
  return board;
}

export async function getBoards(): Promise<Board[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { data: boards, error } = await supabase
    .from("boards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return boards;
}

export async function createBoard(board: Omit<BoardInsert, "user_id">): Promise<Board> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { data, error } = await supabase
    .from("boards")
    .insert({ ...board, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createColumn(column: Omit<ColumnInsert, "user_id">) {
  return await supabase.from("columns").insert(column).select().single();
}

export async function updateColumn(id: string, column: Partial<ColumnInsert>) {
  return await supabase.from("columns").update(column).eq("id", id);
}

export async function deleteColumn(id: string) {
  return await supabase.from("columns").delete().eq("id", id);
}

export async function createItem(item: Omit<ItemInsert, "user_id">) {
  return await supabase.from("items").insert(item).select().single();
}

export async function updateItem(id: string, item: Partial<ItemInsert>) {
  return await supabase.from("items").update(item).eq("id", id);
}

export async function deleteItem(id: string) {
  return await supabase.from("items").delete().eq("id", id);
}
