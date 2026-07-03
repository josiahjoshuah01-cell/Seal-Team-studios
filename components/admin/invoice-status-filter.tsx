"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { InvoiceStatus } from "@/lib/validations/invoices";

const statuses: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export function InvoiceStatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "all";

  function setStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    const query = params.toString();
    router.push(query ? `/admin/invoices?${query}` : "/admin/invoices");
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status.value}
          type="button"
          onClick={() => setStatus(status.value)}
          className={`rounded-full px-3 py-1 text-sm transition-colors ${
            current === status.value
              ? "bg-accent text-accent-foreground"
              : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}
