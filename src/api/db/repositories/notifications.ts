import { desc, eq, and } from "drizzle-orm";
import db from "..";
import { notifications } from "../schema";

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
