import Link from "next/link";
import { getActiveServices } from "@/lib/data/services";
import { getPublicGalleries } from "@/lib/data/portfolio";
import { ServiceCard } from "@/components/services/service-card";
import { PortfolioCard } from "@/components/portfolio/portfolio-card";

export default async function HomePage() {
  const [services, galleries] = await Promise.all([
    getActiveServices(),
    getPublicGalleries(),
  ]);

  const featuredServices = services.slice(0, 3);
  const featuredGalleries = galleries.slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Photography &amp; Video
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Stories worth remembering
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Weddings, portraits, commercial work, and events — captured with care
              and delivered through your private client portal.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/booking"
                className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                Book a session
              </Link>
              <Link
                href="/portfolio"
                className="rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                View portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>

      {featuredGalleries.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold text-foreground">Featured work</h2>
            <Link href="/portfolio" className="text-sm text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredGalleries.map((gallery) => (
              <PortfolioCard key={gallery.id} gallery={gallery} />
            ))}
          </div>
        </section>
      )}

      {featuredServices.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl font-semibold text-foreground">Services &amp; packages</h2>
              <Link href="/services" className="text-sm text-muted-foreground hover:text-foreground">
                View all →
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-foreground">Ready to get started?</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Browse packages, pick an open slot, and we&apos;ll confirm your booking.
          </p>
          <Link
            href="/services"
            className="mt-6 inline-block text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            View services &amp; pricing →
          </Link>
        </div>
      </section>
    </>
  );
}
