import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { syncThemeWithLocal } from "./helpers/theme_helpers";
import { useTranslation } from "react-i18next";
import "./localization/i18n";
import { updateAppLanguage } from "./helpers/language_helpers";
import { router } from "./routes/router";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "./context/UserContext";
import { supabase } from "./services/supabaseClient";
import { useTracking } from "./hooks/useTracking";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function AuthenticatedApp() {
  const { i18n } = useTranslation();

  const { isTracking, startTracking } = useTracking();
  const hasSynced = useRef(false);

  useEffect(() => {
    syncThemeWithLocal();
    updateAppLanguage(i18n);
  }, [i18n]);

  useEffect(() => {
    if (!hasSynced.current) {
      window.electronWindow.getActivities().then((activities) => {
        // Removed syncActivitiesMutation as it's not defined in the updated code
        hasSynced.current = true;
        window.electronWindow.clearActivities();
        if (isTracking) {
          startTracking();
        }
      });
    }
  }, []);

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <AuthenticatedApp />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
