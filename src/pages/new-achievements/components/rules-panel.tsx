import { useState } from "react";
import { format } from "date-fns";
import { Sparkles, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActivityRule } from "@/types/activity";

interface RulesPanelProps {
  rules: ActivityRule[];
  onDeleteRule: (ruleId: string) => void;
}

export function RulesPanel({ rules, onDeleteRule }: RulesPanelProps) {
  const [open, setOpen] = useState(false);

  const appRules = rules.filter((rule) => rule.ruleType === "app_name");
  const domainRules = rules.filter((rule) => rule.ruleType === "domain");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-[#2B4474]/20 text-[#2B4474]">
          <Sparkles className="h-4 w-4 text-[#E5A853]" />
          View Classification Rules
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Classification Rules</SheetTitle>
          <SheetDescription>
            Rules automatically classify future activities based on app or domain.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">App Rules</h3>
            {appRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No app rules created yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {rule.rating === 1 ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">Productive</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-red-600">Distracting</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(rule.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteRule(rule.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete rule</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Domain Rules</h3>
            {domainRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No domain rules created yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domainRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {rule.rating === 1 ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">Productive</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-red-600">Distracting</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(rule.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteRule(rule.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete rule</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
