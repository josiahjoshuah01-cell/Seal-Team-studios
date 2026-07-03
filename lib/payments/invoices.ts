import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePortalClientId } from "@/lib/portal/client";
import { notifyPaymentReceipt } from "@/lib/emails/notify";

export async function verifyInvoicePaymentAccess(invoiceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Unauthorized", status: 401 };
  }

  const admin = createAdminClient();
  const { data: invoice, error } = await admin
    .from("invoices")
    .select("id, client_id, amount, currency, status")
    .eq("id", invoiceId)
    .single();

  if (error || !invoice) {
    return { ok: false as const, error: "Invoice not found", status: 404 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    const clientId = await resolvePortalClientId(user);
    if (!clientId || invoice.client_id !== clientId) {
      return { ok: false as const, error: "Forbidden", status: 403 };
    }
  }

  if (invoice.status !== "pending") {
    return {
      ok: false as const,
      error: "This invoice is no longer payable",
      status: 409,
    };
  }

  return { ok: true as const, invoice, user };
}

export async function markInvoicePaid({
  invoiceId,
  paymentMethod,
  paymentReference,
}: {
  invoiceId: string;
  paymentMethod: "paypal" | "mpesa" | "manual";
  paymentReference?: string | null;
}) {
  const admin = createAdminClient();

  const { data: invoice, error: fetchError } = await admin
    .from("invoices")
    .select("id, status")
    .eq("id", invoiceId)
    .single();

  if (fetchError || !invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.status !== "pending") {
    throw new Error("Invoice is no longer pending");
  }

  const { error } = await admin
    .from("invoices")
    .update({
      status: "paid",
      payment_method: paymentMethod,
      payment_reference: paymentReference ?? null,
    })
    .eq("id", invoiceId)
    .eq("status", "pending");

  if (error) throw error;

  void notifyPaymentReceipt(invoiceId);
}

export async function markInvoiceFailed(invoiceId: string) {
  const admin = createAdminClient();

  const { error } = await admin
    .from("invoices")
    .update({ status: "failed" })
    .eq("id", invoiceId)
    .eq("status", "pending");

  if (error) throw error;
}
