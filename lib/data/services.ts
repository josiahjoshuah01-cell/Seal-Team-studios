import { createClient } from "@/lib/supabase/server";

export async function getActiveServices() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, price, duration_minutes")
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export type Service = Awaited<ReturnType<typeof getActiveServices>>[number];
