import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, X } from "lucide-react";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import toast from "react-hot-toast";

interface CommentFormProps {
  onSubmit: (content: string, files?: File[]) => Promise<void>;
  loading: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for comments
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

interface FilePreview {
  id: string;
  file: File;
  preview: string;
}

export function CommentForm({ onSubmit, loading }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only images are supported (JPG, PNG, GIF, WebP)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FilePreview[] = [];
    for (let i = 0; i < Math.min(selectedFiles.length, 3); i++) {
      const file = selectedFiles[i];
      const error = validateFile(file);

      if (error) {
        toast.error(`${file.name}: ${error}`, { duration: 4000 });
      } else {
        const preview = URL.createObjectURL(file);
        newFiles.push({ id: crypto.randomUUID(), file, preview });
      }
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev.slice(0, 2), ...newFiles].slice(0, 3));
    }

    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && files.length === 0) || loading) return;

    await onSubmit(content, files.length > 0 ? files.map((f) => f.file) : undefined);
    setContent("");
    setFiles([]);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      {/* Textarea with relative positioning for button overlay */}
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

          {/* Attachment button inside textarea - bottom left */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || files.length >= 3}
            className="absolute bottom-2 left-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
            title={files.length >= 3 ? "Maximum 3 images" : "Add attachment"}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Character count - bottom right */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
            {content.length}/500
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={loading || files.length >= 3}
          className="hidden"
        />

        {/* Attachment previews */}
        {files.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 px-1">
            {files.map((item) => (
              <div key={item.id} className="relative flex-shrink-0 group">
                <img
                  src={item.preview}
                  alt="preview"
                  className="h-20 w-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  disabled={loading}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-full p-1 text-white transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit button */}
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={(!content.trim() && files.length === 0) || loading}
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
