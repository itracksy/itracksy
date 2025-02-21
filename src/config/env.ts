interface ImportMetaEnv {
  // Add other env variables here as needed
  VITE_SUPABASE_URL: string | undefined;
  VITE_SUPABASE_KEY: string | undefined;
  VITE_AXIOM_TOKEN: string | undefined;
  VITE_AXIOM_ORG_ID: string | undefined;
  VITE_AXIOM_DATASET: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

function validateEnvVar(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  // Remove any surrounding quotes that might be present
  value = value.replace(/^['"](.*)['"]$/, "$1");
  if (name.includes("URL")) {
    try {
      new URL(value); // Validate URL format
    } catch (e) {
      throw new Error(`Invalid URL in environment variable ${name}: ${value}`);
    }
  }
  return value;
}

export const config = {
  // @ts-ignore
  supabaseUrl: validateEnvVar(import.meta.env.VITE_SUPABASE_URL, "VITE_SUPABASE_URL"),
  // @ts-ignore
  supabaseKey: validateEnvVar(import.meta.env.VITE_SUPABASE_KEY, "VITE_SUPABASE_KEY"),
  // @ts-ignore
  axiomToken: validateEnvVar(import.meta.env.VITE_AXIOM_TOKEN, "VITE_AXIOM_TOKEN"),
  // @ts-ignore
  axiomOrgId: validateEnvVar(import.meta.env.VITE_AXIOM_ORG_ID, "VITE_AXIOM_ORG_ID"),
  // @ts-ignore
  axiomDataset: validateEnvVar(import.meta.env.VITE_AXIOM_DATASET, "VITE_AXIOM_DATASET"),
} as const;

// Type-safe config getter
export function getConfig<T extends keyof typeof config>(key: T): (typeof config)[T] {
  return config[key];
}
