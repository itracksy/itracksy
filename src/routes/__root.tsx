import { useToast } from "@/hooks/use-toast";
import BaseLayout from "@/layouts/BaseLayout";
import { Outlet, createRootRoute, useMatches } from "@tanstack/react-router";
import { ConfirmationDialogProvider } from "@/components/providers/ConfirmationDialog";
import posthog from "posthog-js";

export const RootRoute = createRootRoute({
  component: Root,
  beforeLoad: ({ location }) => {
    // Track page view before the route loads
    posthog.capture("$pageview", {
      $current_url: location.pathname,
      view_name: location.pathname.split("/").pop() || "home",
      params: location.search ? Object.fromEntries(new URLSearchParams(location.search)) : {},
    });
  },
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    const err = error as Error;
    console.log("show toast", err);

    // Track error events in PostHog
    posthog.capture("navigation_error", {
      error_message: err.message,
      path: window.location.pathname,
    });

    toast({
      variant: "destructive",
      title: "Error",
      description: err.message,
    });
    return <Root />;
  },
});

function Root() {
  const matches = useMatches();
  const isFullScreenRoute = matches.some((match) => match.pathname === "/raining-letters");

  return (
    <ConfirmationDialogProvider>
      {isFullScreenRoute ? (
        <Outlet />
      ) : (
        <BaseLayout>
          <Outlet />
        </BaseLayout>
      )}
    </ConfirmationDialogProvider>
  );
}
