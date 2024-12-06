interface ImportMetaEnv {
  readonly VITE_CONVEX_URL: string;
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

function validateEnvVar(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Please check your .env file.`);
  }
  return value;
}

// @ts-ignore
const CONVEX_URL = validateEnvVar(import.meta.env.VITE_CONVEX_URL, "VITE_CONVEX_URL");

export const config = {
  convexUrl: CONVEX_URL,
  isDevelopment: process.env.NODE_ENV === "development",
  // Add other config values here
} as const;

// Type-safe config getter
export function getConfig<T extends keyof typeof config>(key: T): (typeof config)[T] {
  return config[key];
}
