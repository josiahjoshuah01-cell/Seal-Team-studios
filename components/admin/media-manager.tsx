"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Heart, Star, Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getStreamThumbnailUrl } from "@/lib/cloudflare/config";
import { VideoUploadSection } from "@/components/admin/video-upload-section";
import {
  deleteMedia,
  registerMedia,
  reorderMedia,
  setCoverMedia,
  toggleMediaFavorite,
  updateVideoStreamStatus,
} from "@/lib/admin/actions/galleries";

export type MediaItem = {
  id: string;
  type: string;
  storage_path: string | null;
  thumbnail_url: string | null;
  cloudflare_stream_uid: string | null;
  stream_status: string | null;
  is_favorite: boolean;
  sort_order: number;
  url?: string | null;
};

type Props = {
  galleryId: string;
  coverMediaId: string | null;
  initialMedia: MediaItem[];
  cloudflareEnabled: boolean;
};

export function MediaManager({
  galleryId,
  coverMediaId,
  initialMedia,
  cloudflareEnabled,
}: Props) {
  const [media, setMedia] = useState(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [coverId, setCoverId] = useState(coverMediaId);

  useEffect(() => {
    const processing = media.filter(
      (m) =>
        m.type === "video" &&
        m.cloudflare_stream_uid &&
        (m.stream_status === "processing" || m.stream_status === "uploading")
    );

    if (processing.length === 0) return;

    const interval = setInterval(async () => {
      for (const item of processing) {
        if (!item.cloudflare_stream_uid) continue;
        const res = await fetch(
          `/api/cloudflare/video-status?uid=${item.cloudflare_stream_uid}`
        );
        if (!res.ok) continue;

        const data = (await res.json()) as {
          streamStatus: string;
          thumbnailUrl: string | null;
        };

        if (data.streamStatus === "ready" || data.streamStatus === "error") {
          await updateVideoStreamStatus(
            item.id,
            galleryId,
            data.streamStatus as "ready" | "error",
            data.thumbnailUrl
          );
          setMedia((prev) =>
            prev.map((m) =>
              m.id === item.id
                ? {
                    ...m,
                    stream_status: data.streamStatus,
                    thumbnail_url:
                      data.thumbnailUrl ??
                      (item.cloudflare_stream_uid
                        ? getStreamThumbnailUrl(item.cloudflare_stream_uid)
                        : m.thumbnail_url),
                  }
                : m
            )
          );
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [media, galleryId]);

  const uploadImages = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;

      setUploading(true);
      const supabase = createClient();

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;

        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${galleryId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("gallery-media")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          toast.error(`Upload failed: ${file.name}`);
          continue;
        }

        const result = await registerMedia({
          gallery_id: galleryId,
          storage_path: path,
          type: "image",
        });

        if (!result.success) {
          toast.error(result.error ?? "Failed to save media record");
          continue;
        }

        const { data: signed } = await supabase.storage
          .from("gallery-media")
          .createSignedUrl(path, 3600);

        setMedia((prev) => [
          ...prev,
          {
            id: result.id!,
            type: "image",
            storage_path: path,
            thumbnail_url: null,
            cloudflare_stream_uid: null,
            stream_status: null,
            is_favorite: false,
            sort_order: prev.length,
            url: signed?.signedUrl ?? null,
          },
        ]);
      }

      setUploading(false);
      toast.success("Image upload complete");
    },
    [galleryId]
  );

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete this ${item.type}?`)) return;
    const result = await deleteMedia(item.id, galleryId);
    if (!result.success) {
      toast.error(result.error ?? "Delete failed");
      return;
    }
    setMedia((prev) => prev.filter((m) => m.id !== item.id));
    if (coverId === item.id) setCoverId(null);
    toast.success("Deleted");
  }

  async function handleFavorite(item: MediaItem) {
    const next = !item.is_favorite;
    const result = await toggleMediaFavorite(item.id, galleryId, next);
    if (!result.success) {
      toast.error(result.error ?? "Update failed");
      return;
    }
    setMedia((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, is_favorite: next } : m))
    );
  }

  async function handleSetCover(item: MediaItem) {
    const result = await setCoverMedia(galleryId, item.id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to set cover");
      return;
    }
    setCoverId(item.id);
    toast.success("Cover set");
  }

  async function moveItem(index: number, direction: -1 | 1) {
    const next = [...media];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setMedia(next);
    await reorderMedia(
      galleryId,
      next.map((m) => m.id)
    );
  }

  function previewUrl(item: MediaItem) {
    if (item.type === "video" && item.cloudflare_stream_uid) {
      return item.thumbnail_url ?? getStreamThumbnailUrl(item.cloudflare_stream_uid);
    }
    return item.url;
  }

  return (
    <div className="space-y-6">
      <div
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-12 transition-colors hover:border-muted-foreground/50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          uploadImages(e.dataTransfer.files);
        }}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag &amp; drop images here, or click to browse
        </p>
        <label className="mt-4 cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90">
          {uploading ? "Uploading…" : "Choose images"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => uploadImages(e.target.files)}
          />
        </label>
      </div>

      <VideoUploadSection
        galleryId={galleryId}
        cloudflareEnabled={cloudflareEnabled}
        onVideoRegistered={(item) => {
          setMedia((prev) => [
            ...prev,
            {
              id: item.id,
              type: "video",
              storage_path: null,
              thumbnail_url: item.thumbnail_url,
              cloudflare_stream_uid: item.cloudflare_stream_uid,
              stream_status: item.stream_status,
              is_favorite: false,
              sort_order: prev.length,
              url: null,
            },
          ]);
        }}
      />

      {media.length === 0 ? (
        <p className="text-sm text-muted-foreground">No media yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.map((item, index) => {
            const thumb = previewUrl(item);
            const isProcessing =
              item.type === "video" &&
              item.stream_status !== "ready" &&
              item.stream_status !== "error";

            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg border border-border bg-card"
              >
                <div className="relative aspect-square bg-muted">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="200px"
                      unoptimized={item.type === "video"}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      {item.type === "video" ? (
                        <Video className="h-8 w-8" />
                      ) : (
                        "No preview"
                      )}
                    </div>
                  )}
                  {item.type === "video" && (
                    <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-0.5 text-xs font-medium">
                      Video
                    </span>
                  )}
                  {isProcessing && (
                    <span className="absolute inset-x-2 bottom-2 rounded bg-background/90 px-2 py-1 text-center text-xs text-muted-foreground">
                      {item.stream_status === "uploading"
                        ? "Uploading…"
                        : "Processing…"}
                    </span>
                  )}
                  {item.stream_status === "error" && (
                    <span className="absolute inset-x-2 bottom-2 rounded bg-destructive/10 px-2 py-1 text-center text-xs text-destructive">
                      Processing failed
                    </span>
                  )}
                  {coverId === item.id && (
                    <span className="absolute right-2 top-2 rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                      Cover
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 border-t border-border p-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === media.length - 1}
                      className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
                    >
                      →
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      title="Favorite"
                      onClick={() => handleFavorite(item)}
                      className="rounded p-1.5 hover:bg-muted"
                    >
                      <Heart
                        className={`h-4 w-4 ${item.is_favorite ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
                      />
                    </button>
                    <button
                      type="button"
                      title="Set as cover"
                      onClick={() => handleSetCover(item)}
                      className="rounded p-1.5 hover:bg-muted"
                    >
                      <Star
                        className={`h-4 w-4 ${coverId === item.id ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                      />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => handleDelete(item)}
                      className="rounded p-1.5 hover:bg-muted"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
