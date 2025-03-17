import { initTRPC, TRPCError } from "@trpc/server";
import { logger } from "../helpers/logger";
import { getCurrentUserIdLocalStorage } from "./services/userSettings";

// Define context type
export interface Context {
  userId: string | null;
}

// Create context for each request
export const createContext = async (): Promise<{ userId: string | null }> => {
  const userId = await getCurrentUserIdLocalStorage();
  return { userId };
};

const t = initTRPC.context<Context>().create();

// Create middleware
const loggerMiddleware = t.middleware(async ({ path, type, ctx, next }) => {
  const start = Date.now();

  const result = await next();

  const durationMs = Date.now() - start;
  if (result.ok) {
    logger.debug(`[tRPC] ${type} ${path} completed`, {
      durationMs,
      type,
      path,
      userId: ctx.userId,
    });
  } else {
    logger.error(`[tRPC] ${type} ${path} failed`, {
      durationMs,
      type,
      path,
      userId: ctx.userId,
      error: result.error,
    });
  }

  return result;
});

// Add auth check middleware
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not authenticated",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // TypeScript now knows userId is not null here
    },
  });
});

// Export procedures that include the logger middleware
export const publicProcedure = t.procedure.use(loggerMiddleware);
export const protectedProcedure = t.procedure.use(loggerMiddleware).use(authMiddleware);
export { t };
