#!/usr/bin/env node

/**
 * macOS Permission Test Script
 *
 * This script helps test if the required macOS permissions are properly configured
 * for iTracksy to access browser URLs using the get-windows library.
 *
 * Run this script to verify:
 * 1. Accessibility permission status
 * 2. Screen Recording permission status
 * 3. get-windows library functionality
 */

const { systemPreferences } = require("electron");

async function testPermissions() {
  console.log("🔍 Testing macOS Permissions for iTracksy\n");

  // Check if running on macOS
  if (process.platform !== "darwin") {
    console.log("❌ This script only works on macOS");
    return;
  }

  console.log("📋 Permission Status:");
  console.log("────────────────────────────");

  // Test Accessibility Permission
  try {
    const hasAccessibility = systemPreferences.isTrustedAccessibilityClient(false);
    console.log(`🔒 Accessibility: ${hasAccessibility ? "✅ Granted" : "❌ Not Granted"}`);

    if (!hasAccessibility) {
      console.log("   → Required for: Window detection and app tracking");
      console.log("   → Grant in: System Settings > Privacy & Security > Accessibility");
    }
  } catch (error) {
    console.log("🔒 Accessibility: ❌ Error checking permission");
    console.log("   → Error:", error.message);
  }

  // Test Screen Recording Permission
  try {
    const hasScreenRecording = systemPreferences.getMediaAccessStatus("screen") === "granted";
    console.log(`📹 Screen Recording: ${hasScreenRecording ? "✅ Granted" : "❌ Not Granted"}`);

    if (!hasScreenRecording) {
      console.log("   → Required for: Browser URL extraction");
      console.log("   → Grant in: System Settings > Privacy & Security > Screen Recording");
    }
  } catch (error) {
    console.log("📹 Screen Recording: ❌ Error checking permission");
    console.log("   → Error:", error.message);
  }

  console.log("\n🧪 Testing get-windows functionality:");
  console.log("────────────────────────────────────────");

  // Test get-windows library
  try {
    const getWindows = require("get-windows");

    const result = await getWindows.activeWindow({
      accessibilityPermission: true,
      screenRecordingPermission: true,
    });

    if (result) {
      console.log("✅ get-windows is working correctly");
      console.log(`   → Active app: ${result.owner.name}`);
      console.log(`   → Window title: ${result.title}`);
      if (result.url) {
        console.log(`   → URL detected: ${result.url}`);
      } else {
        console.log("   → No URL detected (may be normal if not browsing)");
      }
    } else {
      console.log("❌ get-windows returned no result");
      console.log("   → This may indicate permission issues");
    }
  } catch (error) {
    console.log("❌ get-windows test failed");
    console.log("   → Error:", error.message);

    if (error.message.includes("permission")) {
      console.log("   → This indicates missing permissions");
    }
  }

  console.log("\n📝 Summary:");
  console.log("─────────────");
  console.log("For iTracksy to work properly, you need:");
  console.log("1. ✅ Both Accessibility AND Screen Recording permissions");
  console.log("2. 🔄 Restart iTracksy after granting permissions");
  console.log("3. 🌐 Use supported browsers (Safari, Chrome, Firefox, Edge)");

  console.log("\n💡 Need help? Check docs/MACOS_PERMISSIONS.md for detailed setup instructions.");
}

// Only run if called directly (not imported)
if (require.main === module) {
  testPermissions().catch(console.error);
}

module.exports = { testPermissions };
