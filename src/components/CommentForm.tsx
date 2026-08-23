import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  loading: boolean;
}

export function CommentForm({ onSubmit, loading }: CommentFormProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      <div className="relative space-y-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            rows={3}
            maxLength={500}
            disabled={loading}
          />

          <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
            {content.length}/500
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={!content.trim() || loading}
          className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              Posting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Post
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}
