import Link from "next/link";
import Image from "next/image";
import { getPortalCoverUrl, getPortalGalleries } from "@/lib/portal/galleries";

export const metadata = { title: "Galleries" };

export default async function PortalGalleriesPage() {
  const galleries = await getPortalGalleries();

  const galleriesWithCovers = await Promise.all(
    galleries.map(async (gallery) => ({
      ...gallery,
      coverUrl: await getPortalCoverUrl(gallery.cover_media_id),
    }))
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Your Galleries</h1>
      <p className="mt-2 text-muted-foreground">
        View photos and videos from your projects.
      </p>

      {galleriesWithCovers.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No galleries yet.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {galleriesWithCovers.map((gallery) => (
            <Link
              key={gallery.id}
              href={`/portal/galleries/${gallery.id}`}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-muted">
                {gallery.coverUrl ? (
                  <Image
                    src={gallery.coverUrl}
                    alt={gallery.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized={gallery.coverUrl.includes("videodelivery.net")}
                  />
                ) : (
                  <div className="flex h-full items-end p-4">
                    <span className="text-sm text-muted-foreground">{gallery.title}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-medium text-foreground group-hover:underline">
                  {gallery.title}
                </h2>
                {gallery.project_title && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {gallery.project_title}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
