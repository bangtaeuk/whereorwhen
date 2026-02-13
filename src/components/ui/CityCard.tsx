"use client";

import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { HighlightTag } from "@/components/ui/HighlightTag";

interface CityCardProps {
  rank: number;
  cityNameKo: string;
  cityNameEn: string;
  country: string;
  score: number;
  highlights: string[];
  onClick?: () => void;
}

export function CityCard({
  rank,
  cityNameKo,
  cityNameEn,
  country,
  score,
  highlights,
  onClick,
}: CityCardProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`
        group relative flex items-center gap-4 p-4 bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-800 rounded-2xl
        transition-all duration-200 ease-out
        ${onClick ? "cursor-pointer hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 hover:-translate-y-0.5 active:translate-y-0" : ""}
      `}
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-8 text-center">
        <span
          className={`text-lg font-extrabold tabular-nums ${
            rank <= 3
              ? "text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-amber-600"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {rank}
        </span>
      </div>

      {/* City info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">
            {country}
          </span>
          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
            {cityNameKo}
          </h3>
          <span className="text-sm text-gray-400 dark:text-gray-500 truncate">
            {cityNameEn}
          </span>
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {highlights.map((hl) => (
              <HighlightTag key={hl} text={hl} />
            ))}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="flex-shrink-0">
        <ScoreBadge score={score} size="md" />
      </div>
    </div>
  );
}
