import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, ArrowLeft } from "lucide-react";

interface AddressInputProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  onBack: () => void;
  loading: boolean;
}

interface Suggestion {
  display_name: string;
  lat: number;
  lng: number;
}

export function AddressInput({
  onAddressSelect,
  onBack,
  loading,
}: AddressInputProps) {
  const [address, setAddress] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Using Nominatim (OpenStreetMap) for geocoding - free alternative
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&countrycodes=in&addressdetails=1`
      );
      const data = await response.json();

      interface NominatimResult {
        display_name: string;
        lat: string;
        lon: string;
      }

      const formattedSuggestions: Suggestion[] = (data as NominatimResult[]).map((item) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));

      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error("Geocoding error:", error);
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeoutId = setTimeout(() => {
      searchAddress(value);
    }, 500);

    setSearchTimeout(timeoutId);
  };

  const handleSelect = (suggestion: Suggestion) => {
    onAddressSelect(suggestion.display_name, suggestion.lat, suggestion.lng);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card p-6"
        >
          <div className="flex items-center mb-6">
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mr-3"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Enter Your Location
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We'll use this to show you nearby posts
              </p>
            </div>
          </div>

          <div className="relative mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="Enter your address or area..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={loading}
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSelect(suggestion)}
                  className="w-full text-left p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  disabled={loading}
                >
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors mr-3 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                        {suggestion.display_name.split(",")[0]}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {suggestion.display_name}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {address.length >= 3 &&
            suggestions.length === 0 &&
            !searchLoading && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No locations found. Try a different search term.
                </p>
              </div>
            )}

          {address.length > 0 && address.length < 3 && (
            <div className="text-center py-4">
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Type at least 3 characters to search...
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Privacy Note:</strong> We only use your location to show
              you posts within 1km radius. Your exact address is never shared
              with other users.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}