import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/data/blog";
import { formatDate } from "@/lib/utils/format";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return { title: post.title };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to blog
      </Link>

      <header className="mt-6">
        <time className="text-sm text-muted-foreground">
          {post.published_at ? formatDate(post.published_at) : ""}
        </time>
        <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{post.title}</h1>
      </header>

      {post.cover_image_url && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {post.content && (
        <div
          className="prose prose-neutral mt-10 max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      )}
    </article>
  );
}
