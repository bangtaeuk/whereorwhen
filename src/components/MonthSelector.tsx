"use client";

import { getMonthName } from "@/lib/utils";

interface MonthSelectorProps {
  selectedMonth?: number;
  onSelect: (month: number) => void;
}

export function MonthSelector({ selectedMonth, onSelect }: MonthSelectorProps) {
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 w-full max-w-lg">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
        const isSelected = month === selectedMonth;
        const isCurrent = month === currentMonth;

        return (
          <button
            key={month}
            type="button"
            onClick={() => onSelect(month)}
            className={`
              relative px-3 py-2.5 rounded-xl text-sm font-semibold
              transition-all duration-200 ease-out
              ${
                isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900 scale-105"
                  : isCurrent
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600"
              }
            `}
            aria-pressed={isSelected}
            aria-label={`${getMonthName(month)}${isCurrent ? " (이번 달)" : ""}`}
          >
            {getMonthName(month)}
            {isCurrent && !isSelected && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
