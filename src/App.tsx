import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";
import { PostHogProvider } from "posthog-js/react";

import "./localization/i18n";
import { updateAppLanguage } from "./helpers/language_helpers";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/useAuth";
import { getConfig } from "./config/env";
import { VersionChecker } from "@/components/version-checker"; // Import the VersionChecker component

const queryClient = new QueryClient({});

// PostHog configuration
const posthogOptions = {
  api_host: getConfig("posthogHost"),
  capture_pageview: true,
};

function AuthenticatedApp() {
  const { i18n } = useTranslation();

  useEffect(() => {
    updateAppLanguage(i18n);
  }, [i18n]);

  return <RouterProvider router={router} />;
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Please sign in to continue</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthenticatedApp />
        <VersionChecker autoCheck={true} showCheckButton={false} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <PostHogProvider apiKey={getConfig("posthogKey")} options={posthogOptions}>
      <App />
    </PostHogProvider>
  </React.StrictMode>
);
