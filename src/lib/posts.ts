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

async function uploadAttachment(file: File, postId: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${postId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("post-attachments")
    .upload(fileName, file);

  if (error) {
    console.error("Error uploading file:", error);
    throw error;
  }

  return data.path;
}

export async function createPost(
  post: Omit<Post, "id" | "created_at" | "user_id">,
  files?: File[]
): Promise<Post> {
  // Get current user (will be anonymous user)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const attachmentPaths: string[] = [];

  // Insert post first to get the ID for file organization
  const { data: newPost, error: insertError } = await supabase
    .from("posts")
    .insert([
      {
        ...post,
        user_id: user?.id,
        attachments: [],
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error("Error creating post:", insertError);
    throw insertError;
  }

  // Upload files if provided
  if (files && files.length > 0) {
    console.log("Uploading files for post:", newPost.id);
    for (const file of files) {
      const path = await uploadAttachment(file, newPost.id);
      console.log("Uploaded file to:", path);
      attachmentPaths.push(path);
    }

    console.log("Attachment paths:", attachmentPaths);

    // Update post with attachment paths
    const { data: updatedData, error: updateError } = await supabase
      .from("posts")
      .update({ attachments: attachmentPaths })
      .eq("id", newPost.id)
      .select();

    console.log("Update response:", { updatedData, updateError });

    if (updateError) {
      console.error("Error updating post with attachments:", updateError);
      throw updateError;
    }

    if (!updatedData || updatedData.length === 0) {
      console.error("Update returned no rows. Returning post with attachments manually.");
      return { ...newPost, attachments: attachmentPaths };
    }

    return updatedData[0];
  }

  return newPost;
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
