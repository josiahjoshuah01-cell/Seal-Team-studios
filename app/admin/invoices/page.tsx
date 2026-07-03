import { Suspense } from "react";
import { getInvoices } from "@/lib/admin/actions/invoices";
import { AdminPageHeader } from "@/components/admin/page-header";
import { InvoiceStatusFilter } from "@/components/admin/invoice-status-filter";
import { AdminInvoicesTable } from "@/components/admin/admin-invoices-table";

export const metadata = { title: "Invoices" };

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminInvoicesPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const invoices = await getInvoices(status);

  return (
    <div>
      <AdminPageHeader
        title="Invoices"
        description="Track deposits, balances, and payment status across all projects."
      />

      <Suspense fallback={null}>
        <InvoiceStatusFilter />
      </Suspense>

      <AdminInvoicesTable invoices={invoices} />
    </div>
  );
}
