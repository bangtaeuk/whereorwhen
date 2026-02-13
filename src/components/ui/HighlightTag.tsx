type HighlightVariant = "weather" | "cost" | "crowd" | "buzz";

interface HighlightTagProps {
  text: string;
  variant?: HighlightVariant;
}

const variantClasses: Record<HighlightVariant, string> = {
  weather:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  cost:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  crowd:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  buzz:
    "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800",
};

const defaultClasses =
  "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700";

export function HighlightTag({ text, variant }: HighlightTagProps) {
  const classes = variant ? variantClasses[variant] : defaultClasses;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${classes}`}
    >
      {text}
    </span>
  );
}
