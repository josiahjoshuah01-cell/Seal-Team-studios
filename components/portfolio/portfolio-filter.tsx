"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getProjectTypes } from "@/lib/constants/portfolio";

export function PortfolioFilter() {
  const searchParams = useSearchParams();
  const current = searchParams.get("type") ?? "all";
  const types = getProjectTypes();

  return (
    <div className="flex flex-wrap gap-2">
      <FilterLink href="/portfolio" label="All" active={current === "all"} />
      {types.map((type) => (
        <FilterLink
          key={type}
          href={`/portfolio?type=${type}`}
          label={type}
          active={current === type}
        />
      ))}
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
