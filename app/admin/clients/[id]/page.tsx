import { notFound } from "next/navigation";
import { getClient, deleteClient } from "@/lib/admin/actions/clients";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ClientForm } from "@/components/admin/client-form";
import { DeleteButton } from "@/components/admin/delete-button";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const client = await getClient(id);
  return { title: client ? `Edit ${client.name}` : "Client" };
}

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) notFound();

  return (
    <div>
      <AdminPageHeader title={client.name} description="Edit client details." />
      <ClientForm
        client={{
          ...client,
          id,
          phone: client.phone ?? undefined,
          notes: client.notes ?? undefined,
        }}
      />
      <div className="mt-8 border-t border-border pt-6">
        <DeleteButton
          label="Client"
          redirectTo="/admin/clients"
          onDelete={() => deleteClient(id)}
        />
      </div>
    </div>
  );
}
