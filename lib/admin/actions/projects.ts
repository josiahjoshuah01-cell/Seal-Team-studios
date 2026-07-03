"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { projectSchema, type ProjectInput } from "@/lib/validations/admin";
import { logError } from "@/lib/logger";

export async function getProjects() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, type, shoot_date, status, client_id, created_at, video_delivery_method, video_delivery_status"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  const clientIds = [...new Set((data ?? []).map((p) => p.client_id).filter(Boolean))] as string[];
  let clientMap = new Map<string, { name: string }>();

  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name")
      .in("id", clientIds);
    clientMap = new Map((clients ?? []).map((c) => [c.id, { name: c.name }]));
  }

  return (data ?? []).map((p) => ({
    ...p,
    client_name: p.client_id ? clientMap.get(p.client_id)?.name ?? "—" : "—",
  }));
}

export async function getProject(id: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, type, shoot_date, status, client_id, booking_id, video_delivery_method, video_delivery_status, video_delivered_at, video_delivery_notes"
    )
    .eq("id", id)
    .single();

  if (error) return null;

  let client: { name: string; phone: string | null } | null = null;
  if (data.client_id) {
    const { data: clientRow } = await supabase
      .from("clients")
      .select("name, phone")
      .eq("id", data.client_id)
      .single();
    client = clientRow;
  }

  return { ...data, client };
}

export async function createProject(input: ProjectInput) {
  try {
    const parsed = projectSchema.parse(input);
    const { supabase } = await requireAdmin();

    const { data, error } = await supabase
      .from("projects")
      .insert({
        client_id: parsed.client_id,
        title: parsed.title,
        type: parsed.type || null,
        shoot_date: parsed.shoot_date ? parsed.shoot_date : null,
        status: parsed.status,
        booking_id: parsed.booking_id || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath("/admin/projects");
    return { success: true, id: data.id };
  } catch (err) {
    await logError("admin_projects", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to create project" };
  }
}

export async function updateProject(id: string, input: ProjectInput) {
  try {
    const parsed = projectSchema.parse(input);
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from("projects")
      .update({
        client_id: parsed.client_id,
        title: parsed.title,
        type: parsed.type || null,
        shoot_date: parsed.shoot_date ? parsed.shoot_date : null,
        status: parsed.status,
        booking_id: parsed.booking_id || null,
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${id}`);
    revalidatePath("/portfolio");
    return { success: true };
  } catch (err) {
    await logError("admin_projects", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update project" };
  }
}

export async function deleteProject(id: string) {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/projects");
    return { success: true };
  } catch (err) {
    await logError("admin_projects", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete project" };
  }
}

export async function getClientsForSelect() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("clients")
    .select("id, name")
    .order("name");
  return data ?? [];
}

export async function updateVideoDelivery(
  projectId: string,
  input: {
    video_delivery_method: "cloudflare" | "whatsapp" | "not_applicable";
    video_delivery_notes?: string;
  }
) {
  try {
    const { supabase } = await requireAdmin();

    const status =
      input.video_delivery_method === "whatsapp" ? "not_sent" : "not_applicable";

    const { error } = await supabase
      .from("projects")
      .update({
        video_delivery_method: input.video_delivery_method,
        video_delivery_status: status,
        video_delivery_notes: input.video_delivery_notes || null,
        video_delivered_at: null,
      })
      .eq("id", projectId);

    if (error) throw error;

    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath("/admin/projects");
    return { success: true };
  } catch (err) {
    await logError("admin_video_delivery", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update delivery settings",
    };
  }
}

export async function markVideoDeliveredViaWhatsApp(
  projectId: string,
  notes?: string
) {
  try {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from("projects")
      .update({
        video_delivery_method: "whatsapp",
        video_delivery_status: "sent",
        video_delivered_at: new Date().toISOString(),
        video_delivery_notes: notes || null,
      })
      .eq("id", projectId);

    if (error) throw error;

    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath("/admin/projects");
    return { success: true };
  } catch (err) {
    await logError("admin_video_delivery", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to mark as sent",
    };
  }
}
