import { ActivityRecord } from "@/types/activity";
import { MERGING_BATCH_SIZE } from "../../config/tracking";
import db from "..";
import { activities } from "../schema";

import { gte, desc } from "drizzle-orm";
import { mergeActivityRecord } from "../../helpers/mergeActivitiRecord";
import { getCurrentUserId } from "./userSettings";

const mergeRecords = async (): Promise<void> => {
  const activities = await getActivities();
  const mergedActivities = mergeActivityRecord(activities);

  // await fs.promises.writeFile(getFilePath(), CONFIG.headers.join(",") + "\n" + allLines);
};

let count = 0;
export const addActivity = async (activity: ActivityRecord): Promise<void> => {
  const isFocused = activity.isFocused ?? false;
  const userId = await getCurrentUserId();

  // Store in SQLite database
  try {
    await db.insert(activities).values({
      platform: activity.platform,
      activityId: activity.activityId,
      title: activity.title,
      ownerPath: activity.ownerPath,
      ownerProcessId: activity.ownerProcessId,
      ownerBundleId: activity.ownerBundleId,
      ownerName: activity.ownerName,
      url: activity.url,
      timestamp: activity.timestamp,
      duration: activity.duration,
      taskId: activity.taskId,
      isFocused,
      userId,
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

export const getActivities = async (date?: number): Promise<ActivityRecord[]> => {
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000; // 15 minutes in milliseconds

  const results = await db
    .select()
    .from(activities)
    .where(gte(activities.timestamp, date || fifteenMinutesAgo))
    .orderBy(desc(activities.timestamp))
    .limit(1000);

  return results.map((row) => ({
    ...row,
    ownerBundleId: row.ownerBundleId || undefined,
    url: row.url || undefined,
    userId: row.userId || undefined,
    taskId: row.taskId || undefined,
    isFocused: row.isFocused || undefined,
    activityId: row.activityId,
  }));
};

export const clearActivities = async (date?: string): Promise<void> => {
  await db.delete(activities).all();
};
