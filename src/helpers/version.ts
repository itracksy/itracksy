import { trpcClient } from "@/utils/trpc";

/**
 * Gets the current application version using tRPC
 * @returns A promise that resolves to the current application version
 */
export async function getAppVersion(): Promise<string> {
  try {
    return await trpcClient.utils.getAppVersion.query();
  } catch (error) {
    console.error("Failed to get app version:", error);
  }

  // Fallbacks if tRPC fails or isn't available
  if (process.env.APP_VERSION) {
    return process.env.APP_VERSION;
  }

  if (process.env.npm_package_version) {
    return process.env.npm_package_version;
  }

  return "unknown";
}
