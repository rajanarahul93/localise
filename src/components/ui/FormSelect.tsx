import { forwardRef } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string; emoji?: string }[];
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, options, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            className={`
              block w-full rounded-xl border-gray-300 dark:border-gray-600 
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-colors appearance-none
              px-4 py-3 pr-10
              ${error ? "border-red-300 dark:border-red-600" : ""}
              ${className}
            `}
            {...props}
          >
            <option value="">Select a category</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.emoji
                  ? `${option.emoji} ${option.label}`
                  : option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";