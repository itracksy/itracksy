import { t, publicProcedure } from "../trpc";
import { getCurrentUserIdLocalStorage, setCurrentUserId } from "../services/userSettings";
import { logger } from "../../helpers/logger";

export const authRouter = t.router({
  signInAnonymously: publicProcedure.mutation(async ({ input }) => {
    try {
      const existingUserId = await getCurrentUserIdLocalStorage();
      if (!existingUserId) {
        const newUserId = crypto.randomUUID();
        await setCurrentUserId(newUserId);
        logger.info("[auth.signInAnonymously] User id set", {
          userId: newUserId,
        });
        return { userId: newUserId, success: true };
      }

      return { success: true, userId: existingUserId };
    } catch (error) {
      logger.fatal("[auth.signInAnonymously] Failed to set user id", {
        userId: input,
        error,
      });
      throw new Error("Failed to sign in anonymously");
    }
  }),
});
