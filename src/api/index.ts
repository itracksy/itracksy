import { t } from "./trpc";
import { activityRouter } from "./routers/activity";
import { userRouter } from "./routers/user";
import { authRouter } from "./routers/auth";
import { timeEntryRouter } from "./routers/timeEntry";
import { boardRouter } from "./routers/board";
import { dashboardRouter } from "./routers/dashboard";
import { utilsRouter } from "./routers/utils";
import { focusTargetsRouter } from "./routers/focusTargets";
import { categoryRouter } from "./routers/category";
import { schedulingRouter } from "./routers/scheduling";
import { autoStartRouter } from "./routers/autoStart";
import { windowRouter } from "./routers/window";

// Create the root router
export const router = t.router({
  activity: activityRouter,
  user: userRouter,
  auth: authRouter,
  timeEntry: timeEntryRouter,
  board: boardRouter,
  dashboard: dashboardRouter,
  utils: utilsRouter,
  focusTargets: focusTargetsRouter,
  category: categoryRouter,
  scheduling: schedulingRouter,
  autoStart: autoStartRouter,
  window: windowRouter,
});

// Export type router type signature
export type AppRouter = typeof router;
