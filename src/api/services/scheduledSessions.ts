import db from "../db";
import { scheduledSessions } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getCurrentUserIdLocalStorage } from "./userSettings";
import { createTimeEntry } from "./timeEntry";
import { logger } from "../../helpers/logger";
import type { TimeEntry } from "@/types/ipc";

// Extend NodeJS.Global for scheduled session interval tracking
declare global {
  var scheduledSessionInterval: ReturnType<typeof setInterval> | undefined;
}

/**
 * Update values for scheduled session (for DB update)
 */
interface ScheduledSessionUpdateValues {
  name?: string;
  description?: string;
  focusDuration?: number;
  breakDuration?: number;
  cycles?: number;
  startTime?: string;
  daysOfWeek?: string;
  isActive?: boolean;
  autoStart?: boolean;
  updatedAt: number;
  nextRun?: number | null;
}

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

  // Exclude daysOfWeek from initial spread since it needs to be stringified
  const { daysOfWeek, ...restUpdateData } = updateData;
  const updateValues: ScheduledSessionUpdateValues = {
    ...restUpdateData,
    updatedAt: now,
  };

  if (daysOfWeek) {
    updateValues.daysOfWeek = JSON.stringify(daysOfWeek);
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
async function getSessionsToRun(): Promise<ScheduledSession[]> {
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

    // Check if there's already an active session
    const { getActiveTimeEntry } = await import("./timeEntry");
    const activeEntry = await getActiveTimeEntry(userId);

    if (activeEntry) {
      // There's an active session - ask user what to do
      const userChoice = await askUserAboutScheduledSession(session, activeEntry);

      switch (userChoice) {
        case "stop_current_start_scheduled":
          // Stop current session and start scheduled
          await stopCurrentSession(activeEntry.id);
          return await startScheduledSession(session, sessionId);

        case "queue_scheduled":
          // Queue the scheduled session for later
          await queueScheduledSession(session, sessionId);
          return true;

        case "skip_scheduled":
          // Skip this occurrence
          await skipScheduledSession(sessionId);
          return true;

        default:
          // User cancelled or choice not handled
          return false;
      }
    } else {
      // No active session - start scheduled session normally
      return await startScheduledSession(session, sessionId);
    }
  } catch (error) {
    logger.error(`[executeScheduledSession] Failed to execute session ${sessionId}`, { error });
    return false;
  }
}

/**
 * Ask user what to do when there's a conflict with scheduled session
 * For now, we'll use a simple approach: send a notification and default to stopping current session
 * In the future, this could be enhanced with interactive notifications or a dialog
 */
async function askUserAboutScheduledSession(
  scheduledSession: ScheduledSession,
  activeEntry: TimeEntry
): Promise<"stop_current_start_scheduled" | "queue_scheduled" | "skip_scheduled" | "cancelled"> {
  try {
    // Import the notification service
    const { sendNotification } = await import("./notification");

    // Send a notification to inform the user about the conflict
    await sendNotification(
      {
        title: "Scheduled Session Conflict",
        body: `"${scheduledSession.name}" is scheduled to start now, but you have an active session. The current session will be stopped to start the scheduled one.`,
        userId: scheduledSession.userId,
        type: "focus_reminder",
        timeEntryId: activeEntry.id,
        createdAt: Date.now(),
      },
      10000, // 10 second timeout
      true // Auto-dismiss
    );

    // For now, default to stopping current and starting scheduled
    // In the future, this could be enhanced with:
    // 1. Interactive notifications with action buttons
    // 2. A dialog window asking for user choice
    // 3. Integration with the notification system's action handling
    logger.info(
      `[askUserAboutScheduledSession] User notified about scheduled session conflict: ${scheduledSession.name}`
    );
    return "stop_current_start_scheduled";
  } catch (error) {
    logger.error("[askUserAboutScheduledSession] Failed to send notification", { error });
    // Default to stopping current and starting scheduled
    return "stop_current_start_scheduled";
  }
}

/**
 * Stop the current session
 */
async function stopCurrentSession(entryId: string): Promise<void> {
  try {
    const { updateTimeEntry } = await import("./timeEntry");
    await updateTimeEntry(entryId, { endTime: Date.now() });
    logger.info(`[stopCurrentSession] Stopped current session: ${entryId}`);
  } catch (error) {
    logger.error(`[stopCurrentSession] Failed to stop session ${entryId}`, { error });
  }
}

/**
 * Start the scheduled session
 */
async function startScheduledSession(
  session: ScheduledSession,
  sessionId: string
): Promise<boolean> {
  try {
    const { createTimeEntry } = await import("./timeEntry");

    // Create a new time entry for the scheduled session
    await createTimeEntry(
      {
        isFocusMode: true,
        startTime: Date.now(),
        targetDuration: session.focusDuration,
        description: `Scheduled: ${session.name}`,
        autoStopEnabled: true,
      },
      session.userId
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

    logger.info(`[startScheduledSession] Started scheduled session: ${session.name}`);
    return true;
  } catch (error) {
    logger.error(`[startScheduledSession] Failed to start scheduled session ${sessionId}`, {
      error,
    });
    return false;
  }
}

/**
 * Queue the scheduled session for later execution
 */
async function queueScheduledSession(session: ScheduledSession, sessionId: string): Promise<void> {
  try {
    // Mark session as queued (you might want to add a 'queued' field to the schema)
    await db
      .update(scheduledSessions)
      .set({
        updatedAt: Date.now(),
        // Add a note that this session was queued
      })
      .where(eq(scheduledSessions.id, sessionId));

    logger.info(`[queueScheduledSession] Queued scheduled session: ${session.name}`);
  } catch (error) {
    logger.error(`[queueScheduledSession] Failed to queue session ${sessionId}`, { error });
  }
}

/**
 * Skip this occurrence of the scheduled session
 */
async function skipScheduledSession(sessionId: string): Promise<void> {
  try {
    // Update next run time to skip this occurrence
    const session = await getScheduledSessionById(sessionId, "");
    if (session) {
      const nextRun = calculateNextRunTime(session.startTime, session.daysOfWeek, true);
      await db
        .update(scheduledSessions)
        .set({
          nextRun,
          updatedAt: Date.now(),
        })
        .where(eq(scheduledSessions.id, sessionId));
    }

    logger.info(`[skipScheduledSession] Skipped scheduled session: ${sessionId}`);
  } catch (error) {
    logger.error(`[skipScheduledSession] Failed to skip session ${sessionId}`, { error });
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
  global.scheduledSessionInterval = interval;
}

/**
 * Stop scheduled session monitoring
 */
export function stopScheduledSessionMonitoring(): void {
  const interval = global.scheduledSessionInterval;
  if (interval) {
    clearInterval(interval);
    global.scheduledSessionInterval = undefined;
  }
}
