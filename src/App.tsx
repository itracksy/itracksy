import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { syncThemeWithLocal } from "./helpers/theme_helpers";
import { useTranslation } from "react-i18next";
import "./localization/i18n";
import { updateAppLanguage } from "./helpers/language_helpers";
import { router } from "./routes/router";
import { RouterProvider } from "@tanstack/react-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { config } from "./config/env";

const convex = new ConvexReactClient(config.convexUrl);

export default function App() {
    const { i18n } = useTranslation();

    useEffect(() => {
        syncThemeWithLocal();
        updateAppLanguage(i18n);
    }, [i18n]);

    return <RouterProvider router={router} />;
}

const root = createRoot(document.getElementById("app")!);
root.render(
    <React.StrictMode>
        <ConvexProvider client={convex}>
            <App />
        </ConvexProvider>
    </React.StrictMode>
);
