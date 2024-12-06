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
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
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
    const user = useQuery(api.users.viewer);
    console.log("user", user);
    return (
        <>
            <Unauthenticated>
                <SignInForm />
            </Unauthenticated>
            <Authenticated>
                <AuthenticatedApp />
            </Authenticated>
        </>
    );
}

const root = createRoot(document.getElementById("app")!);
root.render(
    <React.StrictMode>
        <ConvexAuthProvider client={convex}>
            <App />
        </ConvexAuthProvider>
    </React.StrictMode>
);
