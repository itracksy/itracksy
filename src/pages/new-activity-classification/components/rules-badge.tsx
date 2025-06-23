import { Sparkles } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface RulesBadgeProps {
  isProductive: boolean
  className?: string
}

export function RulesBadge({ isProductive, className }: RulesBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center justify-center rounded-full p-1 cursor-help",
              isProductive ? "bg-green-100" : "bg-red-100",
              className,
            )}
          >
            <Sparkles className={cn("h-3 w-3", isProductive ? "text-green-600" : "text-red-600")} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-sm">
            {isProductive ? "Rule: Always mark as productive" : "Rule: Always mark as distracting"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

