import db from "../db";
import { scheduledSessions } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getCurrentUserIdLocalStorage } from "./userSettings";
import { createTimeEntry } from "./timeEntry";
import { logger } from "../../helpers/logger";

export interface ScheduledSession {
  id: string;
  name: string;
  description?: string | null;
  focusDuration: number; // minutes
  breakDuration: number; // minutes
  cycles: number;
  startTime: string; // HH:MM format
  daysOfWeek: number[]; // 0-6, 0 = Sunday
  isActive: boolean;
  autoStart: boolean;
  userId: string;
  createdAt: number;
  updatedAt: number;
  lastRun?: number | null;
  nextRun?: number | null;
}

export interface CreateScheduledSessionInput {
  name: string;
  description?: string;
  focusDuration: number;
  breakDuration: number;
  cycles: number;
  startTime: string;
  daysOfWeek: number[];
  isActive?: boolean;
  autoStart?: boolean;
}

export interface UpdateScheduledSessionInput extends Partial<CreateScheduledSessionInput> {
  id: string;
}

/**
 * Create a new scheduled session
 */
export async function createScheduledSession(
  input: CreateScheduledSessionInput,
  userId: string
): Promise<ScheduledSession> {
  const now = Date.now();
  const nextRun = calculateNextRunTime(input.startTime, input.daysOfWeek, input.isActive ?? true);

  const sessionData = {
    id: nanoid(),
    ...input,
    isActive: input.isActive ?? true,
    autoStart: input.autoStart ?? false,
    userId,
    createdAt: now,
    updatedAt: now,
    daysOfWeek: JSON.stringify(input.daysOfWeek),
    nextRun,
  };

  const [createdSession] = await db.insert(scheduledSessions).values(sessionData).returning();

  return {
    ...createdSession,
    daysOfWeek: JSON.parse(createdSession.daysOfWeek),
  };
}

/**
 * Get all scheduled sessions for a user
 */
export async function getUserScheduledSessions(userId: string): Promise<ScheduledSession[]> {
  const sessions = await db
    .select()
    .from(scheduledSessions)
    .where(eq(scheduledSessions.userId, userId))
    .orderBy(scheduledSessions.createdAt);

  return sessions.map((session) => ({
    ...session,
    daysOfWeek: JSON.parse(session.daysOfWeek),
  }));
}

/**
 * Get a single scheduled session by ID
 */
export async function getScheduledSessionById(
  id: string,
  userId: string
): Promise<ScheduledSession | null> {
  const [session] = await db
    .select()
    .from(scheduledSessions)
    .where(and(eq(scheduledSessions.id, id), eq(scheduledSessions.userId, userId)));

  if (!session) return null;

  return {
    ...session,
    daysOfWeek: JSON.parse(session.daysOfWeek),
  };
}

/**
 * Update a scheduled session
 */
export async function updateScheduledSession(
  input: UpdateScheduledSessionInput,
  userId: string
): Promise<ScheduledSession | null> {
  const { id, ...updateData } = input;
  const now = Date.now();

  // Calculate new next run time if timing-related fields changed
  const nextRun =
    updateData.startTime || updateData.daysOfWeek || updateData.isActive !== undefined
      ? calculateNextRunTime(
          updateData.startTime || "",
          updateData.daysOfWeek || [],
          updateData.isActive ?? true
        )
      : undefined;

  const updateValues: any = {
    ...updateData,
    updatedAt: now,
  };

  if (updateData.daysOfWeek) {
    updateValues.daysOfWeek = JSON.stringify(updateData.daysOfWeek);
  }

  if (nextRun !== undefined) {
    updateValues.nextRun = nextRun;
  }

  const [updatedSession] = await db
    .update(scheduledSessions)
    .set(updateValues)
    .where(and(eq(scheduledSessions.id, id), eq(scheduledSessions.userId, userId)))
    .returning();

  if (!updatedSession) return null;

  return {
    ...updatedSession,
    daysOfWeek: JSON.parse(updatedSession.daysOfWeek),
  };
}

/**
 * Delete a scheduled session
 */
export async function deleteScheduledSession(id: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(scheduledSessions)
    .where(and(eq(scheduledSessions.id, id), eq(scheduledSessions.userId, userId)));

  return result.rowsAffected > 0;
}

/**
 * Toggle active status of a scheduled session
 */
export async function toggleScheduledSessionActive(
  id: string,
  userId: string,
  isActive: boolean
): Promise<ScheduledSession | null> {
  const now = Date.now();
  const nextRun = isActive ? calculateNextRunTime("", [], true) : null;

  const [updatedSession] = await db
    .update(scheduledSessions)
    .set({
      isActive,
      updatedAt: now,
      nextRun,
    })
    .where(and(eq(scheduledSessions.id, id), eq(scheduledSessions.userId, userId)))
    .returning();

  if (!updatedSession) return null;

  return {
    ...updatedSession,
    daysOfWeek: JSON.parse(updatedSession.daysOfWeek),
  };
}

/**
 * Get sessions that should run now
 */
export async function getSessionsToRun(): Promise<ScheduledSession[]> {
  const now = Date.now();
  const currentTime = new Date(now);
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentDay = currentTime.getDay();

  const allActiveSessions = await db
    .select()
    .from(scheduledSessions)
    .where(eq(scheduledSessions.isActive, true));

  const sessionsToRun: ScheduledSession[] = [];

  for (const session of allActiveSessions) {
    const daysOfWeek = JSON.parse(session.daysOfWeek);

    // Check if today is a scheduled day
    if (!daysOfWeek.includes(currentDay)) continue;

    // Parse start time
    const [hours, minutes] = session.startTime.split(":").map(Number);
    const sessionStartMinutes = hours * 60 + minutes;

    // Check if it's time to run (within 1 minute window)
    if (Math.abs(currentMinutes - sessionStartMinutes) <= 1) {
      // Check if not already run today
      const lastRun = session.lastRun ? new Date(session.lastRun) : null;
      const today = new Date(currentTime);
      today.setHours(0, 0, 0, 0);

      if (!lastRun || lastRun < today) {
        sessionsToRun.push({
          ...session,
          daysOfWeek,
        });
      }
    }
  }

  return sessionsToRun;
}

/**
 * Execute a scheduled session
 */
export async function executeScheduledSession(sessionId: string): Promise<boolean> {
  try {
    const userId = await getCurrentUserIdLocalStorage();
    if (!userId) return false;

    const session = await getScheduledSessionById(sessionId, userId);
    if (!session || !session.isActive) return false;

    // Create a new time entry for the scheduled session
    await createTimeEntry(
      {
        isFocusMode: true,
        startTime: Date.now(),
        targetDuration: session.focusDuration,
        description: `Scheduled: ${session.name}`,
        autoStopEnabled: true, // Enable auto-stop for scheduled sessions
      },
      userId
    );

    // Update last run time
    await db
      .update(scheduledSessions)
      .set({
        lastRun: Date.now(),
        nextRun: calculateNextRunTime(session.startTime, session.daysOfWeek, true),
        updatedAt: Date.now(),
      })
      .where(eq(scheduledSessions.id, sessionId));

    logger.info(`[executeScheduledSession] Executed scheduled session: ${session.name}`);
    return true;
  } catch (error) {
    logger.error(`[executeScheduledSession] Failed to execute session ${sessionId}`, { error });
    return false;
  }
}

/**
 * Calculate the next run time for a scheduled session
 */
function calculateNextRunTime(
  startTime: string,
  daysOfWeek: number[],
  isActive: boolean
): number | null {
  if (!isActive || !startTime || daysOfWeek.length === 0) return null;

  const now = new Date();
  const [hours, minutes] = startTime.split(":").map(Number);

  // Try today first
  const today = new Date(now);
  today.setHours(hours, minutes, 0, 0);

  if (daysOfWeek.includes(today.getDay()) && today > now) {
    return today.getTime();
  }

  // Find next occurrence
  for (let i = 1; i <= 7; i++) {
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + i);
    nextDay.setHours(hours, minutes, 0, 0);

    if (daysOfWeek.includes(nextDay.getDay())) {
      return nextDay.getTime();
    }
  }

  return null;
}

/**
 * Initialize scheduled session monitoring
 * This should be called on app startup to start monitoring for scheduled sessions
 */
export function initializeScheduledSessionMonitoring(): void {
  // Check for sessions to run every minute
  const interval = setInterval(async () => {
    try {
      const sessionsToRun = await getSessionsToRun();

      for (const session of sessionsToRun) {
        if (session.autoStart) {
          await executeScheduledSession(session.id);
        } else {
          // Send notification that a session is ready to start
          // This would integrate with the notification system
          logger.info(`[initializeScheduledSessionMonitoring] Session ready: ${session.name}`);
        }
      }
    } catch (error) {
      logger.error("[initializeScheduledSessionMonitoring] Error checking scheduled sessions", {
        error,
      });
    }
  }, 60000); // Check every minute

  // Store interval ID for cleanup if needed
  (global as any).scheduledSessionInterval = interval;
}

/**
 * Stop scheduled session monitoring
 */
export function stopScheduledSessionMonitoring(): void {
  const interval = (global as any).scheduledSessionInterval;
  if (interval) {
    clearInterval(interval);
    delete (global as any).scheduledSessionInterval;
  }
}
