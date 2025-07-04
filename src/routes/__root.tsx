import { useToast } from "@/hooks/use-toast";
import BaseLayout from "@/layouts/BaseLayout";
import { Outlet, createRootRoute, useMatches } from "@tanstack/react-router";
import { ConfirmationDialogProvider } from "@/components/providers/ConfirmationDialog";
import { analytics } from "@/helpers/analytics";

export const RootRoute = createRootRoute({
  component: Root,
  beforeLoad: ({ location }) => {
    // Track page view using the safer analytics helper
    analytics.pageView(location.pathname, {
      params: location.search ? Object.fromEntries(new URLSearchParams(location.search)) : {},
    });
  },
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    const err = error as Error;
    console.error("[errorComponent]", err);

    // Track error events using the safer analytics helper
    analytics.track("navigation_error", {
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
