"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { getStreamIframeUrl, getStreamThumbnailUrl } from "@/lib/cloudflare/config";

type Props = {
  uid: string;
  thumbnailUrl?: string | null;
  title?: string;
  className?: string;
};

export function StreamPlayer({ uid, thumbnailUrl, title, className }: Props) {
  const [playing, setPlaying] = useState(false);
  const thumb = thumbnailUrl ?? getStreamThumbnailUrl(uid);

  if (playing) {
    return (
      <div className={`relative aspect-video overflow-hidden rounded-lg bg-black ${className ?? ""}`}>
        <iframe
          src={`${getStreamIframeUrl(uid)}?autoplay=true`}
          title={title ?? "Video"}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className={`group relative block aspect-video w-full overflow-hidden rounded-lg bg-muted ${className ?? ""}`}
      aria-label="Play video"
    >
      <Image
        src={thumb}
        alt={title ?? "Video thumbnail"}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 33vw"
        unoptimized
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background/90 text-foreground shadow">
          <Play className="ml-1 h-6 w-6 fill-current" />
        </span>
      </span>
    </button>
  );
}
