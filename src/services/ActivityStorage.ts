import path from "path";
import fs from "fs";
import { app } from "electron";
import { ActivityRecord } from "@/types/activity";
import { LIMIT_TIME_APART, MERGING_BATCH_SIZE } from "../config/tracking";
import db from "../db";
import { activities } from "../db/schema";
import { logger } from "../helpers/logger";

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
  baseDir: path.join(app.getPath("userData"), "activities"),
};

const getFilePath = (date: string = new Date().toISOString().split("T")[0]): string => {
  return path.join(CONFIG.baseDir, `${date}.csv`);
};

const initializeStorage = (): void => {
  if (!fs.existsSync(CONFIG.baseDir)) {
    fs.mkdirSync(CONFIG.baseDir, { recursive: true });
  }
  const currentFilePath = getFilePath();
  if (!fs.existsSync(currentFilePath)) {
    fs.writeFileSync(currentFilePath, CONFIG.headers.join(",") + "\n");
  }
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

  return mergedArray;
};

const mergeRecords = async (): Promise<void> => {
  const activities = await getActivities();
  const mergedActivities = mergeActivityRecord(activities);
  const allLines = mergedActivities
    .map(
      (activity) =>
        [
          activity.platform,
          activity.id,
          activity.title?.replace(/,/g, ";"),
          activity.ownerPath?.replace(/,/g, ";"),
          activity.ownerProcessId,
          activity.ownerBundleId?.replace(/,/g, ";"),
          activity.ownerName?.replace(/,/g, ";"),
          activity.url?.replace(/,/g, ";"),
          activity.timestamp,
          activity.count,
        ].join(",") + "\n"
    )
    .join("");
  await fs.promises.writeFile(getFilePath(), CONFIG.headers.join(",") + "\n" + allLines);
};

let count = 0;
const addActivity = async (activity: ActivityRecord): Promise<void> => {
  const date = new Date(activity.timestamp).toISOString().split("T")[0];
  const filePath = getFilePath(date);

  // Initialize file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, CONFIG.headers.join(",") + "\n");
  }

  // Store in SQLite database
  try {
    await db.insert(activities).values({
      platform: activity.platform,
      id: activity.id,
      title: activity.title,
      ownerPath: activity.ownerPath,
      ownerProcessId: activity.ownerProcessId,
      ownerBundleId: activity.ownerBundleId,
      ownerName: activity.ownerName,
      url: activity.url,
      timestamp: activity.timestamp,
      count: activity.count,
    });
  } catch (error) {
    console.error("Failed to store activity in SQLite:", error);
  }

  count++;

  if (count >= MERGING_BATCH_SIZE) {
    await mergeRecords();
    count = 0;
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

const _getActivities = async (date?: string): Promise<ActivityRecord[]> => {
  const filePath = getFilePath(date);
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = await fs.promises.readFile(filePath, "utf-8");
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

const getActivities = async (date?: string): Promise<ActivityRecord[]> => {
  try {
    const results = await db.select().from(activities).all();
    logger.info("[getActivities]Got activities:", results);
    return results.map((row) => ({
      ...row,
      ownerBundleId: row.ownerBundleId || undefined,
      url: row.url || undefined,
      userId: row.userId || undefined,
    }));
  } catch (error) {
    logger.error("[getActivities] Failed to get activities:", error);
    return [];
  }
};

const clearActivities = async (date?: string): Promise<void> => {
  const filePath = getFilePath(date);
  if (fs.existsSync(filePath)) {
    await fs.promises.writeFile(filePath, CONFIG.headers.join(",") + "\n");
  }
};

// Initialize storage on module load
initializeStorage();

export { addActivity, getActivities, clearActivities, mergeActivityRecord };
