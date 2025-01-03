import React from "react";
import { CategoryDurationReport } from "@/types/activity";
import { formatDuration } from "@/utils/timeUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryTreeViewProps {
  categories: CategoryDurationReport[];
  level?: number;
}

const CategoryTree: React.FC<CategoryTreeViewProps> = ({ categories, level = 0 }) => {
  return (
    <div className="space-y-2">
      {categories.map((category, index) => (
        <div key={index} className="text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span
                style={{ marginLeft: `${level * 16}px` }}
                className="text-tracksy-blue dark:text-white"
              >
                {category.children.length > 0 ? "▼" : "•"}{" "}
                {category.category[category.category.length - 1]}
              </span>
            </div>
            <div className="text-tracksy-blue/70 dark:text-white/70">
              {formatDuration(category.totalDuration)}
            </div>
          </div>
          {category.children.length > 0 && (
            <CategoryTree categories={category.children} level={level + 1} />
          )}
        </div>
      ))}
    </div>
  );
};

export const CategoryTreeView: React.FC<Omit<CategoryTreeViewProps, "level">> = ({
  categories,
}) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-tracksy-blue text-lg font-semibold dark:text-white">
          Category Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CategoryTree categories={categories} />
      </CardContent>
    </Card>
  );
};
