"use client";

import { getScoreGrade, SCORE_COLORS } from "@/lib/score";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { getMonthName } from "@/lib/utils";

interface MonthCellProps {
  month: number;
  score: number;
  isCurrentMonth?: boolean;
  isBestMonth?: boolean;
  onClick?: () => void;
}

export function MonthCell({
  month,
  score,
  isCurrentMonth = false,
  isBestMonth = false,
  onClick,
}: MonthCellProps) {
  const grade = getScoreGrade(score);
  const color = SCORE_COLORS[grade];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center gap-1.5
        w-full aspect-square p-2 rounded-xl
        transition-all duration-200 ease-out
        hover:scale-105 hover:shadow-md active:scale-100
        ${isCurrentMonth ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900" : ""}
      `}
      style={{
        backgroundColor: `${color}10`,
        borderWidth: "1px",
        borderColor: `${color}30`,
      }}
      aria-label={`${getMonthName(month)} 점수 ${score.toFixed(1)}${isBestMonth ? " - 최적의 달" : ""}${isCurrentMonth ? " - 이번 달" : ""}`}
    >
      {/* Best month indicator */}
      {isBestMonth && (
        <span className="absolute -top-1 -right-1 text-sm" aria-hidden="true">
          👑
        </span>
      )}

      {/* Month name */}
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {getMonthName(month)}
      </span>

      {/* Score badge */}
      <ScoreBadge score={score} size="sm" />
    </button>
  );
}
