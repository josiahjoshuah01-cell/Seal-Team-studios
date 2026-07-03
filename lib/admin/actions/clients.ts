"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { clientSchema, type ClientInput } from "@/lib/validations/admin";
import { logError } from "@/lib/logger";

export async function getClients() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, phone, notes, profile_id, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getClient(id: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, phone, notes, profile_id")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createClient(input: ClientInput) {
  try {
    const parsed = clientSchema.parse(input);
    const { supabase } = await requireAdmin();

    const { data, error } = await supabase
      .from("clients")
      .insert({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone || null,
        notes: parsed.notes || null,
        profile_id: parsed.profile_id || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath("/admin/clients");
    return { success: true, id: data.id };
  } catch (err) {
    await logError("admin_clients", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to create client" };
  }
}

export async function updateClient(id: string, input: ClientInput) {
  try {
    const parsed = clientSchema.parse(input);
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from("clients")
      .update({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone || null,
        notes: parsed.notes || null,
        profile_id: parsed.profile_id || null,
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${id}`);
    return { success: true };
  } catch (err) {
    await logError("admin_clients", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update client" };
  }
}

export async function deleteClient(id: string) {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/clients");
    return { success: true };
  } catch (err) {
    await logError("admin_clients", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete client" };
  }
}
