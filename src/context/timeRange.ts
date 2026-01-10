import { TimeRange } from "@/types/time";
import { atom } from "jotai";

export const selectedClassificationTimeRangeAtom = atom<TimeRange>({
  start: Date.now(),
  end: Date.now(),
  value: "today",
});

export const selectedAnalyticsTimeRangeAtom = atom<TimeRange>({
  start: Date.now(),
  end: Date.now(),
  value: "today",
});

// Board filter for analytics - undefined means all boards
export const selectedAnalyticsBoardIdAtom = atom<string | undefined>(undefined);
