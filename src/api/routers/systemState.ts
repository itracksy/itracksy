import { z } from "zod";
import { t, protectedProcedure } from "../trpc";
import { getSystemState } from "../services/systemMonitor";
import { getPausedSession, isSessionManuallyPaused } from "../services/sessionPause";

export const systemStateRouter = t.router({
  getSystemState: protectedProcedure.query(async () => {
    const systemState = getSystemState();
    const pausedSession = getPausedSession();

    return {
      ...systemState,
      hasPausedSession: !!pausedSession,
      isManuallyPaused: isSessionManuallyPaused(),
      pausedSessionId: pausedSession?.timeEntryId || null,
      pausedAt: pausedSession?.pausedAt || null,
    };
  }),

  checkResumeRequired: protectedProcedure.query(async ({ ctx }) => {
    const { getActiveTimeEntry } = await import("../services/timeEntry");
    const systemState = getSystemState();
    const pausedSession = getPausedSession();

    // Check if system is active and there's a paused session
    // Don't show resume dialog for manual pauses - user controls those via the PAUSE/RESUME button
    if (systemState.isActive && pausedSession && !pausedSession.isManualPause) {
      const activeEntry = await getActiveTimeEntry(ctx.userId!);
      // Only show resume dialog if there's an active entry that matches the paused session
      if (activeEntry && activeEntry.id === pausedSession.timeEntryId && !activeEntry.endTime) {
        return {
          requiresResume: true,
          sessionId: pausedSession.timeEntryId,
          pausedAt: pausedSession.pausedAt,
          activeEntry,
        };
      }
    }

    return {
      requiresResume: false,
      sessionId: null,
      pausedAt: null,
      activeEntry: null,
    };
  }),
});
