import { t, publicProcedure } from "../trpc";
import { z } from "zod";
import { sendSystemNotification } from "../services/notification";

export const notificationRouter = t.router({
  sendNotification: publicProcedure
    .input(
      z.object({
        title: z.string(),
        body: z.string(),
        silent: z.boolean().optional(),
        requireInteraction: z.boolean().optional(),
        timeoutMs: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return sendSystemNotification(input);
    }),
});
