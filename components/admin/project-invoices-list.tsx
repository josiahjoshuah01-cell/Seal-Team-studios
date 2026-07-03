"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { markInvoicePaidManually } from "@/lib/admin/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { AdminInvoice } from "@/lib/admin/actions/invoices";

export function ProjectInvoicesList({ invoices }: { invoices: AdminInvoice[] }) {
  const router = useRouter();

  async function handleMarkPaid(id: string) {
    if (!confirm("Mark this invoice as paid manually?")) return;

    const result = await markInvoicePaidManually(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update invoice");
      return;
    }

    toast.success("Invoice marked as paid");
    router.refresh();
  }

  if (invoices.length === 0) {
    return <p className="text-sm text-muted-foreground">No invoices yet.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {invoices.map((invoice) => (
        <li
          key={invoice.id}
          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium text-foreground">
              {formatCurrency(invoice.amount, invoice.currency)}
            </p>
            {invoice.description && (
              <p className="text-sm text-muted-foreground">{invoice.description}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(invoice.created_at)}
              {invoice.payment_method ? ` · ${invoice.payment_method}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={invoice.status} />
            {invoice.status === "pending" && (
              <button
                type="button"
                onClick={() => handleMarkPaid(invoice.id)}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Mark paid
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({
  status,
}: {
  status: AdminInvoice["status"];
}) {
  const styles = {
    pending: "bg-muted text-muted-foreground",
    paid: "bg-accent/15 text-accent-foreground",
    failed: "border border-border text-destructive",
    refunded: "border border-border text-muted-foreground",
  } as const;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}
