import { getScoreGrade, SCORE_COLORS } from "@/lib/score";
import type { ScoreGrade } from "@/types";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<string, string> = {
  sm: "px-1.5 py-0.5 text-xs font-bold rounded-md min-w-[2rem]",
  md: "px-2.5 py-1 text-sm font-bold rounded-lg min-w-[2.75rem]",
  lg: "px-4 py-2 text-2xl font-extrabold rounded-xl min-w-[4rem]",
};

const gradeLabelMap: Record<ScoreGrade, string> = {
  best: "최적",
  good: "좋음",
  average: "보통",
  poor: "비추",
};

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const grade = getScoreGrade(score);
  const color = SCORE_COLORS[grade];

  return (
    <span
      className={`inline-flex items-center justify-center text-white text-center leading-none ${sizeClasses[size]}`}
      style={{ backgroundColor: color }}
      title={gradeLabelMap[grade]}
      aria-label={`점수 ${score.toFixed(1)} - ${gradeLabelMap[grade]}`}
    >
      {score.toFixed(1)}
    </span>
  );
}
