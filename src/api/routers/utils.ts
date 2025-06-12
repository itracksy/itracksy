import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import { shell } from "electron";
import { createNotificationWindow, closeNotificationWindow as closeWindow } from "../../main/windows/notification";

export const utilsRouter = t.router({
  openExternalUrl: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await shell.openExternal(input.url);
      return { success };
    }),

  openNotificationWindow: protectedProcedure
    .mutation(() => {
      try {
        const window = createNotificationWindow();
        return { success: !!window };
      } catch (error) {
        console.error('Failed to open notification window:', error);
        return { success: false, error: String(error) };
      }
    }),

  closeNotificationWindow: protectedProcedure
    .mutation(() => {
      try {
        closeWindow();
        return { success: true };
      } catch (error) {
        console.error('Failed to close notification window:', error);
        return { success: false, error: String(error) };
      }
    }),
});
