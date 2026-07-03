import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { StreamPlayer } from "@/components/media/stream-player";
import { getStreamThumbnailUrl } from "@/lib/cloudflare/config";
import { getPortalGalleryById } from "@/lib/portal/galleries";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const gallery = await getPortalGalleryById(id);
  if (!gallery) return { title: "Gallery not found" };
  return { title: gallery.title };
}

export default async function PortalGalleryDetailPage({ params }: Props) {
  const { id } = await params;
  const gallery = await getPortalGalleryById(id);

  if (!gallery) notFound();

  const displayMedia = gallery.media.filter(
    (item) =>
      item.type === "image" ||
      (item.type === "video" &&
        item.stream_status === "ready" &&
        item.cloudflare_stream_uid)
  );

  return (
    <div>
      <Link
        href="/portal/galleries"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to galleries
      </Link>

      <header className="mt-6 max-w-2xl">
        <h1 className="text-2xl font-semibold text-foreground">{gallery.title}</h1>
        {gallery.project_title && (
          <p className="mt-1 text-sm text-muted-foreground">{gallery.project_title}</p>
        )}
      </header>

      {displayMedia.length === 0 ? (
        <p className="mt-12 text-muted-foreground">No media available yet.</p>
      ) : (
        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {displayMedia.map((item) => (
            <div key={item.id} className="mb-4 break-inside-avoid">
              {item.type === "image" && item.url ? (
                <div className="relative overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={item.url}
                    alt=""
                    width={800}
                    height={600}
                    className="h-auto w-full object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              ) : item.type === "video" && item.cloudflare_stream_uid ? (
                <StreamPlayer
                  uid={item.cloudflare_stream_uid}
                  thumbnailUrl={
                    item.thumbnail_url ??
                    getStreamThumbnailUrl(item.cloudflare_stream_uid)
                  }
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
