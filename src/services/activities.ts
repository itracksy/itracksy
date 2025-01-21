import { WindowTrackingInsert } from "@/types/supabase";
import { supabase } from "@/lib/supabase";

export async function syncActivities(activities: WindowTrackingInsert[]) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { error } = await supabase.from("window_tracking").insert(
    activities.map((activity) => ({
      ...activity,
      user_id: user.id,
    }))
  );

  if (error) throw error;
  return { success: true };
}

export async function getActivities(date: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  // Convert date string to start/end timestamps
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("window_tracking")
    .select("*")
    .eq("user_id", user.id)
    .gte("timestamp", startOfDay.toISOString())
    .lte("timestamp", endOfDay.toISOString())
    .order("timestamp", { ascending: false });

  if (error) throw error;
  return data;
}
