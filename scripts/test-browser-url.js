#!/usr/bin/env node

/**
 * Test script to verify browser URL access with get-windows library
 * This script tests the Apple Events permissions and browser URL retrieval
 */

import path from "path";

async function testBrowserUrlAccess() {
  console.log("🧪 Testing browser URL access with get-windows...\n");

  try {
    // Import get-windows library (ES module)
    const getWindows = await import("get-windows");

    console.log("✅ Successfully imported get-windows library");

    // Test getting all windows
    console.log("\n📋 Getting all windows...");
    const windows = await getWindows.default();
    console.log(`Found ${windows.length} windows`);

    // Filter browser windows
    const browserWindows = windows.filter((window) => {
      const appName = window.owner.name.toLowerCase();
      return (
        appName.includes("chrome") ||
        appName.includes("safari") ||
        appName.includes("firefox") ||
        appName.includes("edge")
      );
    });

    console.log(`Found ${browserWindows.length} browser windows`);

    // Test getting active window with URL
    console.log("\n🎯 Getting active window with URL...");
    const activeWindow = await getWindows.activeWindow({
      accessibilityPermission: true,
      screenRecordingPermission: true,
    });

    if (activeWindow) {
      console.log("✅ Active window retrieved successfully");
      console.log(`App: ${activeWindow.owner.name}`);
      console.log(`Title: ${activeWindow.title}`);
      console.log(`Platform: ${activeWindow.platform}`);

      if (activeWindow.url) {
        console.log(`🌐 URL: ${activeWindow.url}`);
        console.log("✅ SUCCESS: Browser URL access is working!");
      } else {
        console.log("⚠️  URL field is empty - this indicates permission issues");
        console.log("   The app might need to be properly signed and have Apple Events permission");
      }
    } else {
      console.log("❌ No active window found");
    }

    // Show browser windows with URLs if available
    if (browserWindows.length > 0) {
      console.log("\n🌐 Browser windows found:");
      browserWindows.forEach((window, index) => {
        console.log(`${index + 1}. ${window.owner.name}: ${window.title}`);
        if (window.url) {
          console.log(`   URL: ${window.url}`);
        } else {
          console.log("   URL: (not available - may need Apple Events permission)");
        }
      });
    }
  } catch (error) {
    console.error("❌ Error testing browser URL access:", error);
    console.log("\n💡 Troubleshooting tips:");
    console.log("1. Make sure the app is properly signed with Apple Events entitlement");
    console.log("2. Check that NSAppleEventsUsageDescription is in Info.plist");
    console.log("3. Verify the user has granted Apple Events permission");
    console.log("4. Try running from a signed .app bundle, not directly from terminal");
  }
}

// Run the test
testBrowserUrlAccess().catch(console.error);
