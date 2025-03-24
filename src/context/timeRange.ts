import { TimeRange } from "@/types/time";
import { atomWithStorage } from "jotai/utils";

const generateTimeRange = (key: string) => {
  return atomWithStorage<TimeRange>(
    key,
    {
      start: new Date(),
      end: new Date(),
      value: "today",
    },
    {
      // Custom storage to handle Date objects
      getItem: (key, initialValue) => {
        const storedValue = localStorage.getItem(key);
        if (!storedValue) return initialValue;

        try {
          const parsed = JSON.parse(storedValue);
          return {
            ...parsed,
            start: new Date(parsed.start),
            end: new Date(parsed.end),
          };
        } catch (e) {
          console.error("Error parsing stored time range:", e);
          return initialValue;
        }
      },
      setItem: (key, value) => {
        const toStore = JSON.stringify(value);
        localStorage.setItem(key, toStore);
      },
      removeItem: (key) => {
        localStorage.removeItem(key);
      },
    }
  );
};

export const selectedAchievementTimeRangeAtom = generateTimeRange("selectedAchievementTimeRange");

export const selectedAnalyticsTimeRangeAtom = generateTimeRange("selectedAnalyticsTimeRange");
