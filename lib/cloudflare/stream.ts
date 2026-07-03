import { logError } from "@/lib/logger";
import { getCloudflareStreamConfig } from "@/lib/cloudflare/config";

const MAX_BASIC_UPLOAD_BYTES = 200 * 1024 * 1024;

type DirectUploadResult = {
  uploadURL: string;
  uid: string;
  method: "basic" | "tus";
};

type StreamVideo = {
  uid: string;
  readyToStream: boolean;
  status: { state: string };
  thumbnail?: string;
};

export async function createDirectUploadUrl(options?: {
  maxDurationSeconds?: number;
  fileSizeBytes?: number;
}): Promise<DirectUploadResult> {
  const { token, apiBase } = getCloudflareStreamConfig();
  const maxDurationSeconds = options?.maxDurationSeconds ?? 7200;
  const fileSizeBytes = options?.fileSizeBytes ?? 0;

  if (fileSizeBytes >= MAX_BASIC_UPLOAD_BYTES) {
    return createTusDirectUpload({ maxDurationSeconds, fileSizeBytes });
  }

  try {
    const response = await fetch(`${apiBase}/stream/direct_upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ maxDurationSeconds }),
      cache: "no-store",
    });

    const data = (await response.json()) as {
      success: boolean;
      result?: { uploadURL: string; uid: string };
      errors?: unknown[];
    };

    if (!response.ok || !data.success || !data.result) {
      await logError("cloudflare_stream", new Error("Direct upload URL failed"), {
        status: response.status,
        errors: data.errors,
      });
      throw new Error("Unable to create video upload URL");
    }

    return {
      uploadURL: data.result.uploadURL,
      uid: data.result.uid,
      method: "basic",
    };
  } catch (error) {
    await logError("cloudflare_stream", error);
    throw error instanceof Error ? error : new Error("Unable to create video upload URL");
  }
}

/**
 * TUS resumable upload — Cloudflare's recommended path for files ≥ 200 MB
 * or unreliable connections. Server proxies the authenticated tus creation;
 * the client uploads directly to the returned Location URL.
 */
async function createTusDirectUpload({
  maxDurationSeconds,
  fileSizeBytes,
}: {
  maxDurationSeconds: number;
  fileSizeBytes: number;
}): Promise<DirectUploadResult> {
  const { token, apiBase } = getCloudflareStreamConfig();
  const metadata = `maxdurationseconds ${Buffer.from(String(maxDurationSeconds)).toString("base64")}`;

  const response = await fetch(`${apiBase}/stream?direct_user=true`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Tus-Resumable": "1.0.0",
      "Upload-Length": String(fileSizeBytes),
      "Upload-Metadata": metadata,
    },
    cache: "no-store",
  });

  const uploadURL = response.headers.get("Location");
  const uid = response.headers.get("stream-media-id");

  if (!response.ok || !uploadURL || !uid) {
    const body = await response.text();
    await logError("cloudflare_stream", new Error("TUS upload URL failed"), {
      status: response.status,
      body,
    });
    throw new Error("Unable to create resumable video upload URL");
  }

  return { uploadURL, uid, method: "tus" };
}

export async function getVideoStatus(uid: string): Promise<{
  streamStatus: "uploading" | "processing" | "ready" | "error";
  thumbnailUrl: string | null;
}> {
  const { token, apiBase } = getCloudflareStreamConfig();

  try {
    const response = await fetch(`${apiBase}/stream/${uid}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = (await response.json()) as {
      success: boolean;
      result?: StreamVideo;
    };

    if (!response.ok || !data.success || !data.result) {
      throw new Error("Video status check failed");
    }

    const video = data.result;

    if (video.readyToStream || video.status.state === "ready") {
      return {
        streamStatus: "ready",
        thumbnailUrl: video.thumbnail ?? null,
      };
    }

    if (video.status.state === "error") {
      return { streamStatus: "error", thumbnailUrl: null };
    }

    return {
      streamStatus: "processing",
      thumbnailUrl: video.thumbnail ?? null,
    };
  } catch (error) {
    await logError("cloudflare_stream", error, { uid });
    throw error instanceof Error ? error : new Error("Unable to check video status");
  }
}

export async function deleteVideo(uid: string) {
  const { token, apiBase } = getCloudflareStreamConfig();

  try {
    const response = await fetch(`${apiBase}/stream/${uid}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      await logError("cloudflare_stream", new Error("Delete video failed"), {
        uid,
        status: response.status,
        body,
      });
      throw new Error("Unable to delete video from Stream");
    }
  } catch (error) {
    await logError("cloudflare_stream", error, { uid });
    throw error instanceof Error ? error : new Error("Unable to delete video");
  }
}

export { MAX_BASIC_UPLOAD_BYTES };
