import { notFound } from "next/navigation";
import {
  getProject,
  deleteProject,
  getClientsForSelect,
} from "@/lib/admin/actions/projects";
import { getProjectGalleries } from "@/lib/admin/actions/galleries";
import { getInvoicesForProject } from "@/lib/admin/actions/invoices";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/project-form";
import { ProjectInvoiceForm } from "@/components/admin/project-invoice-form";
import { ProjectInvoicesList } from "@/components/admin/project-invoices-list";
import { VideoDeliveryPanel } from "@/components/admin/video-delivery-panel";
import { DeleteButton } from "@/components/admin/delete-button";

type Props = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const [project, clients, invoices, galleries] = await Promise.all([
    getProject(id),
    getClientsForSelect(),
    getInvoicesForProject(id),
    getProjectGalleries(id),
  ]);

  if (!project) notFound();

  return (
    <div>
      <AdminPageHeader title={project.title} description="Edit project details." />
      <ProjectForm
        clients={clients}
        project={{
          id,
          client_id: project.client_id!,
          title: project.title,
          type: project.type ?? "",
          shoot_date: project.shoot_date ?? "",
          status: project.status,
          booking_id: project.booking_id,
        }}
      />

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-lg font-medium text-foreground">Invoices</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deposit, balance, add-ons, and other charges for this project.
        </p>
        <div className="mt-4">
          <ProjectInvoicesList invoices={invoices} />
        </div>
        {project.client_id && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-foreground">New invoice</h3>
            <div className="mt-3 max-w-lg">
              <ProjectInvoiceForm clientId={project.client_id} projectId={id} />
            </div>
          </div>
        )}
      </section>

      <VideoDeliveryPanel
        projectId={id}
        clientPhone={project.client?.phone}
        galleries={galleries}
        delivery={{
          video_delivery_method:
            project.video_delivery_method ?? "not_applicable",
          video_delivery_status:
            project.video_delivery_status ?? "not_applicable",
          video_delivered_at: project.video_delivered_at ?? null,
          video_delivery_notes: project.video_delivery_notes ?? null,
        }}
      />

      <div className="mt-8 border-t border-border pt-6">
        <DeleteButton
          label="Project"
          redirectTo="/admin/projects"
          onDelete={() => deleteProject(id)}
        />
      </div>
    </div>
  );
}
