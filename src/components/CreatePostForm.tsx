import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Type, Tag } from "lucide-react";
import { FormInput } from "./ui/FormInput";
import { FormTextarea } from "./ui/FormTextarea";
import { FormSelect } from "./ui/FormSelect";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { createPost } from "../lib/posts";
import type { Location } from "../types";
import toast from "react-hot-toast";

interface CreatePostFormProps {
  userLocation: Location;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  description: string;
  category: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
}

const categoryOptions = [
  { value: "events", label: "Events", emoji: "🎉" },
  { value: "for-sale", label: "For Sale", emoji: "💰" },
  { value: "help", label: "Help Needed", emoji: "🤝" },
  { value: "recommendations", label: "Recommendations", emoji: "⭐" },
];

export function CreatePostForm({
  userLocation,
  onSuccess,
  onCancel,
}: CreatePostFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await createPost({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category as any,
        lat: userLocation.lat,
        lng: userLocation.lng,
      });

      toast.success("Post created successfully!", {
        icon: "🎉",
        duration: 3000,
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Category Selection */}
      <FormSelect
        label="Category"
        value={formData.category}
        onChange={(e) => handleInputChange("category", e.target.value)}
        options={categoryOptions}
        error={errors.category}
        disabled={isSubmitting}
      />

      {/* Title Input */}
      <FormInput
        label="Title"
        type="text"
        value={formData.title}
        onChange={(e) => handleInputChange("title", e.target.value)}
        placeholder="Brief, descriptive title..."
        maxLength={100}
        icon={<Type className="w-5 h-5 text-gray-400" />}
        error={errors.title}
        disabled={isSubmitting}
      />

      {/* Description Textarea */}
      <FormTextarea
        label="Description"
        value={formData.description}
        onChange={(e) => handleInputChange("description", e.target.value)}
        placeholder="Provide more details about your post..."
        rows={4}
        maxLength={500}
        error={errors.description}
        disabled={isSubmitting}
      />

      {/* Character Counter */}
      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>{formData.description.length}/500 characters</span>
        <span className="flex items-center">
          <Tag className="w-4 h-4 mr-1" />
          Anonymous post
        </span>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Privacy:</strong> Your post will be visible to people within
          1km of your current location. Your exact location and personal
          information are never shared.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            !formData.title.trim() ||
            !formData.description.trim() ||
            !formData.category
          }
          className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner size="sm" className="mr-2" />
              Posting...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Send className="w-5 h-5 mr-2" />
              Post Now
            </div>
          )}
        </button>
      </div>
    </motion.form>
  );
}