import { t } from "./trpc";
import { activityRouter } from "./routers/activity";
import { userRouter } from "./routers/user";
import { authRouter } from "./routers/auth";
import { timeEntryRouter } from "./routers/timeEntry";
import { boardRouter } from "./routers/board";
import { dashboardRouter } from "./routers/dashboard";
import { utilsRouter } from "./routers/utils";

// Create the root router
export const router = t.router({
  activity: activityRouter,
  user: userRouter,
  auth: authRouter,
  timeEntry: timeEntryRouter,
  board: boardRouter,
  dashboard: dashboardRouter,
  utils: utilsRouter,
});

// Export type router type signature
export type AppRouter = typeof router;
