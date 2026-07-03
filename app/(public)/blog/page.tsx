import { getPublishedPosts } from "@/lib/data/blog";
import { BlogCard } from "@/components/blog/blog-card";

export const metadata = { title: "Blog" };

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Tips, behind-the-scenes, and stories from the studio.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="mt-12 text-muted-foreground">No posts published yet. Check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
