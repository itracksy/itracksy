import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";
import posthog from "posthog-js";

// Import global CSS for Tailwind
import "./styles/global.css";

import "./localization/i18n";
import { updateAppLanguage } from "./helpers/language_helpers";
import { syncThemeWithLocal } from "./helpers/theme_helpers";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/useAuth";
import { getConfig } from "./config/env";
import { useAppearancePreferences } from "./hooks/useAppearancePreferences";
import { VersionChecker } from "./components/version-checker/version-checker";

import { getAppVersion } from "./helpers/version";

if (typeof window !== "undefined") {
  window.__ITRACKSY_ROUTER__ = router;
}

// Initialize PostHog with enhanced CSP compatibility
posthog.init(getConfig("posthogKey"), {
  api_host: getConfig("posthogHost"),
  capture_pageview: false, // Disable automatic page views - we handle this in the router
  bootstrap: {
    isIdentifiedID: true,
  },
  property_blacklist: ["$password", "password", "secret"],
  // Disable features that might cause CSP issues
  disable_session_recording: true,

  disable_surveys: true, // Explicitly disable surveys
  autocapture: false,
  capture_pageleave: false,
  debug: process.env.NODE_ENV === "development",
  loaded: (ph) => {
    // Disable additional features that might attempt to inject scripts
    if (ph.config) {
      ph.config.disable_session_recording = true;

      ph.config.disable_surveys = true; // Explicitly disable surveys in config
      ph.config.autocapture = false;
    }
  },
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

// Initialize theme based on saved preference
syncThemeWithLocal().catch(console.error);

function AuthenticatedApp() {
  const { i18n } = useTranslation();

  // Apply appearance preferences (font, layout, animations)
  useAppearancePreferences();

  useEffect(() => {
    updateAppLanguage(i18n);
  }, [i18n]);

  // Listen for navigation events from main process (e.g., from blocking notification)
  useEffect(() => {
    if (window.electronNavigation) {
      const cleanup = window.electronNavigation.onNavigateTo((route: string) => {
        // Parse the route to extract path and search params
        const url = new URL(route, "http://localhost");
        const path = url.pathname;
        const searchParams: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
          searchParams[key] = value;
        });

        // Navigate with properly separated path and search params
        router.navigate({
          to: path,
          search: Object.keys(searchParams).length > 0 ? searchParams : undefined,
        });
      });
      return cleanup;
    }
  }, []);

  return (
    <>
      <VersionChecker autoCheck={true} cacheDuration={60 * 60 * 1000} />
      <RouterProvider router={router} />
    </>
  );
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
