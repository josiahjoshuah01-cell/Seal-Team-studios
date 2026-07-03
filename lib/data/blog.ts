import { createClient } from "@/lib/supabase/server";

export async function getPublishedPosts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, cover_image_url, published_at, content")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPostBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, cover_image_url, published_at, content")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) return null;
  return data;
}

export type BlogPost = Awaited<ReturnType<typeof getPublishedPosts>>[number];
