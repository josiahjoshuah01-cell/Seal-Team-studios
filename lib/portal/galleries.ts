import { createClient } from "@/lib/supabase/server";
import { getStreamThumbnailUrl } from "@/lib/cloudflare/config";
import { getAuthenticatedPortalClientId } from "@/lib/portal/client";

export type PortalGallery = {
  id: string;
  title: string;
  cover_media_id: string | null;
  project_title: string | null;
  created_at: string;
};

export type PortalGalleryMedia = {
  id: string;
  type: "image" | "video";
  storage_path: string | null;
  thumbnail_url: string | null;
  cloudflare_stream_uid: string | null;
  stream_status: string | null;
  sort_order: number;
  url?: string | null;
};

export type PortalGalleryDetail = PortalGallery & {
  media: PortalGalleryMedia[];
};

export async function getPortalGalleries(): Promise<PortalGallery[]> {
  const clientId = await getAuthenticatedPortalClientId();
  if (!clientId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("galleries")
    .select("id, title, cover_media_id, project_id, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const projectIds = [
    ...new Set((data ?? []).map((g) => g.project_id).filter(Boolean)),
  ] as string[];

  let projectMap = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, title")
      .in("id", projectIds);
    projectMap = new Map((projects ?? []).map((p) => [p.id, p.title]));
  }

  return (data ?? []).map((gallery) => ({
    id: gallery.id,
    title: gallery.title,
    cover_media_id: gallery.cover_media_id,
    created_at: gallery.created_at,
    project_title: gallery.project_id
      ? projectMap.get(gallery.project_id) ?? null
      : null,
  }));
}

export async function getPortalGalleryById(
  id: string
): Promise<PortalGalleryDetail | null> {
  const clientId = await getAuthenticatedPortalClientId();
  if (!clientId) return null;

  const supabase = await createClient();
  const { data: gallery, error } = await supabase
    .from("galleries")
    .select("id, title, cover_media_id, project_id, created_at")
    .eq("id", id)
    .single();

  if (error || !gallery) return null;

  let projectTitle: string | null = null;
  if (gallery.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("title")
      .eq("id", gallery.project_id)
      .single();
    projectTitle = project?.title ?? null;
  }

  const { data: media } = await supabase
    .from("media")
    .select(
      "id, type, storage_path, thumbnail_url, cloudflare_stream_uid, stream_status, sort_order"
    )
    .eq("gallery_id", id)
    .order("sort_order", { ascending: true });

  const mediaWithUrls = await Promise.all(
    (media ?? []).map(async (item) => {
      if (
        item.type === "video" &&
        item.cloudflare_stream_uid &&
        item.stream_status === "ready"
      ) {
        return {
          ...item,
          url: null,
        } satisfies PortalGalleryMedia;
      }

      let url: string | null = item.thumbnail_url;
      if (!url && item.storage_path) {
        const { data: signed } = await supabase.storage
          .from("gallery-media")
          .createSignedUrl(item.storage_path, 3600);
        url = signed?.signedUrl ?? null;
      }

      return { ...item, url } satisfies PortalGalleryMedia;
    })
  );

  return {
    id: gallery.id,
    title: gallery.title,
    cover_media_id: gallery.cover_media_id,
    created_at: gallery.created_at,
    project_title: projectTitle,
    media: mediaWithUrls as PortalGalleryMedia[],
  };
}

export async function getPortalCoverUrl(coverMediaId: string | null) {
  if (!coverMediaId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("media")
    .select("storage_path, thumbnail_url, type, cloudflare_stream_uid, stream_status")
    .eq("id", coverMediaId)
    .single();

  if (!data) return null;

  if (
    data.type === "video" &&
    data.cloudflare_stream_uid &&
    data.stream_status === "ready"
  ) {
    return data.thumbnail_url ?? getStreamThumbnailUrl(data.cloudflare_stream_uid);
  }

  if (data.thumbnail_url) return data.thumbnail_url;
  if (!data.storage_path) return null;

  const { data: signed } = await supabase.storage
    .from("gallery-media")
    .createSignedUrl(data.storage_path, 3600);

  return signed?.signedUrl ?? null;
}
