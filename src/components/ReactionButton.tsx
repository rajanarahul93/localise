import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Smile } from "lucide-react";
import toast from "react-hot-toast";
import { addReaction, getReactions, getUserReaction, reportContent } from "../lib/reactions";
import type { ReactionType } from "../types";

const reactions: ReactionType[] = ["👍", "😍", "💯", "⚠️"];

interface ReactionButtonProps {
  targetId: string;
  targetType: "post" | "comment";
  onReactionChange?: () => Promise<void>;
}

export function ReactionButton({ targetId, targetType, onReactionChange }: ReactionButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    "👍": 0,
    "😍": 0,
    "💯": 0,
    "⚠️": 0,
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReactions();
  }, [targetId]);

  const loadReactions = async () => {
    try {
      const counts = await getReactions(targetId, targetType);
      setReactionCounts(counts);
      const userReact = await getUserReaction(targetId, targetType);
      setUserReaction(userReact);
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  };

  const handleReaction = async (reaction: ReactionType) => {
    setLoading(true);
    try {
      await addReaction(targetId, reaction, targetType);
      await loadReactions();
      setShowPicker(false);
      if (onReactionChange) await onReactionChange();
      toast.success("Reaction added!");
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction");
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!window.confirm("Report this content as inappropriate?")) return;

    setLoading(true);
    try {
      await reportContent(targetId, targetType);
      toast.success("Report submitted. Thank you for helping keep our community safe!");
      setShowPicker(false);
    } catch (error) {
      console.error("Error reporting content:", error);
      toast.error("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        {/* Show user's reaction emoji if they reacted */}
        {userReaction && (
          <span className="text-lg">{userReaction}</span>
        )}

        {/* Reaction count badge */}
        {totalReactions > 0 && (
          <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full px-2 py-0.5 font-medium">
            {totalReactions}
          </span>
        )}

        {/* Emoji picker button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPicker(!showPicker)}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Add reaction"
        >
          <Smile className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </motion.button>
      </div>

      {showPicker && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-20 flex gap-1 border border-gray-200 dark:border-gray-700"
        >
          {reactions.map((reaction) => (
            <motion.button
              key={reaction}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleReaction(reaction)}
              disabled={loading}
              className={`text-2xl p-1 rounded-lg transition-colors ${
                userReaction === reaction
                  ? "bg-primary-100 dark:bg-primary-900/30"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              title={`React with ${reaction}`}
            >
              {reaction}
            </motion.button>
          ))}

          <div className="w-px bg-gray-200 dark:bg-gray-700" />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleReport}
            disabled={loading}
            className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Report as inappropriate"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
          </motion.button>
        </motion.div>
      )}

      {showPicker && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
