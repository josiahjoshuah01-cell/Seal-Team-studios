import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils/format";
import type { BlogPost } from "@/lib/data/blog";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      {post.cover_image_url && (
        <div className="relative aspect-[16/9] bg-muted">
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <time className="text-xs text-muted-foreground">
          {post.published_at ? formatDate(post.published_at) : ""}
        </time>
        <h2 className="mt-2 text-lg font-semibold text-foreground group-hover:underline">
          {post.title}
        </h2>
        {post.content && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
            {post.content.replace(/<[^>]+>/g, "").slice(0, 160)}…
          </p>
        )}
      </div>
    </Link>
  );
}
