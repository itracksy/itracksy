import { z } from "zod";
import { t } from "../trpc";
import { updateActivitySettings } from "../services/activity";
import { setCurrentUserId } from "../../db/repositories/userSettings";

const trackingSettingsSchema = z.object({
  accessibilityPermission: z.boolean(),
  screenRecordingPermission: z.boolean(),
  blockedDomains: z.array(z.string()),
  blockedApps: z.array(z.string()),
  isFocusMode: z.boolean(),
  currentTaskId: z.string().optional(),
});

const updateTrackingSettingsSchema = trackingSettingsSchema.partial();

// Create the router
export const userRouter = t.router({
  updateActivitySettings: t.procedure
    .input(updateTrackingSettingsSchema)
    .mutation(async ({ input }) => {
      try {
        updateActivitySettings(input);
        return { success: true, settings: input };
      } catch (error) {
        throw new Error("Failed to update activity settings");
      }
    }),
  setCurrrentUserId: t.procedure.input(z.string()).mutation(async ({ input }) => {
    try {
      setCurrentUserId(input);
    } catch (error) {
      throw new Error("Failed to set current user id");
    }
  }),
  // Settings Management
  updateBlockedDomains: t.procedure.input(z.array(z.string())).mutation(async ({ input }) => {
    try {
      // Implement blocked domains update logic
      return { success: true, blockedDomains: input };
    } catch (error) {
      throw new Error("Failed to update blocked domains");
    }
  }),

  updateBlockedApps: t.procedure.input(z.array(z.string())).mutation(async ({ input }) => {
    try {
      // Implement blocked apps update logic
      return { success: true, blockedApps: input };
    } catch (error) {
      throw new Error("Failed to update blocked apps");
    }
  }),
});
