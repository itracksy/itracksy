import { CheckCircle, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RulesBadgeProps {
  isProductive: boolean;
  className?: string;
}

export function RulesBadge({ isProductive, className }: RulesBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex cursor-help items-center justify-center rounded-full p-0.5",
              isProductive ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30",
              className
            )}
          >
            {isProductive ? (
              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">
            {isProductive ? "Classified as productive" : "Classified as distracting"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
