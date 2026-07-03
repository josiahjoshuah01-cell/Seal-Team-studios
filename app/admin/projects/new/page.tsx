import { getClientsForSelect } from "@/lib/admin/actions/projects";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/project-form";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const clients = await getClientsForSelect();

  return (
    <div>
      <AdminPageHeader title="New project" description="Create a project for a client." />
      {clients.length === 0 ? (
        <p className="text-muted-foreground">
          Add a client first before creating a project.
        </p>
      ) : (
        <ProjectForm clients={clients} />
      )}
    </div>
  );
}
