import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Type, Tag, Upload, X } from "lucide-react";
import { FormInput } from "./ui/FormInput";
import { FormTextarea } from "./ui/FormTextarea";
import { FormSelect } from "./ui/FormSelect";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { createPost } from "../lib/posts";
import type { Location, Post } from "../types";
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

interface FilePreview {
  id: string;
  file: File;
  preview: string;
}

interface FileUploadProgress {
  [key: string]: number;
}

interface RejectedFile {
  id: string;
  name: string;
  error: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<RejectedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "File type not supported. Allowed: images, PDF, DOC";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FilePreview[] = [];
    const newRejectedFiles: RejectedFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const id = crypto.randomUUID();
      const error = validateFile(file);

      if (error) {
        newRejectedFiles.push({ id, name: file.name, error });
        toast.error(`${file.name}: ${error}`, { duration: 4000 });
      } else {
        const preview = URL.createObjectURL(file);
        newFiles.push({ id, file, preview });
      }
    }

    if (newRejectedFiles.length > 0) {
      setRejectedFiles((prev) => [...prev, ...newRejectedFiles]);
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      toast.success(`Added ${newFiles.length} file(s)`, { duration: 2000 });
    }

    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((item) => item.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((item) => item.id !== id);
    });
    setUploadProgress((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

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
    const uploadToastId = toast.loading("Creating post with attachments...");

    try {
      const fileObjects = files.map((f) => f.file);
      await createPost(
        {
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category as Post["category"],
          lat: userLocation.lat,
          lng: userLocation.lng,
        },
        fileObjects.length > 0 ? fileObjects : undefined,
        (progress) => {
          const progressById = Object.fromEntries(
            Object.entries(progress).flatMap(([index, value]) => {
              const file = files[Number(index)];
              return file ? [[file.id, value]] : [];
            })
          );
          setUploadProgress(progressById);
          const totalProgress = Object.values(progressById).reduce((a, b) => a + b, 0) / fileObjects.length || 0;
          if (fileObjects.length > 0) {
            toast.loading(`Uploading files... ${Math.round(totalProgress)}%`, {
              id: uploadToastId,
            });
          }
        }
      );

      toast.success("Post created successfully!", {
        icon: "🎉",
        duration: 3000,
        id: uploadToastId,
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating post:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create post. Please try again.";
      toast.error(errorMessage, { id: uploadToastId });
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

      {/* File Upload Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Attachments (optional)
        </label>

        <div className="flex gap-3 items-stretch overflow-x-auto pb-2">
          {/* Upload Button */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-28 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex flex-col items-center justify-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={isSubmitting}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />
            <Upload className="w-5 h-5 text-gray-400 mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Upload file
            </p>
          </div>

          {/* File Previews - Horizontal Scroll */}
          {files.map((item) => (
            <div key={item.id} className="flex-shrink-0 relative">
              <div
                className={`relative group rounded-lg overflow-hidden w-28 h-28 flex items-center justify-center ${
                  isSubmitting
                    ? "bg-gray-100 dark:bg-gray-800 opacity-50"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                {item.file.type.startsWith("image/") ? (
                  <img
                    src={item.preview}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 p-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400 text-center line-clamp-2">
                      {item.file.name}
                    </span>
                  </div>
                )}

                {isSubmitting && uploadProgress[item.id] !== undefined && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs font-semibold text-white">
                        {uploadProgress[item.id]}%
                      </div>
                    </div>
                  </div>
                )}

                {!isSubmitting && (
                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    disabled={isSubmitting}
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {rejectedFiles.map((item) => (
            <div key={item.id} className="flex-shrink-0 relative w-28">
              <div className="w-28 h-28 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 flex items-center justify-center">
                <span className="text-xs text-red-600 dark:text-red-400 text-center line-clamp-3">
                  {item.name}
                </span>
              </div>
              <div className="absolute top-full mt-1 left-0 right-0 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-2 py-1 text-xs text-red-600 dark:text-red-400">
                {item.error}
              </div>
            </div>
          ))}
        </div>
        {files.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {files.length} file{files.length !== 1 ? "s" : ""} selected (
            {(files.reduce((sum, f) => sum + f.file.size, 0) / 1024 / 1024).toFixed(1)}MB)
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Images (JPG, PNG, GIF, WebP), PDF, DOC files up to 10MB each
        </p>
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