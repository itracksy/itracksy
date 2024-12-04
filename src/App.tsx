import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { syncThemeWithLocal } from "./helpers/theme_helpers";
import { useTranslation } from "react-i18next";
import "./localization/i18n";
import { updateAppLanguage } from "./helpers/language_helpers";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";
import { config } from "./config/env";
import { ClerkProvider, useAuth, SignIn } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Authenticated, Unauthenticated } from "convex/react";

const convex = new ConvexReactClient(config.convexUrl);

function AuthenticatedApp() {
    const { i18n } = useTranslation();

    useEffect(() => {
        syncThemeWithLocal();
        updateAppLanguage(i18n);
    }, [i18n]);

    return <RouterProvider router={router} />;
}

export default function App() {
    return (
        <>
            <AuthenticatedApp />
        </>
    );
}

const root = createRoot(document.getElementById("app")!);
root.render(
    <React.StrictMode>
        <ClerkProvider publishableKey={config.clerkPublishableKey}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <App />
            </ConvexProviderWithClerk>
        </ClerkProvider>
    </React.StrictMode>
);
