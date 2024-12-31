interface ImportMetaEnv {
  // Add other env variables here as needed
  VITE_SUPABASE_URL: string | undefined;
  VITE_SUPABASE_KEY: string | undefined;
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

export const config = {
  supabaseUrl: validateEnvVar(import.meta.env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL"),
  supabaseKey: validateEnvVar(import.meta.env.VITE_SUPABASE_KEY, "VITE_SUPABASE_KEY"),
} as const;
console.log(config.supabaseUrl);
console.log(config.supabaseKey);
// Type-safe config getter
export function getConfig<T extends keyof typeof config>(key: T): (typeof config)[T] {
  return config[key];
}
