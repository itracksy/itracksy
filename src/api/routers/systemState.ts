import { z } from "zod";
import { t, protectedProcedure } from "../trpc";
import { getSystemState } from "../services/systemMonitor";
import { getPausedSession, isSessionManuallyPaused } from "../services/sessionPause";
import { logger } from "../../helpers/logger";

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

    logger.info("[SystemState] checkResumeRequired called", {
      systemIsActive: systemState.isActive,
      isLocked: systemState.isLocked,
      isSleeping: systemState.isSleeping,
      hasPausedSession: !!pausedSession,
      pausedSessionTimeEntryId: pausedSession?.timeEntryId,
      isManualPause: pausedSession?.isManualPause,
    });

    // Check if system is active and there's a paused session
    // Don't show resume dialog for manual pauses - user controls those via the PAUSE/RESUME button
    if (systemState.isActive && pausedSession && !pausedSession.isManualPause) {
      const activeEntry = await getActiveTimeEntry(ctx.userId!);
      logger.info("[SystemState] checkResumeRequired - checking active entry", {
        hasActiveEntry: !!activeEntry,
        activeEntryId: activeEntry?.id,
        pausedSessionId: pausedSession.timeEntryId,
        idsMatch: activeEntry?.id === pausedSession.timeEntryId,
        hasEndTime: !!activeEntry?.endTime,
      });

      // Only show resume dialog if there's an active entry that matches the paused session
      if (activeEntry && activeEntry.id === pausedSession.timeEntryId && !activeEntry.endTime) {
        logger.info("[SystemState] checkResumeRequired - resume IS required");
        return {
          requiresResume: true,
          sessionId: pausedSession.timeEntryId,
          pausedAt: pausedSession.pausedAt,
          activeEntry,
        };
      }
    }

    logger.info("[SystemState] checkResumeRequired - resume NOT required");
    return {
      requiresResume: false,
      sessionId: null,
      pausedAt: null,
      activeEntry: null,
    };
  }),
});
