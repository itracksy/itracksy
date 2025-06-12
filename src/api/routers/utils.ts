import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import { shell } from "electron";
import {
  createNotificationWindow,
  closeNotificationWindow as closeWindow,
} from "../../main/windows/notification";

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
    .input(
      z
        .object({
          title: z.string(),
          description: z.string(),
        })
        .optional()
    )
    .mutation(({ input }) => {
      try {
        const window = createNotificationWindow();

        // If data is provided, send it to the notification window
        if (input && window) {
          window.webContents.send("show-notification", {
            title: input.title,
            body: input.description,
          });
        }

        return { success: !!window };
      } catch (error) {
        console.error("Failed to open notification window:", error);
        return { success: false, error: String(error) };
      }
    }),

  closeNotificationWindow: protectedProcedure.mutation(() => {
    try {
      closeWindow();
      return { success: true };
    } catch (error) {
      console.error("Failed to close notification window:", error);
      return { success: false, error: String(error) };
    }
  }),

  // Direct notification send procedure (uses the new IPC channel)
  sendNotification: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
      })
    )
    .mutation(({ input }) => {
      try {
        const window = createNotificationWindow();

        if (window) {
          window.webContents.send("show-notification", {
            title: input.title,
            body: input.description,
          });
        }

        return { success: !!window };
      } catch (error) {
        console.error("Failed to send notification:", error);
        return { success: false, error: String(error) };
      }
    }),
});
