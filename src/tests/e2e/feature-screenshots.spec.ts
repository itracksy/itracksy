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
  // Extra wait for sidebar to be fully rendered
  await page.waitForTimeout(2000);
});

test.afterAll(async () => {
  await electronApp.close();
});

test("Screenshot Activity Tracking feature", async () => {
  // Navigate to Activity Tracking page (Focus Session)
  await page.locator('a[href="/"]').click();
  await page.waitForLoadState("networkidle");

  // Allow time for data to load and animations to complete
  await page.waitForTimeout(1500);

  // Take screenshot of the Activity Tracking view
  await page.screenshot({
    path: path.join(screenshotsDir, "activity-tracking.png"),
    fullPage: true,
  });
});

test("Screenshot Time Analytics Dashboard", async () => {
  // Navigate to Time Analytics page using the link href
  await page.locator('a[href="/dashboard"]').click();
  await page.waitForLoadState("networkidle");

  // Make sure charts and data are fully loaded
  await page.waitForTimeout(2000);

  // Take screenshot of the Time Analytics view
  await page.screenshot({
    path: path.join(screenshotsDir, "time-analytics.png"),
    fullPage: true,
  });
});

test("Screenshot Project Management feature", async () => {
  // Navigate to Projects/Kanban page using the link href
  await page.locator('a[href="/projects"]').click();
  await page.waitForLoadState("networkidle");

  // Make sure boards are fully loaded
  await page.waitForTimeout(1500);

  // Take screenshot of the Project Management view
  await page.screenshot({
    path: path.join(screenshotsDir, "project-management.png"),
    fullPage: true,
  });
});

test("Screenshot Activity Classification feature", async () => {
  // Navigate to Activity Classification page using the link href
  await page.locator('a[href="/classify"]').click();
  await page.waitForLoadState("networkidle");

  // Make sure classification data is fully loaded
  await page.waitForTimeout(1500);

  // Take screenshot of the Activity Classification view
  await page.screenshot({
    path: path.join(screenshotsDir, "activity-classification.png"),
    fullPage: true,
  });
});

test("Screenshot Rule-Based Classification feature", async () => {
  // Navigate to Rule Book page using the link href
  await page.locator('a[href="/rule-book"]').click();
  await page.waitForLoadState("networkidle");

  // Make sure rule data is fully loaded
  await page.waitForTimeout(1500);

  // Take screenshot of the Rule-Based Classification view
  await page.screenshot({
    path: path.join(screenshotsDir, "rule-classification.png"),
    fullPage: true,
  });
});

test("Screenshot Categorization Overview", async () => {
  // Navigate to Categorization main page
  await page.locator('a[href="/categorization"]').click();
  await page.waitForLoadState("networkidle");

  // Wait for categories to load
  await page.waitForTimeout(1500);

  // Take screenshot of the Categorization view
  await page.screenshot({
    path: path.join(screenshotsDir, "categorization-overview.png"),
    fullPage: true,
  });
});

test("Screenshot Category Management", async () => {
  // Navigate to Category Management page
  await page.goto("/#/categorization/manage");
  await page.waitForLoadState("networkidle");

  // Wait for category management interface to load
  await page.waitForTimeout(1500);

  // Take screenshot of the Category Management view
  await page.screenshot({
    path: path.join(screenshotsDir, "category-management.png"),
    fullPage: true,
  });
});

test("Screenshot Uncategorized Activities", async () => {
  // Navigate to Uncategorized Activities page
  await page.goto("/#/categorization/uncategorized");
  await page.waitForLoadState("networkidle");

  // Wait for uncategorized activities to load
  await page.waitForTimeout(1500);

  // Take screenshot of the Uncategorized Activities view
  await page.screenshot({
    path: path.join(screenshotsDir, "uncategorized-activities.png"),
    fullPage: true,
  });
});

test("Screenshot Reports Page", async () => {
  // Navigate to Reports page
  await page.locator('a[href="/reports"]').click();
  await page.waitForLoadState("networkidle");

  // Wait for reports to load
  await page.waitForTimeout(2000);

  // Take screenshot of the Reports view
  await page.screenshot({
    path: path.join(screenshotsDir, "reports.png"),
    fullPage: true,
  });
});

test("Screenshot Music/Focus Enhancement Page", async () => {
  // Navigate to Music page
  await page.locator('a[href="/music"]').click();
  await page.waitForLoadState("networkidle");

  // Wait for music interface to load
  await page.waitForTimeout(1500);

  // Take screenshot of the Music view
  await page.screenshot({
    path: path.join(screenshotsDir, "music-focus.png"),
    fullPage: true,
  });
});

test("Screenshot Scheduling Page", async () => {
  // Navigate to Scheduling page
  await page.locator('a[href="/scheduling"]').click();
  await page.waitForLoadState("networkidle");

  // Wait for scheduling interface to load
  await page.waitForTimeout(1500);

  // Take screenshot of the Scheduling view
  await page.screenshot({
    path: path.join(screenshotsDir, "scheduling.png"),
    fullPage: true,
  });
});

test("Screenshot Settings Page", async () => {
  // Navigate to Settings page
  await page.locator('a[href="/settings"]').click();
  await page.waitForLoadState("networkidle");

  // Wait for settings to load
  await page.waitForTimeout(1500);

  // Take screenshot of the Settings view
  await page.screenshot({
    path: path.join(screenshotsDir, "settings.png"),
    fullPage: true,
  });
});
