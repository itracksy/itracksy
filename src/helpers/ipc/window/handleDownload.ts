import { buildAppLinks } from "@/config/app-links";

// Export a function to get platform-specific download URL without triggering download
export const getPlatformDownloadUrl = (version: string): string => {
  const customAppLinks = buildAppLinks(version);
  // Use Electron's process.platform for platform detection
  switch (process.platform) {
    case "win32":
      return customAppLinks.windows;
    case "darwin":
      // For macOS, check if running on ARM
      return process.arch === "arm64"
        ? customAppLinks.macos
        : customAppLinks.macosIntel || customAppLinks.macos;
    case "linux":
      return customAppLinks.linux;
    default:
      return customAppLinks.releases;
  }
};
