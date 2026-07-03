export function isCloudflareStreamConfigured() {
  return Boolean(
    process.env.CLOUDFLARE_STREAM_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID
  );
}

export function getCloudflareStreamConfig() {
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountId) {
    throw new Error("Cloudflare Stream credentials are not configured.");
  }

  return {
    token,
    accountId,
    apiBase: `https://api.cloudflare.com/client/v4/accounts/${accountId}`,
  };
}

/** Cloudflare Stream thumbnail (public CDN URL). */
export function getStreamThumbnailUrl(uid: string) {
  return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?time=1s`;
}

/** iframe embed URL for click-to-play lazy loading. */
export function getStreamIframeUrl(uid: string) {
  return `https://iframe.videodelivery.net/${uid}`;
}
