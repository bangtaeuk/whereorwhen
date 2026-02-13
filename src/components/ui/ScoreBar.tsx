import { getScoreGrade, SCORE_COLORS } from "@/lib/score";

interface ScoreBarProps {
  label: string;
  score: number;
  icon?: string;
  description?: string;
}

export function ScoreBar({ label, score, icon, description }: ScoreBarProps) {
  const grade = getScoreGrade(score);
  const color = SCORE_COLORS[grade];
  const percentage = (score / 10) * 100;

  return (
    <div className="w-full">
      {/* Label row */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {icon && <span className="mr-1.5">{icon}</span>}
          {label}
        </span>
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color }}
        >
          {score.toFixed(1)}
        </span>
      </div>

      {/* Bar */}
      <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Description */}
      {description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
}
