import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  loading: boolean;
}

export function CommentForm({ onSubmit, loading }: CommentFormProps) {
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    await onSubmit(content);
    setContent("");
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      <div className="flex gap-3">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            rows={3}
            maxLength={500}
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {content.length}/500 characters
            </span>
          </div>
        </div>
        <button
          type="submit"
          disabled={!content.trim() || loading}
          className="btn-primary h-fit px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.form>
  );
}
