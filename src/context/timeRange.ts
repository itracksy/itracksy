import { TimeRange } from "@/types/time";
import { atomWithStorage } from "jotai/utils";

export const selectedAchievementTimeRangeAtom = atomWithStorage<TimeRange>(
  "selectedAchievementTimeRange",
  {
    start: Date.now(),
    end: Date.now(),
    value: "today",
  }
);

export const selectedAnalyticsTimeRangeAtom = atomWithStorage<TimeRange>(
  "selectedAnalyticsTimeRange",
  {
    start: Date.now(),
    end: Date.now(),
    value: "today",
  }
);
