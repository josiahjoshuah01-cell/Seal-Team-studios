import { getProjectsForSelect } from "@/lib/admin/actions/galleries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { GalleryForm } from "@/components/admin/gallery-form";

export const metadata = { title: "New gallery" };

export default async function NewGalleryPage() {
  const projects = await getProjectsForSelect();

  return (
    <div>
      <AdminPageHeader title="New gallery" description="Create a gallery for a project." />
      {projects.length === 0 ? (
        <p className="text-muted-foreground">Create a project first before adding a gallery.</p>
      ) : (
        <GalleryForm projects={projects} />
      )}
    </div>
  );
}
