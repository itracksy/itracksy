import { z } from "zod";
import { t, publicProcedure } from "../trpc";
import { setCurrentUserId } from "../db/repositories/userSettings";
import { logger } from "../../helpers/logger";

export const authRouter = t.router({
  signInAnonymously: publicProcedure.input(z.string()).mutation(async ({ input }) => {
    try {
      logger.info("[auth.signInAnonymously] Signing in anonymously", {
        userId: input,
      });
      await setCurrentUserId(input);
      return { success: true };
    } catch (error) {
      logger.error("[auth.signInAnonymously] Failed to set user id", {
        userId: input,
        error,
      });
      throw new Error("Failed to sign in anonymously");
    }
  }),
});
