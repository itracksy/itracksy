import { createRoute } from "@tanstack/react-router";
import { RootRoute } from "./__root";
import DashboardPage from "@/pages/dashboard/index";
import FocusPage from "@/pages/focus/index";
import { ProjectsPage } from "@/pages/projects/page";
import SettingsPage from "@/pages/settings-page/SettingsPage";
import RainingLetters from "@/pages/rainning-letter/index";
import FullScreenLayout from "@/layouts/FullScreenLayout";
import RuleBookPage from "@/pages/rule-book";
import { ActivityClassificationPage } from "@/pages/new-activity-classification/page";
import CategorizationPage from "@/pages/categorization/index";
import { CategoryManagement } from "@/pages/categorization/components/CategoryManagement";
import { UncategorizedActivities } from "@/pages/categorization/components/UncategorizedActivities";
import ReportsPage from "@/pages/reports/ReportsPage";
import MusicPage from "@/pages/music/index";
import SchedulingPage from "@/pages/scheduling/index";
import LogPage from "@/pages/app-logs/index";

const DashboardRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const FocusRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  component: FocusPage,
});
const ProjectsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/projects",
  component: ProjectsPage,
});

const CategorizationRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/categorization",
  component: CategorizationPage,
});

const CategoryManagementRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/categorization/manage",
  component: CategoryManagement,
});

const UncategorizedActivitiesRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/categorization/uncategorized",
  component: UncategorizedActivities,
});

const SettingsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/settings",
  component: SettingsPage,
});

const RainingLettersRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/raining-letters",
  component: () => (
    <FullScreenLayout>
      <RainingLetters />
    </FullScreenLayout>
  ),
});

const ClassificationRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/classify",
  component: ActivityClassificationPage,
});

export const RuleBookRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/rule-book",
  component: RuleBookPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      editRuleId: (search.editRuleId as string) || undefined,
      createRule: search.createRule === "true" || search.createRule === true,
      appName: (search.appName as string) || undefined,
      domain: (search.domain as string) || undefined,
      title: (search.title as string) || undefined,
      titleCondition: (search.titleCondition as string) || undefined,
      rating: search.rating !== undefined ? Number(search.rating) : undefined,
    };
  },
});

const ReportsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/reports",
  component: ReportsPage,
});

const MusicRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/music",
  component: MusicPage,
});

const SchedulingRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/scheduling",
  component: SchedulingPage,
});

const LogsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/logs",
  component: LogPage,
});

export const rootTree = RootRoute.addChildren([
  FocusRoute,
  DashboardRoute,
  ProjectsRoute,
  CategorizationRoute,
  CategoryManagementRoute,
  UncategorizedActivitiesRoute,
  SettingsRoute,
  RainingLettersRoute,
  ClassificationRoute,
  RuleBookRoute,
  ReportsRoute,
  MusicRoute,
  SchedulingRoute,
  LogsRoute,
]);
