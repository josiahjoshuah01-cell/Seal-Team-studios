import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { StreamPlayer } from "@/components/media/stream-player";
import { getStreamThumbnailUrl } from "@/lib/cloudflare/config";
import { getPublicGalleryById, getMediaUrl } from "@/lib/data/portfolio";
import { formatDate } from "@/lib/utils/format";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const gallery = await getPublicGalleryById(slug);
  if (!gallery) return { title: "Gallery not found" };
  return { title: gallery.title };
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { slug } = await params;
  const gallery = await getPublicGalleryById(slug);

  if (!gallery) notFound();

  const project = gallery.projects;
  const displayMedia = gallery.media.filter(
    (item) =>
      item.type === "image" ||
      (item.type === "video" &&
        item.stream_status === "ready" &&
        item.cloudflare_stream_uid)
  );

  const mediaWithUrls = await Promise.all(
    displayMedia.map(async (item) => ({
      ...item,
      url:
        item.type === "image"
          ? await getMediaUrl(item.storage_path, item.thumbnail_url)
          : null,
    }))
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Link href="/portfolio" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to portfolio
      </Link>

      <header className="mt-6 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">{gallery.title}</h1>
        <div className="mt-2 flex gap-2 text-sm text-muted-foreground capitalize">
          {project?.type && <span>{project.type}</span>}
          {project?.shoot_date && <span>· {formatDate(project.shoot_date)}</span>}
        </div>
        {project?.title && project.title !== gallery.title && (
          <p className="mt-2 text-muted-foreground">{project.title}</p>
        )}
      </header>

      {mediaWithUrls.length === 0 ? (
        <p className="mt-12 text-muted-foreground">Media coming soon.</p>
      ) : (
        <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {mediaWithUrls.map((item) => (
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
