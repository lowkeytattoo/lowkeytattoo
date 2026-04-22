import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@shared/lib/supabase";

export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  excerpt: string | null;
  cover_image: string | null;
  content: string;
  tags: string[];
  published: boolean;
  date: string;
  created_at: string;
  updated_at: string;
}

export type BlogPostInsert = Omit<BlogPostRow, "id" | "created_at" | "updated_at">;
export type BlogPostUpdate = Partial<BlogPostInsert> & { id: string };

const QK = "blog_posts";

export function useBlogPosts() {
  return useQuery({
    queryKey: [QK],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlogPostRow[];
    },
  });
}

export function usePublishedBlogPosts() {
  return useQuery({
    queryKey: [QK, "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlogPostRow[];
    },
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: [QK, slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();
      if (error) throw error;
      return data as BlogPostRow;
    },
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: BlogPostInsert) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(post)
        .select()
        .single();
      if (error) throw error;
      return data as BlogPostRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: BlogPostUpdate) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as BlogPostRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export async function uploadBlogImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("blog-images").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return data.publicUrl;
}
