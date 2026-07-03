import Link from "next/link";
import { getGalleries } from "@/lib/admin/actions/galleries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Galleries" };

export default async function AdminGalleriesPage() {
  const galleries = await getGalleries();

  return (
    <div>
      <AdminPageHeader
        title="Galleries"
        description="Upload and manage client galleries."
        action={{ label: "New gallery", href: "/admin/galleries/new" }}
      />

      {galleries.length === 0 ? (
        <p className="text-muted-foreground">No galleries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Project</th>
                <th className="px-4 py-3 text-left font-medium">Public</th>
                <th className="px-4 py-3 text-left font-medium">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {galleries.map((gallery) => (
                <tr key={gallery.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/galleries/${gallery.id}`}
                      className="font-medium hover:underline"
                    >
                      {gallery.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{gallery.project_title}</td>
                  <td className="px-4 py-3">
                    {gallery.is_public ? (
                      <span className="text-green-600 dark:text-green-400">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {gallery.expires_at ? formatDate(gallery.expires_at) : "—"}
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
