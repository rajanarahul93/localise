import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-hide offline message after 5 seconds
  useEffect(() => {
    if (showOfflineMessage && !isOnline) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showOfflineMessage, isOnline]);

  return (
    <AnimatePresence>
      {showOfflineMessage && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 shadow-soft">
            <div className="flex items-center">
              <WifiOff className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3" />
              <div>
                <h3 className="font-medium text-orange-800 dark:text-orange-200 text-sm">
                  You're offline
                </h3>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Some features may not work
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {isOnline && showOfflineMessage && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 shadow-soft">
            <div className="flex items-center">
              <Wifi className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <h3 className="font-medium text-green-800 dark:text-green-200 text-sm">
                  Back online
                </h3>
                <p className="text-xs text-green-600 dark:text-green-400">
                  All features are available
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}