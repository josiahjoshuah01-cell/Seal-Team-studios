import { AdminPageHeader } from "@/components/admin/page-header";

export const metadata = { title: "Blog" };

export default function AdminBlogPage() {
  return (
    <div>
      <AdminPageHeader title="Blog" description="Manage blog posts." />
      <p className="text-muted-foreground">Coming in Phase 5 extension.</p>
    </div>
  );
}
