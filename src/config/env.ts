interface ImportMetaEnv {
    readonly VITE_CONVEX_URL: string;
    readonly VITE_CLERK_PUBLISHABLE_KEY: string;
    readonly VITE_CLERK_FRONTEND_API: string;
    // Add other env variables here as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

function validateEnvVar(value: string | undefined, name: string): string {
    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}. Please check your .env file.`
        );
    }
    return value;
}

// @ts-ignore
const CONVEX_URL = validateEnvVar(import.meta.env.VITE_CONVEX_URL, "VITE_CONVEX_URL");

const CLERK_PUBLISHABLE_KEY = validateEnvVar(
    // @ts-ignore
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    "VITE_CLERK_PUBLISHABLE_KEY"
);

const CLERK_FRONTEND_API = validateEnvVar(
    // @ts-ignore
    import.meta.env.VITE_CLERK_FRONTEND_API,
    "VITE_CLERK_FRONTEND_API"
);

export const config = {
    convexUrl: CONVEX_URL,
    clerkPublishableKey: CLERK_PUBLISHABLE_KEY,
    clerkFrontendApi: CLERK_FRONTEND_API,
    isDevelopment: process.env.NODE_ENV === "development",
    // Add other config values here
} as const;

// Type-safe config getter
export function getConfig<T extends keyof typeof config>(key: T): (typeof config)[T] {
    return config[key];
}
