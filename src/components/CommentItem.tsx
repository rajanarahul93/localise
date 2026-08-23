import { motion } from "framer-motion";
import { Clock, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ReactionButton } from "./ReactionButton";
import type { Comment } from "../types";

interface CommentItemProps {
  comment: Comment;
  onDelete: (commentId: string) => void;
}

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  const { user } = useAuth();
  const isOwner = user?.id === comment.user_id;

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - commentTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {comment.user_id.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatTimeAgo(comment.created_at)}
          </div>
          {comment.updated_at && comment.updated_at !== comment.created_at && (
            <span className="text-xs italic text-gray-400">edited</span>
          )}
        </div>

        {isOwner && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(comment.id)}
            className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </motion.button>
        )}
      </div>

      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
        {comment.content}
      </p>

      <div className="mb-3">
        <ReactionButton targetId={comment.id} targetType="comment" />
      </div>
    </motion.div>
  );
}
