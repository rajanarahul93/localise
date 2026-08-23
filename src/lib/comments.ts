import { supabase } from "./supabase";
import type { Comment } from "../types";

export async function getCommentCount(postId: string): Promise<number> {
  const { data, error } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) {
    console.error("Error fetching comment count:", error);
    return 0;
  }

  return data?.length || 0;
}

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

  const comments = data || [];

  const { data: reactionCounts, error: reactionError } = await supabase
    .from("reactions")
    .select("comment_id, reaction_type")
    .in("comment_id", comments.map((c) => c.id));

  if (reactionError) {
    console.warn("Error fetching reaction counts:", reactionError);
  } else {
    const countMap = new Map<string, number>();
    (reactionCounts || []).forEach(({ comment_id }) => {
      countMap.set(comment_id, (countMap.get(comment_id) || 0) + 1);
    });

    comments.forEach((comment) => {
      comment.reaction_count = countMap.get(comment.id) || 0;
    });
  }

  return comments;
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
  try {
    // Fetch comment to get attachment paths
    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("attachments")
      .eq("id", commentId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    // Delete attachments from storage
    if (comment?.attachments && comment.attachments.length > 0) {
      try {
        await supabase.storage
          .from("comment-attachments")
          .remove(comment.attachments);
      } catch (storageError) {
        console.error("Error deleting comment attachments:", storageError);
      }
    }

    // Delete comment record
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      console.error("Error deleting comment:", deleteError);
      throw deleteError;
    }
  } catch (error) {
    console.error("Error in deleteComment:", error);
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