import db from "..";
import { blockedDomains, blockedApps } from "../schema";
import { eq } from "drizzle-orm";
import { defaultBlockedApps, defaultBlockedDomains } from "../../../config/tracking";
import { getValue, setValue, setMultipleValues } from "./localStorage";
import { logger } from "../../../helpers/logger";
import { boards } from "../../db/schema";
import { createBoard, createColumn, createItem } from "../../services/board";
import { nanoid } from "nanoid";
const USER_SETTINGS_KEYS = {
  accessibilityPermission: "user.accessibilityPermission",
  screenRecordingPermission: "user.screenRecordingPermission",
  isFocusMode: "user.isFocusMode",
  currentTaskId: "user.currentTaskId",
  timeEntryId: "user.timeEntryId",
  lastUpdateActivity: "user.lastUpdateActivity",
  currentUserId: "user.currentUserId",
  isTracking: "user.isTracking",
};

export async function getUserSettings({ userId }: { userId: string }) {
  const [
    accessibilityPermission,
    screenRecordingPermission,
    isFocusMode,
    currentTaskId,
    timeEntryId,
    lastUpdateActivity,
    isTracking,
  ] = await Promise.all([
    getValue(USER_SETTINGS_KEYS.accessibilityPermission),
    getValue(USER_SETTINGS_KEYS.screenRecordingPermission),
    getValue(USER_SETTINGS_KEYS.isFocusMode),
    getValue(USER_SETTINGS_KEYS.currentTaskId),
    getValue(USER_SETTINGS_KEYS.timeEntryId),
    getValue(USER_SETTINGS_KEYS.lastUpdateActivity),
    getValue(USER_SETTINGS_KEYS.isTracking),
  ]);

  return {
    userId,
    accessibilityPermission: accessibilityPermission === "true",
    screenRecordingPermission: screenRecordingPermission === "true",
    isBlockingOnFocusMode: isFocusMode === "true",
    currentTaskId: currentTaskId || null,
    timeEntryId: timeEntryId || null,
    lastUpdateActivity: lastUpdateActivity ? parseInt(lastUpdateActivity) : null,
    isTracking: isTracking === "true",
  };
}

let existingUserId: string | null = null;

export const getCurrentUserIdLocalStorage = async () => {
  if (!existingUserId) {
    existingUserId = await getValue(USER_SETTINGS_KEYS.currentUserId);
  }

  return existingUserId;
};

export async function setCurrentUserId(userId: string): Promise<string> {
  existingUserId = await getCurrentUserIdLocalStorage();
  if (existingUserId && existingUserId !== userId) {
    logger.fatal("[setCurrentUserId] Current user id mismatch", {
      existingUserId,
      userId,
    });
  }

  if (existingUserId == userId) {
    return existingUserId;
  }

  await setValue(USER_SETTINGS_KEYS.currentUserId, userId);
  existingUserId = userId;

  // Check if there are any boards
  const existingBoards = await db.select().from(boards);
  if (existingBoards.length === 0) {
    // Create default introduction board
    const board = await createBoard(
      {
        name: "Getting Started",
        color: "#4CAF50", // A nice green color
        currency: "USD",
        hourlyRate: 0,
      },
      userId
    );

    // Create default columns
    const todoColumn = await createColumn({
      name: "To Do",
      boardId: board.id,
      order: 0,
    });

    const inProgressColumn = await createColumn({
      name: "In Progress",
      boardId: board.id,
      order: 1,
    });

    const doneColumn = await createColumn({
      name: "Done",
      boardId: board.id,
      order: 2,
    });

    // Create introduction items
    await createItem({
      id: nanoid(),
      title: "👋 Welcome to iTracksy!",
      content:
        "iTracksy is your personal time tracking and task management companion. This board helps you get started with the basics.",
      boardId: board.id,
      columnId: todoColumn.id,
      order: 0,
    });

    await createItem({
      id: nanoid(),
      title: "⏱️ Track Your Time",
      content:
        "Click the play button on any task to start tracking time. You can also use focus mode to minimize distractions.",
      boardId: board.id,
      columnId: todoColumn.id,
      order: 1,
    });

    await createItem({
      id: nanoid(),
      title: "📊 View Reports",
      content:
        "Check out the dashboard to see insights about your time usage and productivity patterns.",
      boardId: board.id,
      columnId: todoColumn.id,
      order: 2,
    });

    await createItem({
      id: nanoid(),
      title: "🎯 Create Your First Task",
      content:
        "Click the + button in any column to create a new task. Try moving this task to 'In Progress' when you start!",
      boardId: board.id,
      columnId: todoColumn.id,
      order: 3,
    });
  }

  const defaultSettings = {
    [USER_SETTINGS_KEYS.accessibilityPermission]: "true",
    [USER_SETTINGS_KEYS.screenRecordingPermission]: "true",
    [USER_SETTINGS_KEYS.isFocusMode]: "true",
    [USER_SETTINGS_KEYS.isTracking]: "true",
  };

  await setMultipleValues(defaultSettings);

  // Insert default blocked domains
  for (const domain of defaultBlockedDomains) {
    await db
      .insert(blockedDomains)
      .values({
        userId: existingUserId,
        domain,
        active: true,
        updatedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: [blockedDomains.userId, blockedDomains.domain],
        set: {
          active: true,
          updatedAt: Date.now(),
        },
      });
  }

  // Insert default blocked apps
  for (const appName of defaultBlockedApps) {
    await db
      .insert(blockedApps)
      .values({
        userId: existingUserId,
        appName,
        active: true,
        updatedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: [blockedApps.userId, blockedApps.appName],
        set: {
          active: true,
          updatedAt: Date.now(),
        },
      });
  }
  return existingUserId;
}

export async function updateUserSettings(settings: {
  accessibilityPermission?: boolean;
  screenRecordingPermission?: boolean;
  isFocusMode?: boolean;
  currentTaskId?: string | null;
  lastUpdateActivity?: number | null;
  isTracking?: boolean;
  timeEntryId?: string | null;
}) {
  const updates: Record<string, string> = {};

  if (settings.accessibilityPermission !== undefined) {
    updates[USER_SETTINGS_KEYS.accessibilityPermission] =
      settings.accessibilityPermission.toString();
  }
  if (settings.screenRecordingPermission !== undefined) {
    updates[USER_SETTINGS_KEYS.screenRecordingPermission] =
      settings.screenRecordingPermission.toString();
  }
  if (settings.isFocusMode !== undefined) {
    updates[USER_SETTINGS_KEYS.isFocusMode] = settings.isFocusMode.toString();
  }
  if (settings.currentTaskId !== undefined) {
    updates[USER_SETTINGS_KEYS.currentTaskId] = settings.currentTaskId || "";
  }
  if (settings.timeEntryId !== undefined) {
    updates[USER_SETTINGS_KEYS.timeEntryId] = settings.timeEntryId || "";
  }
  if (settings.lastUpdateActivity !== undefined) {
    updates[USER_SETTINGS_KEYS.lastUpdateActivity] = settings.lastUpdateActivity?.toString() || "";
  }
  if (settings.isTracking !== undefined) {
    updates[USER_SETTINGS_KEYS.isTracking] = settings.isTracking.toString();
  }
  if (Object.keys(updates).length > 0) {
    await setMultipleValues(updates);
  }
}

export const getUserBlockedApps = async (userId: string) => {
  const result = await db.select().from(blockedApps).where(eq(blockedApps.userId, userId));
  return result;
};

export const getUserBlockedDomains = async (userId: string) => {
  const result = await db.select().from(blockedDomains).where(eq(blockedDomains.userId, userId));
  return result;
};
