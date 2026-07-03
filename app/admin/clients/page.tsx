import Link from "next/link";
import { getClients } from "@/lib/admin/actions/clients";
import { AdminPageHeader } from "@/components/admin/page-header";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Clients" };

export default async function AdminClientsPage() {
  const clients = await getClients();

  return (
    <div>
      <AdminPageHeader
        title="Clients"
        description="Manage client records and portal access."
        action={{ label: "Add client", href: "/admin/clients/new" }}
      />

      {clients.length === 0 ? (
        <p className="text-muted-foreground">No clients yet. Add your first client to get started.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{client.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(client.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
