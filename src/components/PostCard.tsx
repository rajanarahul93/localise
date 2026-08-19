import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, MessageCircle, Trash2, FileText, Download } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "./ui/Modal";
import { CommentsList } from "./CommentsList";
import { supabase } from "../lib/supabase";
import { deletePostAttachments, queueAttachmentCleanup } from "../lib/posts";
import type { Post } from "../types";
import toast from "react-hot-toast";

interface PostCardProps {
  post: Post;
  distance?: number;
  onDelete?: (postId: string) => void;
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

export function PostCard({ post, distance, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);
  const isOwner = user?.id === post.user_id;

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

          <div className="flex items-center gap-2">
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
              <Clock className="w-4 h-4 mr-1" />
              {formatTimeAgo(post.created_at)}
            </div>

            {isOwner && onDelete && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </motion.button>
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

        <div className="flex items-center justify-between">
          {distance !== undefined && (
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {distance < 0.1 ? "Very close" : `${distance.toFixed(1)}km away`}
            </div>
          )}

          <button
            onClick={() => setShowComments(true)}
            className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">
              {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
            </span>
          </button>
        </div>
      </motion.div>

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