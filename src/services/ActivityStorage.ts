import path from "path";
import fs from "fs";
import { app } from "electron";
import { ActivityRecord } from "@/types/activity";
import { LIMIT_TIME_APART, MERGING_BATCH_SIZE } from "../config/tracking";

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
  console.log("Storage initialized", CONFIG.filePath);
};

const mergeActivityRecord = (prev: ActivityRecord[]): ActivityRecord[] => {
  if (prev.length === 0) return [];

  console.log("prev.length:", prev.length);
  // Helper function to check if records match
  const recordsMatch = (a: ActivityRecord, b: ActivityRecord): boolean => {
    const matches =
      a.title === b.title &&
      a.ownerBundleId === b.ownerBundleId &&
      a.ownerName === b.ownerName &&
      a.ownerPath === b.ownerPath &&
      a.platform === b.platform;

    return matches;
  };

  // Sort by timestamp first to ensure we process records in order
  const sortedRecords = prev;
  const mergedArray: ActivityRecord[] = [];

  for (const record of sortedRecords) {
    let merged = false;

    // Try to find a matching record that's within 15 minutes
    for (const existing of mergedArray) {
      if (
        record.timestamp - existing.timestamp <= LIMIT_TIME_APART &&
        recordsMatch(existing, record)
      ) {
        existing.count = (existing.count || 1) + (record.count || 1);
        merged = true;
        break;
      }
    }

    if (!merged) {
      mergedArray.push({ ...record });
    }
  }

  console.log(
    "Final merged records:",
    mergedArray.map((r) => ({
      id: r.id,
      title: r.title.substring(0, 30) + "...",
      count: r.count,
      timestamp: r.timestamp,
    }))
  );

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
  console.log("count:", count);

  if (count % MERGING_BATCH_SIZE === 0) {
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
    console.log("mergedActivities:", mergedActivities);
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

export { addActivity, getActivities, clearActivities, mergeActivityRecord };
