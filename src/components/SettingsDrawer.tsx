import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Settings,
  MapPin,
  Trash2,
  Info,
  Moon,
  Sun,
  Monitor,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "./ui/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onClearCache: () => void;
  onChangeLocation: () => void;
  userLocation: { lat: number; lng: number } | null;
  isManualLocation: boolean;
}

export function SettingsDrawer({
  isOpen,
  onClose,
  onClearCache,
  onChangeLocation,
  userLocation,
  isManualLocation,
}: SettingsDrawerProps) {
  const { theme } = useTheme();
  const { signOut } = useAuth();

  const formatLocation = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const settingsItems = [
    {
      icon: theme === "light" ? Sun : theme === "dark" ? Moon : Monitor,
      title: "Theme",
      description: "Choose your preferred theme",
      action: <ThemeToggle />,
    },
    {
      icon: MapPin,
      title: "Location",
      description: userLocation
        ? `${isManualLocation ? "Manual: " : "GPS: "}${formatLocation(
            userLocation.lat,
            userLocation.lng
          )}`
        : "No location set",
      action: (
        <button
          onClick={onChangeLocation}
          className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:text-primary-700 dark:hover:text-primary-300"
        >
          Change
        </button>
      ),
    },
    {
      icon: Trash2,
      title: "Clear Cache",
      description: "Remove stored data and preferences",
      action: (
        <button
          onClick={onClearCache}
          className="text-red-600 dark:text-red-400 text-sm font-medium hover:text-red-700 dark:hover:text-red-300"
        >
          Clear
        </button>
      ),
    },
    {
      icon: LogOut,
      title: "Sign Out",
      description: "Log out of your account",
      action: (
        <button
          onClick={signOut}
          className="text-red-600 dark:text-red-400 text-sm font-medium hover:text-red-700 dark:hover:text-red-300"
        >
          Sign Out
        </button>
      ),
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute left-0 top-0 h-full w-full max-w-lg sm:w-[28rem] bg-white dark:bg-gray-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Settings className="w-6 h-6 text-primary-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Settings
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto h-full pb-32">
              {settingsItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start justify-between"
                >
                  <div className="flex items-start flex-1">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 mr-4">
                      <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">{item.action}</div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Info className="w-4 h-4 mr-2" />
                <span>Localize PWA v1.0</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Built with React, TypeScript & Supabase
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}