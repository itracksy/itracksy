import { logger } from "../../helpers/logger";
import { getSystemState } from "./systemMonitor";
import { getPausedSession } from "./sessionPause";
import { IDLE_THRESHOLD_MINUTES } from "../../config/tracking";

/**
 * Debug utility to check the current state of system monitoring and session tracking
 */
export const debugSystemState = (): void => {
  const systemState = getSystemState();
  const pausedSession = getPausedSession();

  logger.info("[Debug] System State Check", {
    isSystemActive: systemState.isActive,
    isSystemIdle: systemState.isIdle,
    isSystemLocked: systemState.isLocked,
    hasPausedSession: !!pausedSession,
    pausedSessionId: pausedSession?.timeEntryId,
    pausedAt: pausedSession ? new Date(pausedSession.pausedAt).toISOString() : null,
  });

  console.log("🔍 System State Debug:", {
    "✅ System Active": systemState.isActive,
    "💤 System Idle": systemState.isIdle,
    "🔒 System Locked": systemState.isLocked,
    "⏸️ Session Paused": !!pausedSession,
    "🆔 Paused Session": pausedSession?.timeEntryId || "None",
  });
};

/**
 * Test function to simulate system state changes (for development/testing)
 */
export const testSystemMonitoring = (): void => {
  logger.info("[Test] Testing system monitoring...");
  console.log("🧪 Testing system monitoring - check logs for detailed output");

  // Log current state
  debugSystemState();

  // Instructions for manual testing
  console.log(`
📋 Manual Testing Instructions:
1. Lock your screen (Cmd+Ctrl+Q on macOS) - should pause tracking
2. Unlock your screen - should resume tracking
3. Leave system idle for ${IDLE_THRESHOLD_MINUTES} minutes - should pause tracking
4. Move mouse/type - should resume tracking
5. Check logs for system state changes
  `);
};
