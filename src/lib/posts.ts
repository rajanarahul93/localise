import { supabase } from "./supabase";
import type { Post } from "../types";

export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }

  return data || [];
}

export async function createPost(
  post: Omit<Post, "id" | "created_at" | "user_id">
): Promise<Post> {
  // Get current user (will be anonymous user)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        ...post,
        user_id: user?.id, // This will be automatically set by the database default, but explicit is better
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating post:", error);
    throw error;
  }

  return data;
}


export function subscribeToNewPosts(callback: (post: Post) => void) {
  const subscription = supabase
    .channel("posts")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "posts",
      },
      (payload) => {
        callback(payload.new as Post);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}
