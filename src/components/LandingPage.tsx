import { motion } from "framer-motion";
import { MapPin, Users, MessageSquare, Clock, Edit3 } from "lucide-react";

interface LandingPageProps {
  onRequestLocation: () => void;
  onManualAddress: () => void;
  loading: boolean;
  error: string | null;
}

export function LandingPage({
  onRequestLocation,
  onManualAddress,
  loading,
  error,
}: LandingPageProps) {
  const features = [
    {
      icon: MapPin,
      title: "Hyper-Local",
      description: "Connect with people within 1km radius",
    },
    {
      icon: Users,
      title: "Anonymous",
      description: "Post without creating an account",
    },
    {
      icon: MessageSquare,
      title: "Real-time",
      description: "See new posts as they happen",
    },
    {
      icon: Clock,
      title: "Quick & Easy",
      description: "Share garage sales, events, and more",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-primary-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft-lg"
          >
            <MapPin className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Localize
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Your hyper-local anonymous notice board. Connect with neighbors
            within 1km radius.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
              className="card p-4 text-center"
            >
              <feature.icon className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="space-y-4"
        >
          <button
            onClick={onRequestLocation}
            disabled={loading}
            className="w-full btn-primary py-4 text-lg font-semibold relative overflow-hidden group"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Getting your location...
              </div>
            ) : (
              <>
                <MapPin className="w-5 h-5 inline mr-2" />
                Use Current Location
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-primary-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                or
              </span>
            </div>
          </div>

          <button
            onClick={onManualAddress}
            disabled={loading}
            className="w-full btn-secondary py-4 text-lg font-semibold"
          >
            <Edit3 className="w-5 h-5 inline mr-2" />
            Enter Address Manually
          </button>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
            >
              <p className="text-red-600 dark:text-red-400 text-sm text-center mb-3">
                {error}
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onManualAddress}
                className="w-full py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                Try Manual Address Instead
              </motion.button>
            </motion.div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            We use your location to show you posts from people within 1km
            radius. Your exact location is never shared publicly.
          </p>
        </motion.div>
      </div>
    </div>
  );
}