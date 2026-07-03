import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/lib/auth/actions";
import { getCurrentProfile } from "@/lib/auth/session";

const navItems = [
  { href: "/portal/dashboard", label: "Dashboard" },
  { href: "/portal/galleries", label: "Galleries" },
  { href: "/portal/invoices", label: "Invoices" },
  { href: "/portal/bookings", label: "Bookings" },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await getCurrentProfile();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/portal/dashboard" className="font-semibold text-foreground">
              Client Portal
            </Link>
            <nav className="hidden gap-4 sm:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-foreground hover:underline"
              >
                Admin
              </Link>
            )}
            <ThemeToggle />
            <form action={signOut}>
              <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
