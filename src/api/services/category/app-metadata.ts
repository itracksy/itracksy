/**
 * macOS App Metadata Service
 *
 * Extracts LSApplicationCategoryType and other metadata from macOS app bundles
 * to enable automatic categorization without user configuration.
 *
 * This implements "Tier 1: Deterministic Layer" from the classification waterfall,
 * using native macOS metadata that developers declare in their Info.plist.
 */

import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { logger } from "@/helpers/logger";

/**
 * Apple's standardized app categories from the Mac App Store
 * @see https://developer.apple.com/documentation/bundleresources/information_property_list/lsapplicationcategorytype
 */
export const APPLE_CATEGORY_TYPES = {
  // Business & Productivity
  "public.app-category.business": "Work",
  "public.app-category.productivity": "Work",
  "public.app-category.finance": "Work",

  // Development
  "public.app-category.developer-tools": "Development",

  // Design & Graphics
  "public.app-category.graphics-design": "Design",
  "public.app-category.photography": "Design",
  "public.app-category.video": "Design",

  // Communication
  "public.app-category.social-networking": "Communication",

  // Entertainment & Media
  "public.app-category.entertainment": "Entertainment",
  "public.app-category.games": "Entertainment",
  "public.app-category.music": "Entertainment",
  "public.app-category.action-games": "Entertainment",
  "public.app-category.adventure-games": "Entertainment",
  "public.app-category.arcade-games": "Entertainment",
  "public.app-category.board-games": "Entertainment",
  "public.app-category.card-games": "Entertainment",
  "public.app-category.casino-games": "Entertainment",
  "public.app-category.dice-games": "Entertainment",
  "public.app-category.educational-games": "Learning",
  "public.app-category.family-games": "Entertainment",
  "public.app-category.kids-games": "Entertainment",
  "public.app-category.music-games": "Entertainment",
  "public.app-category.puzzle-games": "Entertainment",
  "public.app-category.racing-games": "Entertainment",
  "public.app-category.role-playing-games": "Entertainment",
  "public.app-category.simulation-games": "Entertainment",
  "public.app-category.sports-games": "Entertainment",
  "public.app-category.strategy-games": "Entertainment",
  "public.app-category.trivia-games": "Entertainment",
  "public.app-category.word-games": "Entertainment",

  // Education & Reference
  "public.app-category.education": "Learning",
  "public.app-category.reference": "Learning",
  "public.app-category.books": "Learning",

  // Lifestyle & Personal
  "public.app-category.lifestyle": "Personal",
  "public.app-category.healthcare-fitness": "Personal",
  "public.app-category.medical": "Personal",
  "public.app-category.food-drink": "Personal",
  "public.app-category.travel": "Personal",
  "public.app-category.sports": "Personal",
  "public.app-category.shopping": "Personal",

  // News & Information
  "public.app-category.news": "Personal",
  "public.app-category.magazines-newspapers": "Personal",
  "public.app-category.weather": "Utilities",

  // Utilities & System
  "public.app-category.utilities": "Utilities",
  "public.app-category.navigation": "Utilities",
} as const;

/**
 * Well-known vendor bundle ID prefixes mapped to categories
 * Fallback when LSApplicationCategoryType is not available
 */
export const VENDOR_CATEGORY_MAP: Record<string, string> = {
  // Development vendors
  "com.apple.dt": "Development", // Xcode tools
  "com.jetbrains": "Development",
  "com.microsoft.VSCode": "Development",
  "com.visualstudio": "Development",
  "com.github": "Development",
  "com.docker": "Development",
  "dev.warp": "Development",
  "io.alacritty": "Development",
  "com.googlecode.iterm2": "Development",
  "com.mitchellh.ghostty": "Development",

  // Design vendors
  "com.adobe": "Design",
  "com.figma": "Design",
  "com.bohemiancoding.sketch": "Design",
  "com.canva": "Design",
  "com.pixelmator": "Design",

  // Communication vendors
  "com.slack": "Communication",
  "com.tinyspeck.slackmacgap": "Communication",
  "com.microsoft.teams": "Communication",
  "us.zoom": "Communication",
  "com.discord": "Communication",
  "com.apple.mail": "Communication",
  "com.readdle.smartemail": "Communication",

  // Entertainment vendors
  "com.spotify": "Entertainment",
  "com.apple.Music": "Entertainment",
  "com.netflix": "Entertainment",
  "tv.twitch": "Entertainment",
  "com.valvesoftware.steam": "Entertainment",

  // Social vendors
  "com.twitter": "Social",
  "com.facebook": "Social",
  "com.burbn.instagram": "Social",
  "com.linkedin": "Social",

  // Productivity/Office vendors
  "com.microsoft.Word": "Work",
  "com.microsoft.Excel": "Work",
  "com.microsoft.Powerpoint": "Work",
  "com.microsoft.Outlook": "Communication",
  "com.apple.iWork": "Work",
  "md.obsidian": "Work",
  "com.notion": "Work",

  // Browsers (neutral - content determines category)
  "com.google.Chrome": "Utilities",
  "com.apple.Safari": "Utilities",
  "org.mozilla.firefox": "Utilities",
  "com.brave.Browser": "Utilities",
  "com.microsoft.edgemac": "Utilities",
  "company.thebrowser.Browser": "Utilities", // Arc

  // System utilities
  "com.apple": "Utilities", // Generic Apple apps fallback
};

export interface AppMetadata {
  bundleId: string;
  appName: string;
  appPath: string | null;
  appleCategory: string | null;
  suggestedCategory: string | null;
  confidence: number; // 0-1, how confident we are in the suggestion
  source: "lsappcategory" | "vendor" | "unknown";
}

/**
 * Extract metadata from a macOS app bundle
 */
export function getAppMetadata(bundleIdOrPath: string, appName?: string): AppMetadata | null {
  if (process.platform !== "darwin") {
    return null;
  }

  try {
    let appPath: string | null = null;
    let bundleId: string = bundleIdOrPath;

    // Helper to safely extract string from plist data
    const getString = (value: unknown): string | null => {
      return typeof value === "string" ? value : null;
    };

    // If it looks like a path, use it directly
    if (bundleIdOrPath.startsWith("/") || bundleIdOrPath.includes(".app")) {
      appPath = bundleIdOrPath;
      // Try to extract bundle ID from the path
      const infoPlistPath = path.join(appPath, "Contents", "Info.plist");
      if (fs.existsSync(infoPlistPath)) {
        const plistData = readPlist(infoPlistPath);
        bundleId = getString(plistData?.CFBundleIdentifier) || bundleIdOrPath;
      }
    } else {
      // It's a bundle ID, find the app path
      appPath = findAppPathByBundleId(bundleIdOrPath);
    }

    // Read the Info.plist if we have a path
    let appleCategory: string | null = null;
    let resolvedAppName = appName || "";

    if (appPath) {
      const infoPlistPath = path.join(appPath, "Contents", "Info.plist");
      if (fs.existsSync(infoPlistPath)) {
        const plistData = readPlist(infoPlistPath);
        appleCategory = getString(plistData?.LSApplicationCategoryType);
        resolvedAppName =
          resolvedAppName ||
          getString(plistData?.CFBundleDisplayName) ||
          getString(plistData?.CFBundleName) ||
          path.basename(appPath, ".app");
        bundleId = getString(plistData?.CFBundleIdentifier) || bundleId;
      }
    }

    // Determine suggested category
    let suggestedCategory: string | null = null;
    let confidence = 0;
    let source: AppMetadata["source"] = "unknown";

    // Tier 1: Use Apple's LSApplicationCategoryType (highest confidence)
    if (appleCategory && APPLE_CATEGORY_TYPES[appleCategory as keyof typeof APPLE_CATEGORY_TYPES]) {
      suggestedCategory = APPLE_CATEGORY_TYPES[appleCategory as keyof typeof APPLE_CATEGORY_TYPES];
      confidence = 0.95;
      source = "lsappcategory";
    }

    // Tier 2: Use vendor prefix matching (medium confidence)
    if (!suggestedCategory && bundleId) {
      for (const [prefix, category] of Object.entries(VENDOR_CATEGORY_MAP)) {
        if (bundleId.startsWith(prefix) || bundleId === prefix) {
          suggestedCategory = category;
          confidence = 0.85;
          source = "vendor";
          break;
        }
      }
    }

    return {
      bundleId,
      appName: resolvedAppName,
      appPath,
      appleCategory,
      suggestedCategory,
      confidence,
      source,
    };
  } catch (error) {
    logger.error("Failed to get app metadata:", error);
    return null;
  }
}

/**
 * Read a plist file and return its contents as JSON
 */
function readPlist(plistPath: string): Record<string, unknown> | null {
  try {
    // Use plutil to convert plist to JSON (works with both binary and XML plists)
    const jsonOutput = execSync(`plutil -convert json -o - "${plistPath}"`, {
      encoding: "utf-8",
      timeout: 5000,
    });
    return JSON.parse(jsonOutput);
  } catch (error) {
    logger.debug(`Failed to read plist at ${plistPath}:`, error);
    return null;
  }
}

/**
 * Find the app path for a given bundle ID using mdfind (Spotlight)
 */
function findAppPathByBundleId(bundleId: string): string | null {
  try {
    // Use mdfind to search Spotlight index for the app
    const result = execSync(
      `mdfind "kMDItemCFBundleIdentifier == '${bundleId}'" 2>/dev/null | head -1`,
      {
        encoding: "utf-8",
        timeout: 5000,
      }
    ).trim();

    if (result && fs.existsSync(result)) {
      return result;
    }

    // Fallback: Check common locations
    const commonPaths = [
      `/Applications`,
      `/System/Applications`,
      `/System/Applications/Utilities`,
      `${process.env.HOME}/Applications`,
    ];

    for (const basePath of commonPaths) {
      try {
        const apps = fs.readdirSync(basePath);
        for (const app of apps) {
          if (app.endsWith(".app")) {
            const appPath = path.join(basePath, app);
            const infoPlistPath = path.join(appPath, "Contents", "Info.plist");
            if (fs.existsSync(infoPlistPath)) {
              const plistData = readPlist(infoPlistPath);
              if (plistData?.CFBundleIdentifier === bundleId) {
                return appPath;
              }
            }
          }
        }
      } catch {
        // Directory doesn't exist or can't be read
      }
    }

    return null;
  } catch (error) {
    logger.debug(`Failed to find app path for ${bundleId}:`, error);
    return null;
  }
}

/**
 * Scan all installed applications and return their metadata
 * Used for initial app categorization on first run
 */
export function scanInstalledApps(): AppMetadata[] {
  if (process.platform !== "darwin") {
    return [];
  }

  const apps: AppMetadata[] = [];
  const scannedBundleIds = new Set<string>();

  const appDirs = [
    "/Applications",
    "/System/Applications",
    "/System/Applications/Utilities",
    `${process.env.HOME}/Applications`,
  ];

  for (const dir of appDirs) {
    try {
      if (!fs.existsSync(dir)) continue;

      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (!entry.endsWith(".app")) continue;

        const appPath = path.join(dir, entry);
        const metadata = getAppMetadata(appPath);

        if (metadata && metadata.bundleId && !scannedBundleIds.has(metadata.bundleId)) {
          scannedBundleIds.add(metadata.bundleId);
          apps.push(metadata);
        }
      }
    } catch (error) {
      logger.debug(`Failed to scan directory ${dir}:`, error);
    }
  }

  logger.info(`Scanned ${apps.length} applications for metadata`);

  // Log categorization stats
  const categorized = apps.filter((a) => a.suggestedCategory);
  const bySource = {
    lsappcategory: apps.filter((a) => a.source === "lsappcategory").length,
    vendor: apps.filter((a) => a.source === "vendor").length,
    unknown: apps.filter((a) => a.source === "unknown").length,
  };

  logger.info(
    `Auto-categorization potential: ${categorized.length}/${apps.length} apps ` +
      `(${bySource.lsappcategory} by Apple category, ${bySource.vendor} by vendor)`
  );

  return apps;
}

/**
 * Get category suggestion for an activity based on app metadata
 * This is called during activity tracking to suggest categories
 */
export function suggestCategoryForActivity(
  bundleId: string | null,
  appName: string,
  appPath?: string | null
): { category: string; confidence: number; source: string } | null {
  if (!bundleId && !appPath) {
    return null;
  }

  const metadata = getAppMetadata(bundleId || appPath || "", appName);

  if (metadata?.suggestedCategory) {
    return {
      category: metadata.suggestedCategory,
      confidence: metadata.confidence,
      source: metadata.source,
    };
  }

  return null;
}

/**
 * Get all apps that can be auto-categorized with their suggestions
 * Used for the "Quick Setup" UI
 */
export function getAutoCategorizeablApps(): Array<{
  bundleId: string;
  appName: string;
  suggestedCategory: string;
  confidence: number;
  source: string;
}> {
  const allApps = scanInstalledApps();

  return allApps
    .filter((app) => app.suggestedCategory !== null)
    .map((app) => ({
      bundleId: app.bundleId,
      appName: app.appName,
      suggestedCategory: app.suggestedCategory!,
      confidence: app.confidence,
      source: app.source,
    }))
    .sort((a, b) => b.confidence - a.confidence);
}
