import { CheckCircle, XCircle } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { ActivityRule } from "@/types/activity";

interface ClassificationTogglesProps {
  onClassifyAsProductive: () => void;
  onClassifyAsDistracting: () => void;
  isProductive: boolean;
  isDistracting: boolean;
  rule?: ActivityRule;
}

export function ClassificationToggles({
  onClassifyAsProductive,
  onClassifyAsDistracting,
  isProductive,
  isDistracting,
  rule,
}: ClassificationTogglesProps) {
  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Toggle
        pressed={isProductive}
        onPressedChange={() => onClassifyAsProductive()}
        className={cn(
          rule?.rating === 1
            ? "border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "",
          "h-8 border px-2"
        )}
        aria-label="Mark as productive"
      >
        <CheckCircle className="mr-1 h-4 w-4" />
        Productive
      </Toggle>

      <Toggle
        pressed={isDistracting}
        onPressedChange={() => onClassifyAsDistracting()}
        className={cn(
          rule?.rating === 0
            ? "border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
            : "",
          "h-8 border px-2"
        )}
        aria-label="Mark as distracting"
      >
        <XCircle className="mr-1 h-4 w-4" />
        Distracting
      </Toggle>
    </div>
  );
}