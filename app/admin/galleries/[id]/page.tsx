import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStreamThumbnailUrl, isCloudflareStreamConfigured } from "@/lib/cloudflare/config";
import {
  getGallery,
  getGalleryMedia,
  deleteGallery,
  getProjectsForSelect,
} from "@/lib/admin/actions/galleries";
import { AdminPageHeader } from "@/components/admin/page-header";
import { GalleryForm } from "@/components/admin/gallery-form";
import { MediaManager } from "@/components/admin/media-manager";
import { DeleteButton } from "@/components/admin/delete-button";

type Props = { params: Promise<{ id: string }> };

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function getMediaWithUrls(galleryId: string) {
  const media = await getGalleryMedia(galleryId);
  const supabase = await createClient();

  return Promise.all(
    media.map(async (item) => {
      let url: string | null = item.thumbnail_url;
      if (
        !url &&
        item.type === "video" &&
        item.cloudflare_stream_uid
      ) {
        url = getStreamThumbnailUrl(item.cloudflare_stream_uid);
      }
      if (!url && item.storage_path) {
        const { data } = await supabase.storage
          .from("gallery-media")
          .createSignedUrl(item.storage_path, 3600);
        url = data?.signedUrl ?? null;
      }
      return { ...item, url };
    })
  );
}

export default async function EditGalleryPage({ params }: Props) {
  const { id } = await params;
  const [gallery, projects, media] = await Promise.all([
    getGallery(id),
    getProjectsForSelect(),
    getMediaWithUrls(id),
  ]);

  if (!gallery) notFound();

  return (
    <div className="space-y-10">
      <AdminPageHeader title={gallery.title} description="Manage gallery settings and media." />

      <section>
        <h2 className="mb-4 text-lg font-medium text-foreground">Settings</h2>
        <GalleryForm
          projects={projects}
          gallery={{
            id,
            project_id: gallery.project_id!,
            title: gallery.title,
            is_public: gallery.is_public,
            expires_at: toDatetimeLocal(gallery.expires_at),
          }}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-foreground">Media</h2>
        <MediaManager
          galleryId={id}
          coverMediaId={gallery.cover_media_id}
          initialMedia={media}
          cloudflareEnabled={isCloudflareStreamConfigured()}
        />
      </section>

      <div className="border-t border-border pt-6">
        <DeleteButton
          label="Gallery"
          redirectTo="/admin/galleries"
          onDelete={() => deleteGallery(id)}
        />
      </div>
    </div>
  );
}
