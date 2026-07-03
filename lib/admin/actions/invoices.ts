"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { logError } from "@/lib/logger";
import { notifyInvoiceCreated, notifyPaymentReceipt } from "@/lib/emails/notify";
import {
  invoiceSchema,
  invoiceStatusSchema,
  type InvoiceInput,
} from "@/lib/validations/invoices";

export type AdminInvoice = {
  id: string;
  client_id: string | null;
  client_name: string;
  project_id: string | null;
  project_title: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  payment_method: "paypal" | "mpesa" | "manual" | null;
  payment_reference: string | null;
  description: string | null;
  created_at: string;
};

async function enrichInvoices(
  invoices: Array<{
    id: string;
    client_id: string | null;
    project_id: string | null;
    amount: number;
    currency: string;
    status: AdminInvoice["status"];
    payment_method: AdminInvoice["payment_method"];
    payment_reference: string | null;
    description: string | null;
    created_at: string;
  }>,
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"]
): Promise<AdminInvoice[]> {
  const clientIds = [
    ...new Set(invoices.map((i) => i.client_id).filter(Boolean)),
  ] as string[];
  const projectIds = [
    ...new Set(invoices.map((i) => i.project_id).filter(Boolean)),
  ] as string[];

  const [clientsRes, projectsRes] = await Promise.all([
    clientIds.length
      ? supabase.from("clients").select("id, name").in("id", clientIds)
      : Promise.resolve({ data: [] }),
    projectIds.length
      ? supabase.from("projects").select("id, title").in("id", projectIds)
      : Promise.resolve({ data: [] }),
  ]);

  const clientMap = new Map(
    (clientsRes.data ?? []).map((c) => [c.id, c.name])
  );
  const projectMap = new Map(
    (projectsRes.data ?? []).map((p) => [p.id, p.title])
  );

  return invoices.map((invoice) => ({
    ...invoice,
    client_name: invoice.client_id
      ? clientMap.get(invoice.client_id) ?? "—"
      : "—",
    project_title: invoice.project_id
      ? projectMap.get(invoice.project_id) ?? "—"
      : "—",
  }));
}

export async function getInvoices(status?: string) {
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("invoices")
    .select(
      "id, client_id, project_id, amount, currency, status, payment_method, payment_reference, description, created_at"
    )
    .order("created_at", { ascending: false });

  if (status && invoiceStatusSchema.safeParse(status).success) {
    query = query.eq("status", status as AdminInvoice["status"]);
  }

  const { data, error } = await query;
  if (error) throw error;

  return enrichInvoices(data ?? [], supabase);
}

export async function getInvoicesForProject(projectId: string) {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, client_id, project_id, amount, currency, status, payment_method, payment_reference, description, created_at"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return enrichInvoices(data ?? [], supabase);
}

export async function createInvoice(input: InvoiceInput) {
  try {
    const parsed = invoiceSchema.parse(input);
    const { supabase } = await requireAdmin();

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        client_id: parsed.client_id,
        project_id: parsed.project_id || null,
        amount: parsed.amount,
        currency: parsed.currency,
        description: parsed.description || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;

    void notifyInvoiceCreated(data.id);

    revalidatePath("/admin/invoices");
    if (parsed.project_id) {
      revalidatePath(`/admin/projects/${parsed.project_id}`);
    }
    revalidatePath("/portal/invoices");

    return { success: true, id: data.id };
  } catch (err) {
    await logError("admin_invoices_create", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create invoice",
    };
  }
}

export async function markInvoicePaidManually(id: string) {
  try {
    const { supabase } = await requireAdmin();

    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("id, status, project_id")
      .eq("id", id)
      .single();

    if (fetchError || !invoice) {
      return { success: false, error: "Invoice not found" };
    }

    if (invoice.status !== "pending") {
      return { success: false, error: "Only pending invoices can be marked paid" };
    }

    const { error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        payment_method: "manual",
        payment_reference: null,
      })
      .eq("id", id);

    if (error) throw error;

    void notifyPaymentReceipt(id);

    revalidatePath("/admin/invoices");
    if (invoice.project_id) {
      revalidatePath(`/admin/projects/${invoice.project_id}`);
    }
    revalidatePath("/portal/invoices");

    return { success: true };
  } catch (err) {
    await logError("admin_invoices_mark_paid", err, { id });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to mark invoice paid",
    };
  }
}

export async function createDepositInvoice({
  clientId,
  projectId,
  amount,
  description,
}: {
  clientId: string;
  projectId: string;
  amount: number;
  description?: string;
}) {
  return createInvoice({
    client_id: clientId,
    project_id: projectId,
    amount,
    currency: "KES",
    description: description ?? "Booking deposit",
  });
}
