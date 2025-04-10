import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import { shell } from "electron";

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
});
