import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";
import posthog from "posthog-js";

import "./localization/i18n";
import { updateAppLanguage } from "./helpers/language_helpers";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/useAuth";
import { getConfig } from "./config/env";
import { VersionChecker } from "@/components/version-checker";
import { getAppVersion } from "./helpers/version";

// Initialize PostHog directly
posthog.init(getConfig("posthogKey"), {
  api_host: getConfig("posthogHost"),
  capture_pageview: false, // Disable automatic page views - we handle this in the router
  bootstrap: {
    isIdentifiedID: true,
  },
  property_blacklist: ["$password", "password", "secret"],
});

// Set initial global properties
posthog.register({
  app_platform: "electron",

  environment: process.env.NODE_ENV || "production",
});

// Fetch the app version asynchronously and update PostHog
(async () => {
  try {
    const appVersion = await getAppVersion();
    console.log(`App Version: ${appVersion}`);

    // Update the global property with the correct version
    posthog.register({ app_version: appVersion });
  } catch (error) {
    console.error("Failed to get app version:", error);
  }
})();

const queryClient = new QueryClient({});

function AuthenticatedApp() {
  const { i18n } = useTranslation();

  useEffect(() => {
    updateAppLanguage(i18n);
  }, [i18n]);

  return <RouterProvider router={router} />;
}

function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Identify user when available
    if (user) {
      posthog.identify(user.id, {
        app_platform: "electron",
      });
    }
  }, [user]);

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
    <App />
  </React.StrictMode>
);
