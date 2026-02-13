"use client";

import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { HighlightTag } from "@/components/ui/HighlightTag";
import { getMonthName } from "@/lib/utils";

interface ScoreDetailPanelProps {
  cityNameKo: string;
  cityNameEn: string;
  month: number;
  scores: {
    weather: number;
    cost: number;
    crowd: number;
    buzz: number;
    total: number;
  };
  highlights: string[];
  onClose?: () => void;
}

const SUB_SCORES = [
  {
    key: "weather" as const,
    label: "날씨",
    icon: "☀️",
    description: "맑은 날 비율, 쾌적 기온",
  },
  {
    key: "cost" as const,
    label: "비용",
    icon: "💰",
    description: "환율 유리도",
  },
  {
    key: "crowd" as const,
    label: "혼잡도",
    icon: "👥",
    description: "공휴일, 시즌",
  },
  {
    key: "buzz" as const,
    label: "버즈",
    icon: "🔥",
    description: "블로그 언급, 시즌 매력",
  },
] as const;

export function ScoreDetailPanel({
  cityNameKo,
  cityNameEn,
  month,
  scores,
  highlights,
  onClose,
}: ScoreDetailPanelProps) {
  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-850">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {cityNameKo}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {cityNameEn} · {getMonthName(month)}
            </p>
          </div>
          <ScoreBadge score={scores.total} size="lg" />
        </div>
      </div>

      {/* Score breakdown */}
      <div className="px-6 py-5 space-y-4">
        {SUB_SCORES.map(({ key, label, icon, description }) => (
          <ScoreBar
            key={key}
            label={label}
            score={scores[key]}
            icon={icon}
            description={description}
          />
        ))}
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="px-6 pb-6">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            하이라이트
          </p>
          <div className="flex flex-wrap gap-1.5">
            {highlights.map((hl) => (
              <HighlightTag key={hl} text={hl} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
