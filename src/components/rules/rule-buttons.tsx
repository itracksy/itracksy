import { Button } from "@/components/ui/button";
import { ActivityRule } from "@/types/activity";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface RuleButtonsProps {
  appName: string;
  domain?: string;
  rule: ActivityRule | null;
  onUpdateRule: (params: {
    id: string | null;
    rating: number;
    appName: string;
    domain?: string;
    isApplyToAll?: boolean;
  }) => void;
}

export function RuleButtons({ appName, domain, rule, onUpdateRule }: RuleButtonsProps) {
  const isDomainRule = !!domain;
  const entityType = isDomainRule ? "domain" : "app";
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; rating: number } | null>(
    null
  );
  const [applyToAll, setApplyToAll] = useState(false);

  const handleClick = (rating: number, e: React.MouseEvent) => {
    e.stopPropagation();

    // If changing an existing rule, show confirmation dialog
    if (rule && rule.rating !== rating) {
      setConfirmDialog({ open: true, rating });
      return;
    }

    // Otherwise, update the rule directly
    applyRuleChange(rating);
  };

  const applyRuleChange = (rating: number) => {
    onUpdateRule({
      id: rule?.id || null,
      rating,
      appName,
      ...(isDomainRule && { domain }),
      isApplyToAll: applyToAll,
    });
    // Close dialog if open
    setConfirmDialog(null);
    // Reset apply to all state
    setApplyToAll(false);
  };

  if (rule) {
    return (
      <>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {rule.rating === 0
              ? `Rule: ${entityType} marked distracting`
              : `Rule: ${entityType} marked productive`}
          </span>
          {rule.rating === 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => handleClick(1, e)}
            >
              Mark productive
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => handleClick(0, e)}
            >
              Mark distracting
            </Button>
          )}
        </div>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog?.open || false}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmDialog(null);
              setApplyToAll(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change rule setting?</DialogTitle>
              <DialogDescription>
                Are you sure you want to change the rule for this {entityType}?
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center space-x-2 py-4">
              <Checkbox
                id="apply-to-all"
                checked={applyToAll}
                onCheckedChange={(checked) => setApplyToAll(checked === true)}
              />
              <Label htmlFor="apply-to-all" className="text-sm font-normal">
                Apply this rule to all instances of this {entityType}
              </Label>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmDialog(null);
                  setApplyToAll(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => confirmDialog && applyRuleChange(confirmDialog.rating)}>
                Confirm Change
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">
        Set rule: Is this {entityType} distracting?
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={(e) => handleClick(0, e)}
      >
        YES
      </Button>
      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => handleClick(1, e)}>
        NO
      </Button>
    </div>
  );
}

// For backward compatibility, provide the original component names as aliases
export function AppRuleButtons(props: Omit<RuleButtonsProps, "domain">) {
  return <RuleButtons {...props} />;
}

export function DomainRuleButtons(props: RuleButtonsProps) {
  return <RuleButtons {...props} />;
}
