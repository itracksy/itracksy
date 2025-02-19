import { t } from "./trpc";
import { activityRouter } from "./routers/activity";
import { userRouter } from "./routers/user";

// Create the root router
export const router = t.router({
  activity: activityRouter,
  user: userRouter,
});

// Export type router type signature
export type AppRouter = typeof router;
