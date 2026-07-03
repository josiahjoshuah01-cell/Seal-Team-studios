"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { markInvoicePaidManually } from "@/lib/admin/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { AdminInvoice } from "@/lib/admin/actions/invoices";

export function AdminInvoicesTable({ invoices }: { invoices: AdminInvoice[] }) {
  const router = useRouter();

  async function handleMarkPaid(id: string) {
    if (!confirm("Mark this invoice as paid manually (cash/bank transfer)?")) return;

    const result = await markInvoicePaidManually(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update invoice");
      return;
    }

    toast.success("Invoice marked as paid");
    router.refresh();
  }

  if (invoices.length === 0) {
    return <p className="text-muted-foreground">No invoices found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-foreground">Client</th>
            <th className="px-4 py-3 text-left font-medium text-foreground">Project</th>
            <th className="px-4 py-3 text-left font-medium text-foreground">Amount</th>
            <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
            <th className="px-4 py-3 text-left font-medium text-foreground">Date</th>
            <th className="px-4 py-3 text-left font-medium text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                {invoice.client_id ? (
                  <Link
                    href={`/admin/clients/${invoice.client_id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {invoice.client_name}
                  </Link>
                ) : (
                  invoice.client_name
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {invoice.project_id ? (
                  <Link
                    href={`/admin/projects/${invoice.project_id}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {invoice.project_title}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-foreground">
                {formatCurrency(invoice.amount, invoice.currency)}
                {invoice.description && (
                  <p className="text-xs text-muted-foreground">{invoice.description}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={invoice.status} />
                {invoice.payment_method && (
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    {invoice.payment_method}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(invoice.created_at)}
              </td>
              <td className="px-4 py-3">
                {invoice.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => handleMarkPaid(invoice.id)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Mark paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: AdminInvoice["status"] }) {
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
