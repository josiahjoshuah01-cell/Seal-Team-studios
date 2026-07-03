import { AdminPageHeader } from "@/components/admin/page-header";
import { ClientForm } from "@/components/admin/client-form";

export const metadata = { title: "New client" };

export default function NewClientPage() {
  return (
    <div>
      <AdminPageHeader title="New client" description="Add a client record." />
      <ClientForm />
    </div>
  );
}
