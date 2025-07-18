import { motion } from "framer-motion";
import { MessageSquare, Plus } from "lucide-react";

interface EmptyStateProps {
  filter: string;
  onCreatePost: () => void;
}

export function EmptyState({ filter, onCreatePost }: EmptyStateProps) {
  const getEmptyMessage = () => {
    switch (filter) {
      case "events":
        return "No events happening nearby right now.";
      case "for-sale":
        return "Nothing for sale in your area yet.";
      case "help":
        return "No help requests at the moment.";
      case "recommendations":
        return "No recommendations shared yet.";
      default:
        return "No posts in your area yet.";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <MessageSquare className="w-8 h-8 text-gray-400" />
      </motion.div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {getEmptyMessage()}
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
        Be the first to share something with your neighbors within 1km radius.
      </p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreatePost}
        className="btn-primary inline-flex items-center"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create First Post
      </motion.button>
    </motion.div>
  );
}
