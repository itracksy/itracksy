import { Button } from "@/components/ui/button";

import { ActivityRule } from "@/types/activity";

interface AppRuleButtonsProps {
  appName: string;
  onUpdateRule: (params: { id: string | null; rating: number; appName: string }) => void;
  rule: ActivityRule | null;
}

export function AppRuleButtons({ appName, onUpdateRule, rule }: AppRuleButtonsProps) {
  const handleClick = (rating: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateRule({
      id: rule?.id || null,
      rating,
      appName,
    });
  };
  if (rule) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">
          {rule.rating === 0 ? "This app is distracting" : "This app is not distracting"}
        </span>
        {rule.rating === 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => handleClick(1, e)}
          >
            No, it's not distracting
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => handleClick(0, e)}
          >
            Yes, it is distracting
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">Is this app distracting?</span>
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

interface DomainRuleButtonsProps {
  appName: string;
  domain: string;
  rule: ActivityRule | null;
  onUpdateRule: (params: {
    id: string | null;
    rating: number;
    appName: string;
    domain: string;
  }) => void;
}

export function DomainRuleButtons({ appName, domain, rule, onUpdateRule }: DomainRuleButtonsProps) {
  const handleClick = (rating: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateRule({ id: rule?.id || null, rating, appName, domain });
  };
  if (rule) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">
          {rule.rating === 0 ? "This domain is distracting" : "This domain is not distracting"}
        </span>
        {rule.rating === 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => handleClick(1, e)}
          >
            No, it's not distracting
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => handleClick(0, e)}
          >
            Yes, it is distracting
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">Is this domain distracting?</span>
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
