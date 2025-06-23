import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function RulesInfo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex cursor-help items-center justify-center rounded-full bg-[#2B4474]/10 p-1 dark:bg-[#2B4474]/20">
            <Info className="h-4 w-4 text-[#2B4474] dark:text-[#3A5A9B]" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            When you classify an app or domain, a rule is created that will automatically apply to
            future activities.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
