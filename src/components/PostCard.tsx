import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, MessageCircle, Trash2, FileText, Download, Edit2, RotateCcw, Archive } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "./ui/Modal";
import { CommentsList } from "./CommentsList";
import { EditPostModal } from "./EditPostModal";
import { ReactionButton } from "./ReactionButton";
import { supabase } from "../lib/supabase";
import { deletePostAttachments, queueAttachmentCleanup, updatePost, bumpPost, archivePost, unarchivePost } from "../lib/posts";
import { getCommentCount } from "../lib/comments";
import type { Post } from "../types";
import toast from "react-hot-toast";

interface PostCardProps {
  post: Post;
  distance?: number;
  onDelete?: (postId: string) => void;
  onArchiveChange?: () => Promise<void>;
  isArchived?: boolean;
}

const categoryColors = {
  events:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  "for-sale":
    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  help: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
  recommendations:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
};

const categoryEmojis = {
  events: "🎉",
  "for-sale": "💰",
  help: "🤝",
  recommendations: "⭐",
};

const attachmentDeletionQueues = new Map<string, Promise<void>>();

function enqueueAttachmentDeletion(
  postId: string,
  operation: () => Promise<void>
): Promise<void> {
  const previous = attachmentDeletionQueues.get(postId) || Promise.resolve();
  const next = previous.catch(() => undefined).then(operation);
  attachmentDeletionQueues.set(postId, next);
  return next.finally(() => {
    if (attachmentDeletionQueues.get(postId) === next) {
      attachmentDeletionQueues.delete(postId);
    }
  });
}

export function PostCard({ post: initialPost, distance, onDelete, onArchiveChange, isArchived = false }: PostCardProps) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isBumping, setIsBumping] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const isOwner = user?.id === post.user_id;

  useEffect(() => {
    loadCommentCount();
  }, [post.id]);

  const loadCommentCount = async () => {
    try {
      const count = await getCommentCount(post.id);
      setCommentCount(count);
    } catch (error) {
      console.error("Error loading comment count:", error);
    }
  };

  const handleEditPost = async (updates: { title: string; description: string }) => {
    try {
      const updatedPost = await updatePost(post.id, updates);
      setPost(updatedPost);
      toast.success("Post updated!");
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - postTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getTimeUntilExpiration = () => {
    const now = new Date();
    const expiresAt = new Date(post.expires_at);
    const diffInMinutes = Math.floor(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 0) return null;
    if (diffInMinutes < 60) return `${diffInMinutes}m left`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h left`;
    return `${Math.floor(diffInMinutes / 1440)}d left`;
  };

  const handleBump = async () => {
    setIsBumping(true);
    try {
      const updatedPost = await bumpPost(post.id);
      setPost(updatedPost);
      toast.success(`Post refreshed! (${updatedPost.bump_count} bumps)`);
    } catch (error) {
      console.error("Error bumping post:", error);
      toast.error("Failed to refresh post");
    } finally {
      setIsBumping(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await archivePost(post.id);
      toast.success("Post archived");
      if (onArchiveChange) {
        await onArchiveChange();
      }
    } catch (error) {
      console.error("Error archiving post:", error);
      toast.error("Failed to archive post");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    setIsArchiving(true);
    try {
      await unarchivePost(post.id);
      toast.success("Post restored to feed");
      if (onArchiveChange) {
        await onArchiveChange();
      }
    } catch (error) {
      console.error("Error unarchiving post:", error);
      toast.error("Failed to restore post");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = () => {
    if (
      onDelete &&
      window.confirm("Are you sure you want to delete this post?")
    ) {
      onDelete(post.id);
    }
  };

  const getAttachmentUrl = (path: string) => {
    const { data } = supabase.storage
      .from("post-attachments")
      .getPublicUrl(path);
    console.log("Attachment path:", path, "Public URL:", data.publicUrl);
    return data.publicUrl;
  };

  const isImageFile = (path: string) => {
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    return imageExts.some((ext) => path.toLowerCase().endsWith(ext));
  };

  const handleDeleteAttachment = async (path: string) => {
    if (!isOwner) {
      toast.error("Only post owner can delete attachments");
      return;
    }

    if (!window.confirm("Delete this attachment?")) return;

    if (deletingAttachment !== null) return;

    await enqueueAttachmentDeletion(post.id, async () => {
      setDeletingAttachment(path);
      const maxRetries = 3;
      let attempt = 0;

      while (attempt < maxRetries) {
        try {
          // Fetch current state to detect concurrent changes
          const { data: latestPost, error: fetchError } = await supabase
            .from("posts")
            .select("attachments")
            .eq("id", post.id)
            .single();

          if (fetchError) throw fetchError;

          // Check if path still exists (compare-and-swap precondition)
          const currentAttachments = latestPost.attachments || [];
          if (!currentAttachments.includes(path)) {
            toast.success("Attachment already removed");
            return;
          }

          // Compute new state
          const updatedAttachments = currentAttachments.filter(
            (attachmentPath: string) => attachmentPath !== path
          );

          // Update only if attachments haven't changed (conflict detection)
          const { data: result, error: updateError } = await supabase
            .from("posts")
            .update({ attachments: updatedAttachments })
            .eq("id", post.id)
            .select("attachments");

          if (updateError) throw updateError;

          // Verify update succeeded (no concurrent modification check at row level)
          if (!result || result.length === 0) {
            attempt++;
            if (attempt < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
              continue;
            }
            throw new Error("Failed to update post attachments after retries");
          }

          // Delete from storage only after database confirms removal
          try {
            await deletePostAttachments([path]);
          } catch (storageError) {
            console.error("Storage deletion failed, queuing cleanup:", storageError);
            queueAttachmentCleanup([path]);
          }

          toast.success("Attachment deleted");
          window.location.reload();
          return;
        } catch (error) {
          attempt++;
          if (attempt >= maxRetries) {
            console.error("Error deleting attachment after retries:", error);
            toast.error("Failed to delete attachment");
          } else {
            // Exponential backoff and retry
            await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
          }
        }
      }
    }).finally(() => {
      setDeletingAttachment(null);
    });
  };

  if (post.attachments && post.attachments.length > 0) {
    console.log("Post has attachments:", post.attachments);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card p-6 hover:shadow-soft-lg transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              categoryColors[post.category]
            }`}
          >
            <span className="mr-1">{categoryEmojis[post.category]}</span>
            {post.category.replace("-", " ")}
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm font-medium">
              <Clock className="w-4 h-4 mr-1" />
              {post.last_bumped_at ? (
                <>
                  <span className="text-amber-600 dark:text-amber-400">Refreshed</span>
                  <span className="mx-1">{formatTimeAgo(post.last_bumped_at)}</span>
                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    {post.bump_count}x
                  </span>
                </>
              ) : (
                formatTimeAgo(post.created_at)
              )}
            </div>

            {(() => {
              const timeLeft = getTimeUntilExpiration();
              if (!timeLeft) return null;
              const isExpiringSoon = parseInt(timeLeft) < 120;
              return (
                <div className={`text-xs font-medium ${
                  isExpiringSoon
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}>
                  {timeLeft}
                </div>
              );
            })()}

            {isOwner && (
              <div className="flex items-center gap-1">
                {!isArchived && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBump}
                    disabled={isBumping}
                    className="p-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50 group relative"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-500" />
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Refresh to add 1 more day
                    </div>
                  </motion.button>
                )}

                {!isArchived && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEditModal(true)}
                    className="p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group relative"
                  >
                    <Edit2 className="w-4 h-4 text-blue-500" />
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Edit post
                    </div>
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isArchived ? handleUnarchive : handleArchive}
                  disabled={isArchiving}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 group relative"
                >
                  <Archive className={`w-4 h-4 ${
                    isArchived
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-600 dark:text-gray-400"
                  }`} />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {isArchived ? "Restore to feed" : "Hide from feed"}
                  </div>
                </motion.button>

                {onDelete && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDelete}
                    className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group relative"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Delete permanently
                    </div>
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {post.title}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {post.description}
        </p>

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="grid gap-2" style={{ gridTemplateColumns: post.attachments.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {post.attachments.map((path, index) => {
                const url = getAttachmentUrl(path);
                const isImage = isImageFile(path);
                const isDeleting = deletingAttachment === path;

                return (
                  <div key={index} className="relative group">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-80 transition-opacity ${
                        isDeleting ? "opacity-50" : ""
                      }`}
                    >
                      {isImage ? (
                        <img
                          src={url}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-auto object-contain max-h-96"
                        />
                      ) : (
                        <div className="w-full h-40 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            View file
                          </span>
                        </div>
                      )}
                    </a>

                    {isOwner && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={url}
                          download
                          className="p-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(path)}
                          disabled={deletingAttachment !== null}
                          className="p-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg text-white transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          {distance !== undefined && (
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {distance < 0.1 ? "Very close" : `${distance.toFixed(1)}km away`}
            </div>
          )}

          <div className="flex items-center gap-2">
            <ReactionButton targetId={post.id} targetType="post" />
            <button
              onClick={() => setShowComments(true)}
              className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
        onSave={handleEditPost}
      />

      {/* Comments Modal */}
      <Modal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        title={post.title}
      >
        <CommentsList postId={post.id} onCommentCountChange={setCommentCount} />
      </Modal>
    </>
  );
}