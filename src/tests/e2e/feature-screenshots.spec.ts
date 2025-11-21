import { test, _electron as electron, ElectronApplication, Page } from "@playwright/test";
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers";
import path from "path";
import fs from "fs";

/**
 * Test file for taking comprehensive screenshots of ALL iTracksy pages for landing page
 *
 * This test suite captures screenshots of every major page/feature in the iTracksy app:
 *
 * Core Features:
 * - Activity Tracking (Focus Sessions) - Main productivity tracking interface
 * - Time Analytics Dashboard - Charts, insights, and time analysis
 * - Project Management - Kanban boards and project organization
 * - Activity Classification - Smart activity categorization system
 * - Rule-Based Classification - Custom rules for automatic classification
 *
 * Categorization System:
 * - Categorization Overview - Main categorization interface
 * - Category Management - Create and manage categories
 * - Uncategorized Activities - Activities awaiting categorization
 *
 * Additional Features:
 * - Reports - Detailed reporting and analytics
 * - Music/Focus Enhancement - Focus music and ambient sounds
 * - Scheduling - Time management and scheduling tools
 * - Settings - App configuration and preferences
 *
 * Generated screenshots are used for:
 * - Landing page feature showcases
 * - Documentation and guides
 * - Marketing materials
 * - Product demos
 */

let electronApp: ElectronApplication;
let page: Page;

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(process.cwd(), "screenshots");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe.configure({ mode: "serial" });

const waitForRouterReady = async () => {
  await page.waitForFunction(
    () => Boolean((window as any).__ITRACKSY_ROUTER__),
    undefined,
    { timeout: 20000 }
  );
};

const navigateToRoute = async (route: string) => {
  await waitForRouterReady();
  await page.evaluate(
    async (targetRoute) => {
      const router = (window as any).__ITRACKSY_ROUTER__;
      if (!router) {
        throw new Error("Router instance not available.");
      }
      await router.navigate({ to: targetRoute });
    },
    route
  );
  await page.waitForSelector(`[data-route="${route}"]`, { timeout: 20000 });
  await page.waitForTimeout(1500);
};

const captureRouteScreenshot = async (route: string, filename: string) => {
  await navigateToRoute(route);
  await page.screenshot({
    path: path.join(screenshotsDir, filename),
    fullPage: true,
  });
};

test.beforeAll(async () => {
  // Try to find latest build, fallback to dev build
  let latestBuild;
  let appInfo;

  try {
    latestBuild = findLatestBuild();
    appInfo = parseElectronApp(latestBuild);
  } catch (error) {
    console.log("No packaged build found, using development build");
    // Use development build files
    latestBuild = ".vite/build/main.js";
    appInfo = { main: latestBuild };
  }

  // Set environment variables for testing
  process.env.CI = "e2e";
  // Force development mode for database path
  process.env.NODE_ENV = "development";

  electronApp = await electron.launch({
    args: [appInfo.main],
    env: {
      ...process.env,
      // Force development mode to use local.db at root
      NODE_ENV: "development",
      // Prevent database reset
      PRESERVE_DB: "true",
    },
  });

  // Setup event handlers for debugging
  electronApp.on("window", async (page) => {
    const filename = page.url()?.split("/").pop();
    console.log(`Window opened: ${filename}`);

    page.on("pageerror", (error) => {
      console.error(error);
    });
    page.on("console", (msg) => {
      console.log(msg.text());
    });
  });

  // Get the first window
  page = await electronApp.firstWindow();

  // Manually inject a user ID to bypass authentication
  // This should work because the app uses localStorage for anonymous authentication
  await page.evaluate(() => {
    // Create a random user ID
    const userId = Math.random().toString(36).substring(2, 15);
    // Set it in localStorage - mimicking what the app would do
    localStorage.setItem("user.currentUserId", userId);
    console.log("Manually set userId in localStorage:", userId);

    // Force refresh to make the app use the new user ID
    window.location.reload();
  });

  // Wait for the app to fully load
  await page.waitForLoadState("networkidle");
  await waitForRouterReady();
  // Extra wait for sidebar to be fully rendered
  await page.waitForTimeout(2000);
});

test.afterAll(async () => {
  await electronApp.close();
});

test("Screenshot Activity Tracking feature", async () => {
  await captureRouteScreenshot("/", "activity-tracking.png");
});

test("Screenshot Time Analytics Dashboard", async () => {
  await captureRouteScreenshot("/dashboard", "time-analytics.png");
});

test("Screenshot Project Management feature", async () => {
  await captureRouteScreenshot("/projects", "project-management.png");
});

test("Screenshot Activity Classification feature", async () => {
  await captureRouteScreenshot("/classify", "activity-classification.png");
});

test("Screenshot Rule-Based Classification feature", async () => {
  await captureRouteScreenshot("/rule-book", "rule-classification.png");
});

test("Screenshot Categorization Overview", async () => {
  await captureRouteScreenshot("/categorization", "categorization-overview.png");
});

test("Screenshot Category Management", async () => {
  await captureRouteScreenshot("/categorization/manage", "category-management.png");
});

test("Screenshot Uncategorized Activities", async () => {
  await captureRouteScreenshot("/categorization/uncategorized", "uncategorized-activities.png");
});

test("Screenshot Reports Page", async () => {
  await captureRouteScreenshot("/reports", "reports.png");
});

test("Screenshot Music/Focus Enhancement Page", async () => {
  await captureRouteScreenshot("/music", "music-focus.png");
});

test("Screenshot Scheduling Page", async () => {
  await captureRouteScreenshot("/scheduling", "scheduling.png");
});

test("Screenshot Settings Page", async () => {
  await captureRouteScreenshot("/settings", "settings.png");
});
