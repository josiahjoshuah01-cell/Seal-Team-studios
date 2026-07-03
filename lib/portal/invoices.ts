import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedPortalClientId } from "@/lib/portal/client";

export type PortalInvoice = {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  payment_method: "paypal" | "mpesa" | "manual" | null;
  payment_reference: string | null;
  description: string | null;
  created_at: string;
  project_title: string | null;
};

export async function getPortalInvoices() {
  const clientId = await getAuthenticatedPortalClientId();
  if (!clientId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, amount, currency, status, payment_method, payment_reference, description, created_at, project_id"
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const projectIds = [
    ...new Set((data ?? []).map((i) => i.project_id).filter(Boolean)),
  ] as string[];

  let projectMap = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, title")
      .in("id", projectIds);
    projectMap = new Map((projects ?? []).map((p) => [p.id, p.title]));
  }

  return (data ?? []).map((invoice) => ({
    id: invoice.id,
    amount: Number(invoice.amount),
    currency: invoice.currency,
    status: invoice.status,
    payment_method: invoice.payment_method,
    payment_reference: invoice.payment_reference,
    description: invoice.description,
    created_at: invoice.created_at,
    project_title: invoice.project_id
      ? projectMap.get(invoice.project_id) ?? null
      : null,
  })) satisfies PortalInvoice[];
}

export async function getPortalInvoiceStatus(invoiceId: string) {
  const clientId = await getAuthenticatedPortalClientId();
  if (!clientId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("id", invoiceId)
    .eq("client_id", clientId)
    .single();

  if (error) return null;
  return data;
}
