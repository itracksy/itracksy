#!/usr/bin/env node

/**
 * Test script to verify scheduling monitoring is working
 * This script checks if the scheduling monitoring system is properly initialized
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSchedulingMonitoring() {
  console.log("🔍 Testing Scheduling Monitoring System...\n");

  // Check if the main.ts file has the scheduling monitoring import
  try {
    const mainTsPath = path.join(__dirname, "..", "src", "main.ts");
    const mainTsContent = fs.readFileSync(mainTsPath, "utf8");

    if (mainTsContent.includes("initializeScheduledSessionMonitoring")) {
      console.log("✅ Scheduling monitoring import found in main.ts");
    } else {
      console.log("❌ Scheduling monitoring import NOT found in main.ts");
      process.exit(1);
    }

    if (mainTsContent.includes("initializeScheduledSessionMonitoring()")) {
      console.log("✅ Scheduling monitoring initialization call found in main.ts");
    } else {
      console.log("❌ Scheduling monitoring initialization call NOT found in main.ts");
      process.exit(1);
    }
  } catch (error) {
    console.log("❌ Could not read main.ts file");
    process.exit(1);
  }

  // Check if the scheduledSessions service file exists and has the monitoring function
  try {
    const scheduledSessionsPath = path.join(
      __dirname,
      "..",
      "src",
      "api",
      "services",
      "scheduledSessions.ts"
    );
    const scheduledSessionsContent = fs.readFileSync(scheduledSessionsPath, "utf8");

    if (scheduledSessionsContent.includes("initializeScheduledSessionMonitoring")) {
      console.log("✅ Scheduling monitoring function found in scheduledSessions service");
    } else {
      console.log("❌ Scheduling monitoring function NOT found in scheduledSessions service");
      process.exit(1);
    }

    if (scheduledSessionsContent.includes("getSessionsToRun")) {
      console.log("✅ Session execution logic found in scheduledSessions service");
    } else {
      console.log("❌ Session execution logic NOT found in scheduledSessions service");
      process.exit(1);
    }

    if (scheduledSessionsContent.includes("executeScheduledSession")) {
      console.log("✅ Session execution function found in scheduledSessions service");
    } else {
      console.log("❌ Session execution function NOT found in scheduledSessions service");
      process.exit(1);
    }
  } catch (error) {
    console.log("❌ Could not read scheduledSessions service file");
    process.exit(1);
  }

  // Check if the scheduling router exists and has the execute endpoint
  try {
    const schedulingRouterPath = path.join(
      __dirname,
      "..",
      "src",
      "api",
      "routers",
      "scheduling.ts"
    );
    const schedulingRouterContent = fs.readFileSync(schedulingRouterPath, "utf8");

    if (schedulingRouterContent.includes("executeSession")) {
      console.log("✅ Session execution endpoint found in scheduling router");
    } else {
      console.log("❌ Session execution endpoint NOT found in scheduling router");
      process.exit(1);
    }
  } catch (error) {
    console.log("❌ Could not read scheduling router file");
    process.exit(1);
  }

  // Check if the scheduling page exists and has auto-start enabled by default
  try {
    const schedulingPagePath = path.join(
      __dirname,
      "..",
      "src",
      "pages",
      "scheduling",
      "index.tsx"
    );
    const schedulingPageContent = fs.readFileSync(schedulingPagePath, "utf8");

    if (schedulingPageContent.includes("autoStart: true")) {
      console.log("✅ Auto-start enabled by default in scheduling page");
    } else {
      console.log("❌ Auto-start NOT enabled by default in scheduling page");
      process.exit(1);
    }
  } catch (error) {
    console.log("❌ Could not read scheduling page file");
    process.exit(1);
  }

  console.log("\n📋 Scheduling Monitoring System Summary:");
  console.log("   • Main Process Integration: ✅ Configured");
  console.log("   • Monitoring Function: ✅ Implemented");
  console.log("   • Session Execution Logic: ✅ Ready");
  console.log("   • API Endpoints: ✅ Available");
  console.log("   • Auto-start by Default: ✅ Enabled");

  console.log("\n🚀 Scheduling Monitoring System is Ready!");
  console.log("\n💡 How it works:");
  console.log("   1. App starts → initializeScheduledSessionMonitoring() called");
  console.log("   2. Every minute → checks for sessions that should run");
  console.log("   3. All sessions → automatically executed at scheduled time");
  console.log("   4. Conflict handling → user choice system for active session conflicts");
  console.log("   5. Time tracking → creates time entries for executed sessions");

  console.log("\n📝 To test:");
  console.log("   1. Create a scheduled session in the app");
  console.log("   2. Set it to run at current time + 1 minute");
  console.log("   3. Wait for the scheduled time");
  console.log("   4. Check if session executes automatically");
  console.log("   5. Test conflict handling: start a session, then wait for scheduled time");

  console.log("\n🔍 Check logs for monitoring activity:");
  console.log("   Look for: '[initializeScheduledSessionMonitoring]' messages");
}

// Run the test
testSchedulingMonitoring().catch(console.error);
