/**
 * Gets the current application version from Electron
 * @returns A promise that resolves to the current application version
 */
export async function getAppVersion(): Promise<string> {
  try {
    if (window.electronWindow && window.electronWindow.getAppVersion) {
      return await window.electronWindow.getAppVersion();
    }
  } catch (error) {
    console.error("Failed to get app version:", error);
  }

  // Fallbacks if Electron API fails or isn't available
  if (process.env.APP_VERSION) {
    return process.env.APP_VERSION;
  }

  if (process.env.npm_package_version) {
    return process.env.npm_package_version;
  }

  return "unknown";
}
