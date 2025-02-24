import { createRoute } from "@tanstack/react-router";
import { RootRoute } from "./__root";
import DashboardPage from "@/pages/dashboard/index";
import FocusPage from "@/pages/focus/index";
import { ProjectsPage } from "@/pages/projects/page";
import SettingsPage from "@/pages/settings-page/SettingsPage";
import RainingLetters from "@/pages/rainning-letter/index";
import FullScreenLayout from "@/layouts/FullScreenLayout";

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

export const rootTree = RootRoute.addChildren([
  FocusRoute,
  DashboardRoute,
  ProjectsRoute,
  SettingsRoute,
  RainingLettersRoute,
]);
