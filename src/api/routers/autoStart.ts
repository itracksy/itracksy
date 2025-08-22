import { z } from "zod";
import { t, protectedProcedure } from "../trpc";
import {
  getAutoStartStatus,
  setAutoStart,
  toggleAutoStart,
  isAutoStartSupported,
  getAutoStartInfo,
  type AutoStartOptions,
} from "../services/autoStart";

export const autoStartRouter = t.router({
  // Get current auto-start status
  getStatus: protectedProcedure.query(async () => {
    return getAutoStartStatus();
  }),

  // Set auto-start enabled/disabled
  setEnabled: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        openAsHidden: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const success = setAutoStart(input.enabled, {
        openAsHidden: input.openAsHidden,
      });

      return {
        success,
        status: getAutoStartStatus(),
      };
    }),

  // Toggle auto-start
  toggle: protectedProcedure.mutation(async () => {
    const success = toggleAutoStart();
    return {
      success,
      status: getAutoStartStatus(),
    };
  }),

  // Get platform info and support status
  getInfo: protectedProcedure.query(async () => {
    return getAutoStartInfo();
  }),

  // Check if auto-start is supported on current platform
  isSupported: protectedProcedure.query(async () => {
    return {
      supported: isAutoStartSupported(),
      platform: process.platform,
    };
  }),
});
