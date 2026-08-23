import { useState } from "react";
import { motion } from "framer-motion";
import { Modal } from "./ui/Modal";
import { FormInput } from "./ui/FormInput";
import { FormTextarea } from "./ui/FormTextarea";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import type { Post } from "../types";
import toast from "react-hot-toast";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onSave: (updates: { title: string; description: string }) => Promise<void>;
}

export function EditPostModal({
  isOpen,
  onClose,
  post,
  onSave,
}: EditPostModalProps) {
  const [title, setTitle] = useState(post.title);
  const [description, setDescription] = useState(post.description);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { title?: string; description?: string } = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
      });
      toast.success("Post updated!");
      onClose();
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Post">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <FormInput
          label="Title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({ ...errors, title: undefined });
          }}
          placeholder="Post title..."
          maxLength={100}
          error={errors.title}
          disabled={isSubmitting}
        />

        <FormTextarea
          label="Description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors({ ...errors, description: undefined });
          }}
          placeholder="Post description..."
          rows={4}
          maxLength={500}
          error={errors.description}
          disabled={isSubmitting}
        />

        <div className="text-sm text-gray-500 dark:text-gray-400">
          {description.length}/500 characters
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </div>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </motion.form>
    </Modal>
  );
}
