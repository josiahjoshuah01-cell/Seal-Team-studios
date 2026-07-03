import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/galleries", label: "Galleries" },
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/error-logs", label: "Error Logs" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-muted/20 md:flex md:flex-col">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="font-semibold text-foreground">Admin</span>
          <ThemeToggle />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <form action={signOut}>
            <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              Sign out
            </button>
          </form>
          <Link href="/" className="mt-2 block px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            ← Public site
          </Link>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b border-border md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <span className="font-semibold">Admin</span>
            <ThemeToggle />
          </div>
          <nav className="flex gap-1 overflow-x-auto px-4 pb-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
