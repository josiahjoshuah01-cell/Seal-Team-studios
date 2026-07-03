import Link from "next/link";
import Image from "next/image";
import { getCoverUrl, type PublicGallery } from "@/lib/data/portfolio";
import { formatDate } from "@/lib/utils/format";

export async function PortfolioCard({ gallery }: { gallery: PublicGallery }) {
  const coverUrl = await getCoverUrl(gallery.cover_media_id);
  const project = gallery.projects;

  return (
    <Link
      href={`/portfolio/${gallery.id}`}
      className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={gallery.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-end p-4">
            <span className="text-sm text-muted-foreground">{gallery.title}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-foreground group-hover:underline">{gallery.title}</h3>
        <div className="mt-1 flex gap-2 text-xs text-muted-foreground capitalize">
          {project?.type && <span>{project.type}</span>}
          {project?.shoot_date && <span>· {formatDate(project.shoot_date)}</span>}
        </div>
      </div>
    </Link>
  );
}
