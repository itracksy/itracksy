import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Globe, Hash, Target, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useCreateCategoryMappingMutation,
  useUpdateCategoryMappingMutation,
} from "@/hooks/useCategoryQueries";
import type { CategoryMapping } from "../types";

type MatchType = "exact" | "contains" | "starts_with" | "regex";
type MappingType = "appName" | "domain" | "titlePattern";

interface CategoryMappingFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly categoryId: string;
  readonly categoryName: string;
  readonly mapping?: CategoryMapping | null;
}

interface FormData {
  type: MappingType;
  pattern: string;
  matchType: MatchType;
  priority: number;
  isActive: boolean;
}

const MAPPING_TYPES = [
  {
    value: "appName" as MappingType,
    label: "Application Name",
    description: "Match activities by application name (e.g., 'Visual Studio Code', 'Chrome')",
    icon: Monitor,
    placeholder: "e.g., Visual Studio Code",
    examples: ["Visual Studio Code", "Google Chrome", "Slack", "Microsoft Teams"],
  },
  {
    value: "domain" as MappingType,
    label: "Website Domain",
    description: "Match activities by website domain (e.g., 'github.com', 'stackoverflow.com')",
    icon: Globe,
    placeholder: "e.g., github.com",
    examples: ["github.com", "stackoverflow.com", "youtube.com", "gmail.com"],
  },
  {
    value: "titlePattern" as MappingType,
    label: "Title Pattern",
    description: "Match activities by window/page title patterns",
    icon: Hash,
    placeholder: "e.g., tutorial|course|learn",
    examples: ["meeting|call|zoom", "tutorial|course|learn", "email|inbox|mail"],
  },
] as const;

const MATCH_TYPES = [
  {
    value: "exact" as MatchType,
    label: "Exact Match",
    description: "Pattern must match exactly",
    example: "github.com matches only 'github.com'",
  },
  {
    value: "contains" as MatchType,
    label: "Contains",
    description: "Pattern must be contained within the text",
    example: "github matches 'github.com', 'my.github.io'",
  },
  {
    value: "starts_with" as MatchType,
    label: "Starts With",
    description: "Text must start with the pattern",
    example: "github matches 'github.com' but not 'my.github.io'",
  },
  {
    value: "regex" as MatchType,
    label: "Regular Expression",
    description: "Use regex patterns for complex matching",
    example: "^(github|gitlab)\\.com$ matches 'github.com' or 'gitlab.com'",
  },
] as const;

export const CategoryMappingFormModal: React.FC<CategoryMappingFormModalProps> = ({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  mapping,
}) => {
  const [formData, setFormData] = useState<FormData>({
    type: "appName",
    pattern: "",
    matchType: "exact",
    priority: 100,
    isActive: true,
  });

  const createMutation = useCreateCategoryMappingMutation();
  const updateMutation = useUpdateCategoryMappingMutation();

  const isEditing = Boolean(mapping);
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Initialize form data when modal opens or mapping changes
  useEffect(() => {
    if (isOpen) {
      if (mapping) {
        // Editing existing mapping
        const type: MappingType = mapping.appName
          ? "appName"
          : mapping.domain
            ? "domain"
            : "titlePattern";

        const pattern = mapping.appName || mapping.domain || mapping.titlePattern || "";

        setFormData({
          type,
          pattern,
          matchType: (mapping.matchType as MatchType) || "exact",
          priority: mapping.priority || 100,
          isActive: mapping.isActive,
        });
      } else {
        // Creating new mapping
        setFormData({
          type: "appName",
          pattern: "",
          matchType: "exact",
          priority: 100,
          isActive: true,
        });
      }
    }
  }, [isOpen, mapping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pattern.trim()) {
      return;
    }

    const mappingData = {
      categoryId,
      appName: formData.type === "appName" ? formData.pattern.trim() : null,
      domain: formData.type === "domain" ? formData.pattern.trim() : null,
      titlePattern: formData.type === "titlePattern" ? formData.pattern.trim() : null,
      matchType: formData.matchType,
      priority: formData.priority,
      isActive: formData.isActive,
    };

    try {
      if (isEditing && mapping) {
        await updateMutation.mutateAsync({
          id: mapping.id,
          updates: mappingData,
        });
      } else {
        await createMutation.mutateAsync(mappingData);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save mapping:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      type: "appName",
      pattern: "",
      matchType: "exact",
      priority: 100,
      isActive: true,
    });
    onClose();
  };

  const selectedType = MAPPING_TYPES.find((t) => t.value === formData.type);
  const selectedMatchType = MATCH_TYPES.find((mt) => mt.value === formData.matchType);
  const SelectedIcon = selectedType?.icon || Target;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Create"} Category Mapping</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Edit mapping rule for "${categoryName}"`
              : `Create a new mapping rule for "${categoryName}"`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mapping Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Mapping Type</Label>
            <div className="grid gap-3">
              {MAPPING_TYPES.map((type) => {
                const TypeIcon = type.icon;
                const isSelected = formData.type === type.value;

                return (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-all ${
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, type: type.value }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 rounded-md p-2 ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{type.label}</h4>
                          <p className="mt-1 text-sm text-muted-foreground">{type.description}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {type.examples.slice(0, 3).map((example) => (
                              <Badge key={example} variant="outline" className="text-xs">
                                {example}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Pattern Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SelectedIcon className="h-4 w-4" />
              <Label htmlFor="pattern" className="font-medium">
                Pattern *
              </Label>
            </div>
            <Input
              id="pattern"
              value={formData.pattern}
              onChange={(e) => setFormData((prev) => ({ ...prev, pattern: e.target.value }))}
              placeholder={selectedType?.placeholder}
              required
            />
            {selectedType && (
              <p className="text-sm text-muted-foreground">
                Examples: {selectedType.examples.join(", ")}
              </p>
            )}
          </div>

          {/* Match Type */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="font-medium">Match Type</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[300px]">
                    <p className="text-sm">
                      Determines how the pattern is matched against activity data. Choose based on
                      how specific or flexible you want the matching to be.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={formData.matchType}
              onValueChange={(value: MatchType) =>
                setFormData((prev) => ({ ...prev, matchType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATCH_TYPES.map((matchType) => (
                  <SelectItem key={matchType.value} value={matchType.value}>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{matchType.label}</span>
                      <span className="text-xs text-muted-foreground">{matchType.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMatchType && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm">
                  <span className="font-medium">Example:</span> {selectedMatchType.example}
                </p>
              </div>
            )}
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="font-medium">
                Priority
              </Label>
              <Input
                id="priority"
                type="number"
                min="0"
                max="1000"
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Higher priority rules are matched first (0-1000)
              </p>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Status</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
                <span className="text-sm">{formData.isActive ? "Active" : "Inactive"}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Only active mappings are used for categorization
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.pattern.trim() || isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Update" : "Create"} Mapping
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
