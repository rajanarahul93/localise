import { motion } from "framer-motion";
import type { FilterCategory } from "../types";

interface FilterTabsProps {
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  postCounts: Record<FilterCategory, number>;
}

const filterLabels = {
  all: "All",
  events: "Events",
  "for-sale": "For Sale",
  help: "Help",
  recommendations: "Tips",
};

export function FilterTabs({
  activeFilter,
  onFilterChange,
  postCounts,
}: FilterTabsProps) {
  const filters: FilterCategory[] = [
    "all",
    "events",
    "for-sale",
    "help",
    "recommendations",
  ];

  return (
    <div className="flex overflow-x-auto pb-2 mb-6 space-x-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            activeFilter === filter
              ? "bg-primary-500 text-white shadow-soft"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          {filterLabels[filter]}
          {postCounts[filter] > 0 && (
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeFilter === filter
                  ? "bg-white/20 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {postCounts[filter]}
            </span>
          )}

          {activeFilter === filter && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-primary-500 rounded-full -z-10"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}