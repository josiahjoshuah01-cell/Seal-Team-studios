import { createClient } from "@/lib/supabase/server";
import { isValidProjectType } from "@/lib/constants/portfolio";

export { isValidProjectType, getProjectTypes } from "@/lib/constants/portfolio";
export type { ProjectType } from "@/lib/constants/portfolio";

type ProjectSummary = {
  id: string;
  title: string;
  type: string | null;
  shoot_date: string | null;
};

export type PublicGallery = {
  id: string;
  title: string;
  cover_media_id: string | null;
  project_id: string | null;
  projects: ProjectSummary | null;
};

type MediaRow = {
  id: string;
  type: "image" | "video";
  storage_path: string | null;
  thumbnail_url: string | null;
  cloudflare_stream_uid: string | null;
  stream_status: string | null;
  sort_order: number;
};

export type PublicGalleryDetail = PublicGallery & {
  media: MediaRow[];
};

async function attachProjects<T extends { project_id: string | null }>(
  items: T[]
): Promise<(T & { projects: ProjectSummary | null })[]> {
  const supabase = await createClient();
  const projectIds = [...new Set(items.map((i) => i.project_id).filter(Boolean))] as string[];

  if (projectIds.length === 0) {
    return items.map((item) => ({ ...item, projects: null }));
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, type, shoot_date")
    .in("id", projectIds);

  const projectMap = new Map((projects ?? []).map((p) => [p.id, p]));

  return items.map((item) => ({
    ...item,
    projects: item.project_id ? projectMap.get(item.project_id) ?? null : null,
  }));
}

export async function getPublicGalleries(type?: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("galleries")
    .select("id, title, cover_media_id, project_id")
    .eq("is_public", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  let galleries = await attachProjects(data ?? []);

  if (type && isValidProjectType(type)) {
    galleries = galleries.filter((g) => g.projects?.type === type);
  }

  return galleries;
}

export async function getPublicGalleryById(id: string): Promise<PublicGalleryDetail | null> {
  const supabase = await createClient();

  const { data: gallery, error } = await supabase
    .from("galleries")
    .select("id, title, cover_media_id, project_id")
    .eq("id", id)
    .eq("is_public", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .single();

  if (error || !gallery) return null;

  const [withProject] = await attachProjects([gallery]);

  const { data: media } = await supabase
    .from("media")
    .select(
      "id, type, storage_path, thumbnail_url, cloudflare_stream_uid, stream_status, sort_order"
    )
    .eq("gallery_id", id)
    .order("sort_order", { ascending: true });

  return {
    ...withProject,
    media: (media ?? []) as MediaRow[],
  };
}

export async function getMediaUrl(
  storagePath: string | null,
  thumbnailUrl: string | null
): Promise<string | null> {
  if (thumbnailUrl) return thumbnailUrl;
  if (!storagePath) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("gallery-media")
    .createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function getCoverUrl(coverMediaId: string | null) {
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
    const { getStreamThumbnailUrl } = await import("@/lib/cloudflare/config");
    return data.thumbnail_url ?? getStreamThumbnailUrl(data.cloudflare_stream_uid);
  }

  return getMediaUrl(data.storage_path, data.thumbnail_url);
}
