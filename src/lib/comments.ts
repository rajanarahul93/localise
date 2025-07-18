import { supabase } from "./supabase";
import type { Comment } from "../types";

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }

  return data || [];
}

export async function addComment(
  postId: string,
  content: string
): Promise<Comment> {
  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        post_id: postId,
        content: content.trim(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error adding comment:", error);
    throw error;
  }

  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

export function subscribeToComments(
  postId: string,
  callback: (comment: Comment) => void
) {
  const subscription = supabase
    .channel(`comments:${postId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "comments",
        filter: `post_id=eq.${postId}`,
      },
      (payload) => {
        callback(payload.new as Comment);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}