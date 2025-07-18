import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { key: "light", icon: Sun, label: "Light" },
    { key: "dark", icon: Moon, label: "Dark" },
    { key: "system", icon: Monitor, label: "System" },
  ] as const;

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
      {themes.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
            theme === key
              ? "text-primary-600 dark:text-primary-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          {theme === key && (
            <motion.div
              layoutId="theme-active"
              className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <Icon className="w-4 h-4 relative z-10" />
          <span className="ml-2 relative z-10">{label}</span>
        </button>
      ))}
    </div>
  );
}