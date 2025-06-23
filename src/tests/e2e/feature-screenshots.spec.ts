import { test, _electron as electron, ElectronApplication, Page } from "@playwright/test";
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers";
import path from "path";
import fs from "fs";

/**
 * Test file for taking screenshots of main iTracksy features for landing page
 */

let electronApp: ElectronApplication;
let page: Page;

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(process.cwd(), "screenshots");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.beforeAll(async () => {
  const latestBuild = findLatestBuild();
  const appInfo = parseElectronApp(latestBuild);

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

test("Screenshot Time Analytics feature", async () => {
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
