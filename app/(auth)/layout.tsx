import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute left-4 top-4">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          SealTeam Studio
        </Link>
      </div>
      {children}
    </div>
  );
}
