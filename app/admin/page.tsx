import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getClients } from "@/lib/admin/actions/clients";
import { getProjects } from "@/lib/admin/actions/projects";
import { getGalleries } from "@/lib/admin/actions/galleries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { formatDate } from "@/lib/utils/format";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [clients, projects, galleries] = await Promise.all([
    getClients(),
    getProjects(),
    getGalleries(),
  ]);

  const stats = [
    { label: "Clients", value: clients.length, href: "/admin/clients" },
    { label: "Projects", value: projects.length, href: "/admin/projects" },
    { label: "Galleries", value: galleries.length, href: "/admin/galleries" },
    {
      label: "Public galleries",
      value: galleries.filter((g) => g.is_public).length,
      href: "/admin/galleries",
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Overview"
        description="Manage clients, projects, and galleries."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-3xl font-semibold text-foreground">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-medium text-foreground">Recent projects</h2>
          {projects.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
              {projects.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <Link href={`/admin/projects/${p.id}`} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                  <span className="text-muted-foreground capitalize">{p.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-medium text-foreground">Recent clients</h2>
          {clients.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No clients yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
              {clients.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <Link href={`/admin/clients/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  <span className="text-muted-foreground">{formatDate(c.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
