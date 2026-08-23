import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, TrendingUp, Clock } from "lucide-react";
import { CommentItem } from "./CommentItem";
import { CommentForm } from "./CommentForm";
import {
  fetchComments,
  addComment,
  deleteComment,
  subscribeToComments,
} from "../lib/comments";
import type { Comment } from "../types";
import toast from "react-hot-toast";

interface CommentsListProps {
  postId: string;
  onCommentCountChange: (count: number) => void;
}

export function CommentsList({
  postId,
  onCommentCountChange,
}: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<"helpful" | "recent">("recent");

  useEffect(() => {
    loadComments();
  }, [postId]);

  useEffect(() => {
    const unsubscribe = subscribeToComments(postId, (newComment) => {
      setComments((prev) => [...prev, newComment]);
    });

    return unsubscribe;
  }, [postId]);

  useEffect(() => {
    onCommentCountChange(comments.length);
  }, [comments.length, onCommentCountChange]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const fetchedComments = await fetchComments(postId);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Failed to load comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (content: string) => {
    try {
      setSubmitting(true);
      await addComment(postId, content);
      toast.success("Comment added!");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const getSortedComments = () => {
    if (sortBy === "helpful") {
      return [...comments].sort((a, b) => {
        const aReactions = a.reaction_count || 0;
        const bReactions = b.reaction_count || 0;
        return bReactions - aReactions;
      });
    }
    return comments;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">
            Loading comments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h3>
        {comments.length > 0 && (
          <div className="flex gap-1">
            <button
              onClick={() => setSortBy("helpful")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-colors ${
                sortBy === "helpful"
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Helpful
            </button>
            <button
              onClick={() => setSortBy("recent")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-colors ${
                sortBy === "recent"
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Clock className="w-4 h-4" />
              Recent
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {comments.length > 0 ? (
          <div className="space-y-3">
            {getSortedComments().map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No comments yet. Be the first to comment!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <CommentForm onSubmit={handleAddComment} loading={submitting} />
    </div>
  );
}
