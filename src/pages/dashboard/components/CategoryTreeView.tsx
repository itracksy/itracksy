import React from "react";
import { CategoryDurationReport } from "@/types/activity";
import { formatDuration } from "@/utils/timeUtils";

interface CategoryTreeViewProps {
  categories: CategoryDurationReport[];
  level?: number;
}

export const CategoryTreeView: React.FC<CategoryTreeViewProps> = ({ categories, level = 0 }) => {
  return (
    <div className="space-y-2">
      {categories.map((category, index) => (
        <div key={index} className="text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span style={{ marginLeft: `${level * 16}px` }}>
                {category.children.length > 0 ? "▼" : "•"}{" "}
                {category.category[category.category.length - 1]}
              </span>
            </div>
            <div className="text-gray-600">{formatDuration(category.totalDuration)}</div>
          </div>
          {category.children.length > 0 && (
            <CategoryTreeView categories={category.children} level={level + 1} />
          )}
        </div>
      ))}
    </div>
  );
};
