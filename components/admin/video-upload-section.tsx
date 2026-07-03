"use client";

import { useCallback, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { toast } from "sonner";
import { Video, RotateCcw } from "lucide-react";
import {
  registerVideoMedia,
  updateVideoStreamStatus,
} from "@/lib/admin/actions/galleries";
import { getStreamThumbnailUrl } from "@/lib/cloudflare/config";

type UploadState = {
  fileName: string;
  progress: number;
  mediaId?: string;
  uid?: string;
  error?: string;
};

type Props = {
  galleryId: string;
  cloudflareEnabled: boolean;
  onVideoRegistered: (item: {
    id: string;
    cloudflare_stream_uid: string;
    stream_status: string;
    thumbnail_url: string | null;
  }) => void;
};

async function pollVideoReady(uid: string, mediaId: string, galleryId: string) {
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(`/api/cloudflare/video-status?uid=${uid}`);
    if (!res.ok) continue;

    const data = (await res.json()) as {
      streamStatus: string;
      thumbnailUrl: string | null;
    };

    if (data.streamStatus === "ready") {
      await updateVideoStreamStatus(
        mediaId,
        galleryId,
        "ready",
        data.thumbnailUrl ?? getStreamThumbnailUrl(uid)
      );
      return { status: "ready" as const, thumbnailUrl: data.thumbnailUrl };
    }

    if (data.streamStatus === "error") {
      await updateVideoStreamStatus(mediaId, galleryId, "error");
      return { status: "error" as const, thumbnailUrl: null };
    }
  }

  return { status: "processing" as const, thumbnailUrl: null };
}

function uploadBasic(file: File, uploadURL: string, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadURL);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

function uploadTus(file: File, uploadURL: string, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: uploadURL,
      uploadSize: file.size,
      retryDelays: [0, 3000, 5000, 10000],
      metadata: { filename: file.name, filetype: file.type },
      onError: (error) => reject(error),
      onProgress: (bytesUploaded, bytesTotal) => {
        onProgress(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: () => resolve(),
    });
    upload.start();
  });
}

export function VideoUploadSection({
  galleryId,
  cloudflareEnabled,
  onVideoRegistered,
}: Props) {
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<File | null>(null);

  const startUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) {
        toast.error("Please choose a video file");
        return;
      }

      fileRef.current = file;
      setUploading(true);
      setUpload({ fileName: file.name, progress: 0 });

      try {
        const initRes = await fetch("/api/cloudflare/direct-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileSizeBytes: file.size }),
        });

        const initData = await initRes.json();
        if (!initRes.ok) {
          throw new Error(initData.error ?? "Unable to start upload");
        }

        const registerResult = await registerVideoMedia({
          gallery_id: galleryId,
          cloudflare_stream_uid: initData.uid,
        });

        if (!registerResult.success || !registerResult.id) {
          throw new Error(registerResult.error ?? "Failed to register video");
        }

        setUpload((u) => ({
          ...u!,
          mediaId: registerResult.id,
          uid: initData.uid,
        }));

        const onProgress = (pct: number) =>
          setUpload((u) => (u ? { ...u, progress: pct } : u));

        if (initData.method === "tus") {
          await uploadTus(file, initData.uploadURL, onProgress);
        } else {
          await uploadBasic(file, initData.uploadURL, onProgress);
        }

        await updateVideoStreamStatus(registerResult.id, galleryId, "processing");
        toast.message("Upload complete — processing video…");

        const result = await pollVideoReady(initData.uid, registerResult.id, galleryId);

        if (result.status === "ready") {
          toast.success("Video is ready");
          onVideoRegistered({
            id: registerResult.id,
            cloudflare_stream_uid: initData.uid,
            stream_status: "ready",
            thumbnail_url: result.thumbnailUrl ?? getStreamThumbnailUrl(initData.uid),
          });
          setUpload(null);
        } else if (result.status === "error") {
          toast.error("Video processing failed");
          setUpload((u) => (u ? { ...u, error: "Processing failed" } : u));
        } else {
          onVideoRegistered({
            id: registerResult.id,
            cloudflare_stream_uid: initData.uid,
            stream_status: "processing",
            thumbnail_url: getStreamThumbnailUrl(initData.uid),
          });
          setUpload(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        toast.error(message);
        setUpload((u) => (u ? { ...u, error: message } : u));
      } finally {
        setUploading(false);
      }
    },
    [galleryId, onVideoRegistered]
  );

  function handleRetry() {
    if (fileRef.current) {
      setUpload(null);
      void startUpload(fileRef.current);
    }
  }

  if (!cloudflareEnabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Cloudflare Stream is not configured. Add API credentials to enable video uploads.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium text-foreground">Add video</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Videos upload directly to Cloudflare Stream. Files over 200 MB use resumable (TUS)
        uploads automatically.
      </p>

      {!upload ? (
        <label className="mt-4 inline-flex cursor-pointer items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
          {uploading ? "Starting…" : "Choose video"}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void startUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      ) : (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-foreground">{upload.fileName}</p>
          {upload.error ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-destructive">{upload.error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
              >
                <RotateCcw className="h-3 w-3" /> Retry
              </button>
            </div>
          ) : (
            <>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {upload.progress < 100
                  ? `Uploading… ${upload.progress}%`
                  : "Processing on Cloudflare…"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
