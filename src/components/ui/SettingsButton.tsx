import { motion } from "framer-motion";
import { Settings } from "lucide-react";

interface SettingsButtonProps {
  onClick: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    </motion.button>
  );
}