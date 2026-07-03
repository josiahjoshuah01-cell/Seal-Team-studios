import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/utils/time";

export async function getOpenAvailability() {
  const supabase = await createClient();
  const today = todayDateString();

  const { data, error } = await supabase
    .from("availability")
    .select("id, date, start_time, end_time")
    .eq("is_booked", false)
    .gte("date", today)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export type OpenSlot = Awaited<ReturnType<typeof getOpenAvailability>>[number];
