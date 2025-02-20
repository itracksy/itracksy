import { LIMIT_TIME_APART } from "../config/tracking";
import { ActivityRecord } from "@/types/activity";

export const mergeActivityRecord = (prev: ActivityRecord[]): ActivityRecord[] => {
  if (prev.length === 0) return [];

  // Helper function to check if records match
  const recordsMatch = (a: ActivityRecord, b: ActivityRecord): boolean => {
    const matches =
      a.title === b.title &&
      a.ownerBundleId === b.ownerBundleId &&
      a.ownerName === b.ownerName &&
      a.ownerPath === b.ownerPath &&
      a.platform === b.platform &&
      a.taskId === b.taskId;

    return matches;
  };

  const mergedArray: ActivityRecord[] = [];

  for (const record of prev) {
    let merged = false;

    // Try to find a matching record that's within 15 minutes
    for (const existing of mergedArray) {
      if (
        record.timestamp - existing.timestamp <= LIMIT_TIME_APART &&
        recordsMatch(existing, record)
      ) {
        existing.duration = (existing.duration || 1) + (record.duration || 1);
        merged = true;
        break;
      }
    }

    if (!merged) {
      mergedArray.push({ ...record });
    }
  }

  return mergedArray;
};
