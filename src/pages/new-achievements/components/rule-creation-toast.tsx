import { CheckCircle, XCircle } from "lucide-react"
import type { Rule } from "@/lib/types"

interface RuleCreationToastProps {
  rule: Rule
}

export function RuleCreationToast({ rule }: RuleCreationToastProps) {
  return (
    <div className="flex items-start gap-3 bg-white rounded-lg shadow-md p-4 border-l-4 border-[#E5A853]">
      <div className="bg-[#E5A853]/10 rounded-full p-2">
        {rule.isProductive ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">New Rule Created</h4>
        <p className="text-sm text-gray-600">
          {rule.type === "app" ? "App" : "Domain"} <span className="font-medium">{rule.name}</span> will always be
          marked as {rule.isProductive ? "productive" : "distracting"}.
        </p>
      </div>
    </div>
  )
}

