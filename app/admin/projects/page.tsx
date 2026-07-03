import Link from "next/link";
import { getProjects } from "@/lib/admin/actions/projects";
import { AdminPageHeader } from "@/components/admin/page-header";
import { VideoDeliveryCell } from "@/components/admin/video-delivery-badge";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  const projects = await getProjects();

  return (
    <div>
      <AdminPageHeader
        title="Projects"
        description="Shoots and deliverables assigned to clients."
        action={{ label: "Add project", href: "/admin/projects/new" }}
      />

      {projects.length === 0 ? (
        <p className="text-muted-foreground">No projects yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Shoot date</th>
                <th className="px-4 py-3 text-left font-medium">Video delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="font-medium hover:underline"
                    >
                      {project.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{project.client_name}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {project.type ?? "—"}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{project.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {project.shoot_date ? formatDate(project.shoot_date) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <VideoDeliveryCell
                      method={project.video_delivery_method}
                      status={project.video_delivery_status}
                    />
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
