"use client";

import type { AppMode } from "@/types";

interface ModeSliderProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export function ModeSlider({ mode, onChange }: ModeSliderProps) {
  const isWhereToWhen = mode === "where-to-when";

  return (
    <div className="inline-flex items-center relative bg-gray-100 dark:bg-gray-800 rounded-full p-1">
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-full bg-white dark:bg-gray-700 shadow-md transition-all duration-300 ease-in-out"
        style={{
          width: "calc(50% - 4px)",
          left: isWhereToWhen ? "4px" : "calc(50%)",
        }}
        aria-hidden="true"
      />

      {/* Where → When (Mode A) */}
      <button
        type="button"
        onClick={() => onChange("where-to-when")}
        className={`
          relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
          transition-colors duration-300
          ${isWhereToWhen ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}
        `}
        aria-pressed={isWhereToWhen}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          />
        </svg>
        <span>목적지로 검색</span>
      </button>

      {/* When → Where (Mode B) */}
      <button
        type="button"
        onClick={() => onChange("when-to-where")}
        className={`
          relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
          transition-colors duration-300
          ${!isWhereToWhen ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}
        `}
        aria-pressed={!isWhereToWhen}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
          />
        </svg>
        <span>날짜로 검색</span>
      </button>
    </div>
  );
}
