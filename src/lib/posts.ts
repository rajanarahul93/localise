import { supabase } from "./supabase";
import type { Post } from "../types";

export async function fetchPosts(includeArchived = false): Promise<Post[]> {
  let query = supabase.from("posts").select("*");

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query
    .order("last_bumped_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }

  // Filter out expired posts client-side (but keep archived posts if requested)
  const now = new Date();
  return (data || []).filter(post => {
    if (post.is_archived) {
      return includeArchived;
    }
    return new Date(post.expires_at) > now;
  });
}

async function uploadAttachment(
  file: File,
  postId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${postId}/${Date.now()}.${ext}`;

  // Simulate progress updates during upload (browser doesn't expose real progress for simple upload)
  onProgress?.(0);

  const { data, error } = await supabase.storage
    .from("post-attachments")
    .upload(fileName, file);

  if (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Failed to upload "${file.name}": ${error.message}`);
  }

  onProgress?.(100);
  return data.path;
}

export async function deletePostAttachments(paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  const { error } = await supabase.storage
    .from("post-attachments")
    .remove(paths);

  if (error) {
    console.error("Error deleting attachments:", error);
    throw error;
  }
}

const CLEANUP_STORAGE_KEY = "localize_pending_attachment_cleanup";
let attachmentCleanupPromise: Promise<void> | null = null;

function getPersistentPendingCleanup(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(CLEANUP_STORAGE_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function persistPendingCleanup(paths: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    if (paths.size === 0) {
      localStorage.removeItem(CLEANUP_STORAGE_KEY);
    } else {
      localStorage.setItem(CLEANUP_STORAGE_KEY, JSON.stringify([...paths]));
    }
  } catch (error) {
    console.error("Failed to persist cleanup queue:", error);
  }
}

async function processAttachmentCleanupQueue() {
  const pendingPaths = getPersistentPendingCleanup();
  if (pendingPaths.size === 0) return;

  const maxAttempts = 5;
  const failedPaths = new Set<string>();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pathsToProcess = [...pendingPaths];
    if (pathsToProcess.length === 0) break;

    try {
      await deletePostAttachments(pathsToProcess);
      // Clear successfully deleted paths
      pathsToProcess.forEach((path) => pendingPaths.delete(path));
      persistPendingCleanup(pendingPaths);
    } catch (error) {
      console.error(`Cleanup attempt ${attempt + 1}/${maxAttempts} failed:`, error);
      failedPaths.clear();
      pathsToProcess.forEach((path) => failedPaths.add(path));

      // Exponential backoff before retry, but only retry if we haven't exhausted attempts
      if (attempt < maxAttempts - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Cap at 30s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  persistPendingCleanup(pendingPaths);
}

export function queueAttachmentCleanup(paths: string[]) {
  const pending = getPersistentPendingCleanup();
  paths.forEach((path) => pending.add(path));
  persistPendingCleanup(pending);

  if (!attachmentCleanupPromise) {
    attachmentCleanupPromise = processAttachmentCleanupQueue().finally(() => {
      attachmentCleanupPromise = null;
    });
  }
}

// Process any pending cleanups on module load
if (typeof window !== "undefined") {
  const pending = getPersistentPendingCleanup();
  if (pending.size > 0) {
    if (!attachmentCleanupPromise) {
      attachmentCleanupPromise = processAttachmentCleanupQueue().finally(() => {
        attachmentCleanupPromise = null;
      });
    }
  }
}

async function cleanupNewPost(postId: string, attachmentPaths: string[]) {
  if (attachmentPaths.length > 0) {
    try {
      await deletePostAttachments(attachmentPaths);
    } catch (cleanupError) {
      console.error("Attachment cleanup error:", cleanupError);
      queueAttachmentCleanup(attachmentPaths);
    }
  }

  try {
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);
    if (deleteError) {
      console.error("Post cleanup error:", deleteError);
    }
  } catch (cleanupError) {
    console.error("Post cleanup error:", cleanupError);
  }
}

export async function createPost(
  post: Omit<Post, "id" | "created_at" | "user_id" | "expires_at" | "is_archived" | "bump_count" | "last_bumped_at">,
  files?: File[],
  onUploadProgress?: (progress: { [key: number]: number }) => void
): Promise<Post> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const attachmentPaths: string[] = [];

  const { data: newPost, error: insertError } = await supabase
    .from("posts")
    .insert([
      {
        ...post,
        user_id: user?.id,
        attachments: [],
        is_archived: false,
        bump_count: 0,
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error("Error creating post:", insertError);
    throw insertError;
  }

  if (files && files.length > 0) {
    console.log("Uploading files for post:", newPost.id);
    const progress: { [key: number]: number } = {};

    for (let i = 0; i < files.length; i++) {
      try {
        const path = await uploadAttachment(files[i], newPost.id, (p) => {
          progress[i] = p;
          onUploadProgress?.({ ...progress });
        });
        console.log("Uploaded file to:", path);
        attachmentPaths.push(path);
      } catch (error) {
        await cleanupNewPost(newPost.id, attachmentPaths);
        throw error;
      }
    }

    console.log("Attachment paths:", attachmentPaths);

    const { data: updatedData, error: updateError } = await supabase
      .from("posts")
      .update({ attachments: attachmentPaths })
      .eq("id", newPost.id)
      .select();

    if (updateError) {
      console.error("Error updating post with attachments:", updateError);
      await cleanupNewPost(newPost.id, attachmentPaths);
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

export async function updatePost(
  postId: string,
  updates: {
    title?: string;
    description?: string;
  }
): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .select()
    .single();

  if (error) {
    console.error("Error updating post:", error);
    throw error;
  }

  return data;
}

export async function deletePost(postId: string): Promise<void> {
  try {
    // Fetch post to get attachment paths
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("attachments")
      .eq("id", postId)
      .single();

    if (fetchError) {
      console.error("Error fetching post:", fetchError);
      throw fetchError;
    }

    // Delete attachments from storage
    if (post?.attachments && post.attachments.length > 0) {
      await deletePostAttachments(post.attachments);
    }

    // Delete post record
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      throw deleteError;
    }
  } catch (error) {
    console.error("Error in deletePost:", error);
    throw error;
  }
}

export async function bumpPost(postId: string): Promise<Post> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Fetch current post to get bump_count
  const { data: currentPost, error: fetchError } = await supabase
    .from("posts")
    .select("bump_count")
    .eq("id", postId)
    .single();

  if (fetchError) {
    console.error("Error fetching post for bump:", fetchError);
    throw fetchError;
  }

  const newBumpCount = (currentPost?.bump_count || 0) + 1;

  const { data, error } = await supabase
    .from("posts")
    .update({
      last_bumped_at: now,
      bump_count: newBumpCount,
      expires_at: expiresAt,
    })
    .eq("id", postId)
    .select()
    .single();

  if (error) {
    console.error("Error bumping post:", error);
    throw error;
  }

  return data;
}

export async function archivePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from("posts")
    .update({ is_archived: true })
    .eq("id", postId);

  if (error) {
    console.error("Error archiving post:", error);
    throw error;
  }
}

export async function unarchivePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from("posts")
    .update({ is_archived: false })
    .eq("id", postId);

  if (error) {
    console.error("Error unarchiving post:", error);
    throw error;
  }
}
