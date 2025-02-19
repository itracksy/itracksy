import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";

import "./localization/i18n";
import { updateAppLanguage } from "./helpers/language_helpers";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/useAuth";

import { useTracking } from "./hooks/useTracking";
import { supabase } from "./lib/supabase";
import { trpcClient } from "./utils/trpc";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error("[Query]", error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error("[Mutation]", error);
    },
  }),
});

function AuthenticatedApp() {
  const { i18n } = useTranslation();
  const hasSynced = useRef(false);
  const { isTracking, startTracking } = useTracking();

  useEffect(() => {
    updateAppLanguage(i18n);
  }, [i18n]);

  useEffect(() => {
    if (!hasSynced.current && isTracking) {
      hasSynced.current = true;

      startTracking();
    }
  }, [isTracking, startTracking]);

  return <RouterProvider router={router} />;
}

function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    async function signInAnonymously() {
      if (!loading && !user) {
        const { data, error } = await supabase.auth.signInAnonymously();

        if (data.user?.id) {
          trpcClient.user.setCurrrentUserId.mutate(data.user?.id);
        }
        if (error) {
          console.error("Error signing in anonymously:", error.message);
        }
      }
    }
    signInAnonymously();
  }, [user, loading]);

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
