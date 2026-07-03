import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/session";

export async function SiteFooter() {
  const { isAdmin } = await getCurrentProfile();

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} SealTeam Studio. Photography &amp; Video.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/contact" className="hover:text-foreground">
            Contact
          </Link>
          {isAdmin && (
            <Link href="/admin" className="hover:text-foreground">
              Admin
            </Link>
          )}
          <Link href="/portal/dashboard" className="hover:text-foreground">
            Client Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
