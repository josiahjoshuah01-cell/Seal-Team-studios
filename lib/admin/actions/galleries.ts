"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { gallerySchema, mediaMetadataSchema, type GalleryInput } from "@/lib/validations/admin";
import { logError } from "@/lib/logger";
import { notifyGalleryPublished } from "@/lib/emails/notify";

export async function getGalleries() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("galleries")
    .select("id, title, is_public, expires_at, project_id, cover_media_id, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const projectIds = [...new Set((data ?? []).map((g) => g.project_id).filter(Boolean))] as string[];
  let projectMap = new Map<string, { title: string }>();

  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, title")
      .in("id", projectIds);
    projectMap = new Map((projects ?? []).map((p) => [p.id, { title: p.title }]));
  }

  return (data ?? []).map((g) => ({
    ...g,
    project_title: g.project_id ? projectMap.get(g.project_id)?.title ?? "—" : "—",
  }));
}

export async function getGallery(id: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("galleries")
    .select("id, title, is_public, expires_at, project_id, cover_media_id, published_notified_at")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getGalleryMedia(galleryId: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("media")
    .select(
      "id, type, storage_path, thumbnail_url, cloudflare_stream_uid, stream_status, is_favorite, sort_order, created_at"
    )
    .eq("gallery_id", galleryId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createGallery(input: GalleryInput) {
  try {
    const parsed = gallerySchema.parse(input);
    const { supabase } = await requireAdmin();

    const { data, error } = await supabase
      .from("galleries")
      .insert({
        project_id: parsed.project_id,
        title: parsed.title,
        is_public: parsed.is_public,
        expires_at: parsed.expires_at ? new Date(parsed.expires_at).toISOString() : null,
      })
      .select("id")
      .single();

    if (error) throw error;

    if (parsed.is_public) {
      void notifyGalleryPublished(data.id);
    }

    revalidatePath("/admin/galleries");
    return { success: true, id: data.id };
  } catch (err) {
    await logError("admin_galleries", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to create gallery" };
  }
}

export async function updateGallery(id: string, input: GalleryInput) {
  try {
    const parsed = gallerySchema.parse(input);
    const { supabase } = await requireAdmin();

    const { data: previous } = await supabase
      .from("galleries")
      .select("is_public, published_notified_at")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("galleries")
      .update({
        project_id: parsed.project_id,
        title: parsed.title,
        is_public: parsed.is_public,
        expires_at: parsed.expires_at ? new Date(parsed.expires_at).toISOString() : null,
      })
      .eq("id", id);

    if (error) throw error;

    if (parsed.is_public && !previous?.published_notified_at) {
      void notifyGalleryPublished(id);
    }

    revalidatePath("/admin/galleries");
    revalidatePath(`/admin/galleries/${id}`);
    revalidatePath("/portfolio");
    return { success: true };
  } catch (err) {
    await logError("admin_galleries", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update gallery" };
  }
}

export async function deleteGallery(id: string) {
  try {
    const { supabase } = await requireAdmin();

    const { data: media } = await supabase
      .from("media")
      .select("storage_path")
      .eq("gallery_id", id);

    const paths = (media ?? []).map((m) => m.storage_path).filter(Boolean) as string[];
    if (paths.length > 0) {
      await supabase.storage.from("gallery-media").remove(paths);
    }

    const { error } = await supabase.from("galleries").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/admin/galleries");
    return { success: true };
  } catch (err) {
    await logError("admin_galleries", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete gallery" };
  }
}

export async function registerVideoMedia(input: {
  gallery_id: string;
  cloudflare_stream_uid: string;
}) {
  try {
    const { supabase } = await requireAdmin();

    const { data: existing } = await supabase
      .from("media")
      .select("sort_order")
      .eq("gallery_id", input.gallery_id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("media")
      .insert({
        gallery_id: input.gallery_id,
        type: "video",
        cloudflare_stream_uid: input.cloudflare_stream_uid,
        stream_status: "uploading",
        sort_order: nextOrder,
      })
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath(`/admin/galleries/${input.gallery_id}`);
    return { success: true, id: data.id };
  } catch (err) {
    await logError("gallery_video_register", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to register video",
    };
  }
}

export async function updateVideoStreamStatus(
  mediaId: string,
  galleryId: string,
  streamStatus: "uploading" | "processing" | "ready" | "error",
  thumbnailUrl?: string | null
) {
  try {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from("media")
      .update({
        stream_status: streamStatus,
        ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
      })
      .eq("id", mediaId);

    if (error) throw error;

    revalidatePath(`/admin/galleries/${galleryId}`);
    revalidatePath("/portfolio");
    return { success: true };
  } catch (err) {
    await logError("gallery_video_status", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update video status",
    };
  }
}

export async function registerMedia(input: {
  gallery_id: string;
  storage_path: string;
  type?: "image" | "video";
}) {
  try {
    const parsed = mediaMetadataSchema.parse(input);
    const { supabase } = await requireAdmin();

    const { data: existing } = await supabase
      .from("media")
      .select("sort_order")
      .eq("gallery_id", parsed.gallery_id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("media")
      .insert({
        gallery_id: parsed.gallery_id,
        storage_path: parsed.storage_path,
        type: parsed.type,
        sort_order: nextOrder,
      })
      .select("id")
      .single();

    if (error) throw error;

    revalidatePath(`/admin/galleries/${parsed.gallery_id}`);
    return { success: true, id: data.id };
  } catch (err) {
    await logError("gallery_upload", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to register media" };
  }
}

export async function deleteMedia(mediaId: string, galleryId: string) {
  try {
    const { supabase } = await requireAdmin();

    const { data: item } = await supabase
      .from("media")
      .select("storage_path, type, cloudflare_stream_uid")
      .eq("id", mediaId)
      .single();

    if (item?.type === "video" && item.cloudflare_stream_uid) {
      try {
        const { deleteVideo } = await import("@/lib/cloudflare/stream");
        await deleteVideo(item.cloudflare_stream_uid);
      } catch (err) {
        await logError("gallery_video_delete", err, { mediaId });
      }
    }

    if (item?.storage_path) {
      await supabase.storage.from("gallery-media").remove([item.storage_path]);
    }

    const { error } = await supabase.from("media").delete().eq("id", mediaId);
    if (error) throw error;

    revalidatePath(`/admin/galleries/${galleryId}`);
    return { success: true };
  } catch (err) {
    await logError("gallery_upload", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete media" };
  }
}

export async function toggleMediaFavorite(mediaId: string, galleryId: string, isFavorite: boolean) {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("media")
      .update({ is_favorite: isFavorite })
      .eq("id", mediaId);

    if (error) throw error;

    revalidatePath(`/admin/galleries/${galleryId}`);
    return { success: true };
  } catch (err) {
    await logError("admin_galleries", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update favorite" };
  }
}

export async function reorderMedia(galleryId: string, orderedIds: string[]) {
  try {
    const { supabase } = await requireAdmin();

    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("media").update({ sort_order: index }).eq("id", id)
      )
    );

    revalidatePath(`/admin/galleries/${galleryId}`);
    return { success: true };
  } catch (err) {
    await logError("admin_galleries", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to reorder media" };
  }
}

export async function setCoverMedia(galleryId: string, mediaId: string | null) {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("galleries")
      .update({ cover_media_id: mediaId })
      .eq("id", galleryId);

    if (error) throw error;

    revalidatePath(`/admin/galleries/${galleryId}`);
    revalidatePath("/portfolio");
    return { success: true };
  } catch (err) {
    await logError("admin_galleries", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to set cover" };
  }
}

export async function getProjectsForSelect() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("projects")
    .select("id, title, client_id")
    .order("title");
  return data ?? [];
}

export async function getProjectGalleries(projectId: string) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("galleries")
    .select("id, title")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
