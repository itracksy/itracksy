import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function RulesInfo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center justify-center rounded-full bg-[#2B4474]/10 p-1 cursor-help">
            <Info className="h-4 w-4 text-[#2B4474]" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">
            When you classify an app or domain, a rule is created that will automatically apply to future activities.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

