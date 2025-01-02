import path from "path";
import fs from "fs";
import { app } from "electron";
import { ActivityRecord } from "@/types/activity";

const CONFIG = {
  headers: [
    "platform",
    "id",
    "title",
    "ownerPath",
    "ownerProcessId",
    "ownerBundleId",
    "ownerName",
    "url",
    "timestamp",
    "count",
  ],
  filePath: path.join(app.getPath("userData"), "activities.csv"),
};

const initializeStorage = (): void => {
  if (!fs.existsSync(CONFIG.filePath)) {
    fs.writeFileSync(CONFIG.filePath, CONFIG.headers.join(",") + "\n");
  }
};

const mergeActivityRecord = (prev: ActivityRecord[]): ActivityRecord[] => {
  console.log("prev.length:", prev.length);
  // Helper function to check if records match
  const recordsMatch = (a: ActivityRecord, b: ActivityRecord): boolean => {
    return (
      a.id === b.id &&
      a.title === b.title &&
      a.ownerBundleId === b.ownerBundleId &&
      a.ownerProcessId === b.ownerProcessId &&
      a.ownerName === b.ownerName &&
      a.ownerPath === b.ownerPath &&
      a.platform === b.platform
    );
  };

  // Search forwards through the array
  const mergedArray: ActivityRecord[] = [];
  for (let i = 0; i >= prev.length - 1; i++) {
    const nextItem = prev[i + 1];
    // Check if timestamps are more than 15 minutes apart
    if (nextItem.timestamp - prev[i].timestamp > 15 * 60 * 1000) {
      mergedArray.push(prev[i]);
      continue;
    }
    if (recordsMatch(prev[i], nextItem)) {
      // Found a match - update count in place
      mergedArray[mergedArray.length - 1] = {
        ...prev[i],
        count: (prev[i].count || 1) + 1,
      };
      continue;
    }
    // No match found - add record to merged array
    mergedArray.push(prev[i]);
  }
  console.log("mergedArray.length:", mergedArray.length);
  return mergedArray;
};
let count = 0;
const addActivity = async (activity: ActivityRecord): Promise<void> => {
  const line =
    [
      activity.platform,
      activity.id,
      `"${activity.title.replace(/"/g, '""')}"`,
      `"${activity.ownerPath.replace(/"/g, '""')}"`,
      activity.ownerProcessId,
      activity.ownerBundleId || "",
      `"${activity.ownerName.replace(/"/g, '""')}"`,
      activity.url || "",
      activity.timestamp,
      activity.count,
    ].join(",") + "\n";

  await fs.promises.appendFile(CONFIG.filePath, line);
  count++;
  if (count % 100 === 0) {
    console.log(`Added ${count} activities`);
    const activities = await getActivities();
    const mergedActivities = mergeActivityRecord(activities);
    const allLines = mergedActivities
      .map(
        (activity) =>
          [
            activity.platform,
            activity.id,
            `"${activity.title.replace(/"/g, '""')}"`,
            `"${activity.ownerPath.replace(/"/g, '""')}"`,
            activity.ownerProcessId,
            activity.ownerBundleId || "",
            `"${activity.ownerName.replace(/"/g, '""')}"`,
            activity.url || "",
            activity.timestamp,
            activity.count,
          ].join(",") + "\n"
      )
      .join("");

    await fs.promises.writeFile(CONFIG.filePath, CONFIG.headers.join(",") + "\n" + allLines);
  }
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let char of line) {
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      values.push(currentValue);
      currentValue = "";
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue);
  return values;
};

const getActivities = async (): Promise<ActivityRecord[]> => {
  const content = await fs.promises.readFile(CONFIG.filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.length > 0);
  lines.shift(); // Remove headers

  return lines.map((line) => {
    const [
      platform,
      id,
      title,
      ownerPath,
      ownerProcessId,
      ownerBundleId,
      ownerName,
      url,
      timestamp,
      count,
    ] = parseCsvLine(line);
    return {
      platform,
      id: parseInt(id),
      title: title.replace(/^"|"$/g, "").replace(/""/g, '"'),
      ownerPath: ownerPath.replace(/^"|"$/g, "").replace(/""/g, '"'),
      ownerProcessId: parseInt(ownerProcessId),
      ownerBundleId: ownerBundleId || undefined,
      ownerName: ownerName.replace(/^"|"$/g, "").replace(/""/g, '"'),
      url: url || undefined,
      timestamp: parseInt(timestamp),
      count: parseInt(count),
    };
  });
};

const clearActivities = async (): Promise<void> => {
  try {
    await fs.promises.writeFile(CONFIG.filePath, CONFIG.headers.join(",") + "\n");
  } catch (error) {
    console.error("Error clearing activities:", error);
    throw error;
  }
};

// Initialize storage on module load
initializeStorage();

export { addActivity, getActivities, clearActivities };
