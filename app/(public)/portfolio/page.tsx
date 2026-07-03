import { Suspense } from "react";
import { getPublicGalleries, isValidProjectType } from "@/lib/data/portfolio";
import { PortfolioCard } from "@/components/portfolio/portfolio-card";
import { PortfolioFilter } from "@/components/portfolio/portfolio-filter";

export const metadata = { title: "Portfolio" };

type Props = {
  searchParams: Promise<{ type?: string }>;
};

export default async function PortfolioPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const filterType = type && isValidProjectType(type) ? type : undefined;
  const galleries = await getPublicGalleries(filterType);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">Portfolio</h1>
        <p className="mt-2 text-muted-foreground">
          A selection of weddings, portraits, commercial work, and events.
        </p>
      </div>

      <div className="mt-8">
        <Suspense fallback={<div className="h-9" />}>
          <PortfolioFilter />
        </Suspense>
      </div>

      {galleries.length === 0 ? (
        <p className="mt-12 text-muted-foreground">
          No public galleries yet. Check back soon or contact us to discuss your project.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {galleries.map((gallery) => (
            <PortfolioCard key={gallery.id} gallery={gallery} />
          ))}
        </div>
      )}
    </div>
  );
}
