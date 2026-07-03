import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentProfile } from "@/lib/auth/session";

const navLinks = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/services", label: "Services" },
  { href: "/booking", label: "Book" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const { user, isAdmin } = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
          SealTeam Studio
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/portal/dashboard"
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                Portal
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
              >
                Sign in
              </Link>
              <Link
                href="/portal/dashboard"
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                Client Portal
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
