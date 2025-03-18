import { desc, eq, and } from "drizzle-orm";
import db from "../db";
import { notifications } from "../db/schema";
import { NotificationInsert } from "@/types/notification";
import { nanoid } from "nanoid";
export const getLastNotification = async (userId: string, type?: string) => {
  const query = type
    ? and(eq(notifications.userId, userId), eq(notifications.type, type))
    : eq(notifications.userId, userId);

  const result = await db
    .select()
    .from(notifications)
    .where(query)
    .orderBy(desc(notifications.createdAt))
    .limit(1);

  return result[0];
};

export const createNotification = async (options: Omit<NotificationInsert, "id">) => {
  const { userId, title, body, type, timeEntryId } = options;

  await db.insert(notifications).values({
    id: nanoid(),
    userId,
    title,
    body,
    type,
    timeEntryId,
    createdAt: Date.now(),
  });
};
