import { t } from "./trpc";
import { activityRouter } from "./routers/activity";
import { userRouter } from "./routers/user";
import { authRouter } from "./routers/auth";
import { timeEntryRouter } from "./routers/timeEntry";

// Create the root router
export const router = t.router({
  activity: activityRouter,
  user: userRouter,
  auth: authRouter,
  timeEntry: timeEntryRouter,
});

// Export type router type signature
export type AppRouter = typeof router;
