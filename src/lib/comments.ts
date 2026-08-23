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

async function uploadCommentAttachment(
  file: File,
  commentId: string
): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${commentId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("comment-attachments")
    .upload(fileName, file);

  if (error) {
    console.error("Error uploading comment file:", error);
    throw new Error(`Failed to upload "${file.name}": ${error.message}`);
  }

  return data.path;
}

export async function addComment(
  postId: string,
  content: string,
  files?: File[]
): Promise<Comment> {
  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        post_id: postId,
        content: content.trim(),
        attachments: [],
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error adding comment:", error);
    throw error;
  }

  if (files && files.length > 0) {
    const attachmentPaths: string[] = [];
    try {
      for (const file of files) {
        const path = await uploadCommentAttachment(file, data.id);
        attachmentPaths.push(path);
      }

      const { data: updatedComment, error: updateError } = await supabase
        .from("comments")
        .update({ attachments: attachmentPaths })
        .eq("id", data.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedComment;
    } catch (error) {
      // Cleanup uploaded files if comment update fails
      if (attachmentPaths.length > 0) {
        try {
          await supabase.storage
            .from("comment-attachments")
            .remove(attachmentPaths);
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
      }
      // Delete comment
      await supabase.from("comments").delete().eq("id", data.id);
      throw error;
    }
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