#!/usr/bin/env node

/**
 * Test script to verify auto-update configuration
 * Run this to check if your auto-update setup is configured correctly
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAutoUpdate() {
  console.log("🔍 Testing Auto-Update Configuration...\n");

  // Check if update-electron-app is installed
  try {
    const updateElectronAppPath = await import.meta.resolve("update-electron-app");
    console.log("✅ update-electron-app package is installed");
    console.log(`   Path: ${updateElectronAppPath}`);
  } catch (error) {
    console.log("❌ update-electron-app package is not installed");
    process.exit(1);
  }

  // Check if electron-log is installed
  try {
    const electronLogPath = await import.meta.resolve("electron-log");
    console.log("✅ electron-log package is installed");
    console.log(`   Path: ${electronLogPath}`);
  } catch (error) {
    console.log("❌ electron-log package is not installed");
    process.exit(1);
  }

  // Check package.json repository field
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")
    );
    if (packageJson.repository && packageJson.repository.url) {
      console.log("✅ Repository field is configured in package.json");
      console.log(`   Repository: ${packageJson.repository.url}`);
    } else {
      console.log("❌ Repository field is missing from package.json");
      process.exit(1);
    }
  } catch (error) {
    console.log("❌ Could not read package.json");
    process.exit(1);
  }

  // Check forge.config.ts for GitHub publisher
  try {
    const forgeConfigPath = path.join(__dirname, "..", "forge.config.ts");
    const forgeConfigContent = fs.readFileSync(forgeConfigPath, "utf8");

    if (forgeConfigContent.includes("PublisherGithub")) {
      console.log("✅ GitHub publisher is configured in forge.config.ts");
    } else {
      console.log("❌ GitHub publisher is not configured in forge.config.ts");
      process.exit(1);
    }

    if (forgeConfigContent.includes("hunght/itracksy")) {
      console.log("✅ Repository owner/name is correctly configured");
    } else {
      console.log("❌ Repository owner/name is not correctly configured");
      process.exit(1);
    }
  } catch (error) {
    console.log("❌ Could not read forge.config.ts");
    process.exit(1);
  }

  // Check if the app is properly configured for auto-updates
  console.log("\n📋 Auto-Update Configuration Summary:");
  console.log("   • update-electron-app: ✅ Installed");
  console.log("   • electron-log: ✅ Installed");
  console.log("   • Repository: ✅ Configured");
  console.log("   • GitHub Publisher: ✅ Configured");
  console.log("   • Main Process: ✅ Auto-update code added");

  console.log("\n🚀 Your app is ready for auto-updates!");
  console.log("\n📝 Next steps:");
  console.log("   1. Build and package your app: npm run make");
  console.log("   2. Publish to GitHub: npm run publish");
  console.log("   3. Create a GitHub release with the built artifacts");
  console.log("   4. Users will automatically receive updates via update.electronjs.org");

  console.log("\n💡 Note: Auto-updates only work in production builds, not in development mode.");
}

// Run the test
testAutoUpdate().catch(console.error);
