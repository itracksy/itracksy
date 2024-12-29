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

const clearActivities = async (beforeTimestamp: number): Promise<void> => {
  try {
    // Read file content
    const content = await fs.promises.readFile(CONFIG.filePath, "utf-8");
    const lines = content.trim().split("\n");

    // Separate header and data
    const [header, ...dataLines] = lines;

    // Filter lines while preserving order
    const remainingLines = dataLines.filter((line) => {
      if (!line.trim()) return false;
      const values = parseCsvLine(line);
      const timestamp = parseInt(values[8], 10);
      return !isNaN(timestamp) && timestamp >= beforeTimestamp;
    });

    // Combine header with filtered lines
    const newContent = [header, ...remainingLines].join("\n") + "\n";

    // Write back to file
    await fs.promises.writeFile(CONFIG.filePath, newContent);
  } catch (error) {
    console.error("Error clearing activities:", error);
    throw error;
  }
};

// Initialize storage on module load
initializeStorage();

export { addActivity, getActivities, clearActivities };
