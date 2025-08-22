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

export const DashboardRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

export const FocusRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  component: FocusPage,
});
export const ProjectsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/projects",
  component: ProjectsPage,
});

export const CategorizationRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/categorization",
  component: CategorizationPage,
});

export const CategoryManagementRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/categorization/manage",
  component: CategoryManagement,
});

export const UncategorizedActivitiesRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/categorization/uncategorized",
  component: UncategorizedActivities,
});

export const SettingsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/settings",
  component: SettingsPage,
});

export const RainingLettersRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/raining-letters",
  component: () => (
    <FullScreenLayout>
      <RainingLetters />
    </FullScreenLayout>
  ),
});

export const ClassificationRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/classify",
  component: ActivityClassificationPage,
});

export const RuleBookRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/rule-book",
  component: RuleBookPage,
});

export const ReportsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/reports",
  component: ReportsPage,
});

export const MusicRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/music",
  component: MusicPage,
});

export const SchedulingRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/scheduling",
  component: SchedulingPage,
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
]);
