import { ActivityRule } from "@/types/activity";
import { CheckCircle, XCircle } from "lucide-react";

interface RuleCreationToastProps {
  rule: ActivityRule;
}

export function RuleCreationToast({ rule }: RuleCreationToastProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border-l-4 border-[#E5A853] bg-white p-4 shadow-md">
      <div className="rounded-full bg-[#E5A853]/10 p-2">
        {rule.rating === 1 ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">New Rule Created</h4>
        <p className="text-sm text-gray-600">
          {rule.ruleType === "app_name" ? "App" : "Domain"}{" "}
          <span className="font-medium">{rule.name}</span> will always be marked as{" "}
          {rule.rating === 1 ? "productive" : "distracting"}.
        </p>
      </div>
    </div>
  );
}
