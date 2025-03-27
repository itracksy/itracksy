import posthog from "posthog-js";
import { getConfig } from "../config/env";

/**
 * Safe analytics interface that gracefully handles any PostHog errors
 */
export const analytics = {
  /**
   * Identify a user
   * @param userId User identifier
   * @param properties Additional properties
   */
  identify: (userId: string, properties?: Record<string, any>): void => {
    try {
      posthog.identify(userId, properties);
    } catch (error) {
      console.error("Analytics identify error:", error);
    }
  },

  /**
   * Track a specific event
   * @param eventName Name of the event
   * @param properties Additional properties
   */
  track: (eventName: string, properties?: Record<string, any>): void => {
    try {
      posthog.capture(eventName, properties);
    } catch (error) {
      console.error(`Analytics track error for event "${eventName}":`, error);
    }
  },

  /**
   * Track a page view
   * @param path Page path
   * @param properties Additional properties
   */
  pageView: (path: string, properties?: Record<string, any>): void => {
    try {
      posthog.capture("$pageview", {
        $current_url: path,
        view_name: path.split("/").pop() || "home",
        ...properties,
      });
    } catch (error) {
      console.error(`Analytics pageView error for path "${path}":`, error);
    }
  },

  /**
   * Update user properties
   * @param properties Properties to update
   */
  updateUserProperties: (properties: Record<string, any>): void => {
    try {
      posthog.people.set(properties);
    } catch (error) {
      console.error("Analytics updateUserProperties error:", error);
    }
  },

  /**
   * Register global properties to be sent with all events
   * @param properties Properties to register
   */
  registerGlobalProperties: (properties: Record<string, any>): void => {
    try {
      posthog.register(properties);
    } catch (error) {
      console.error("Analytics registerGlobalProperties error:", error);
    }
  },
};

/**
 * Initialize analytics with app version
 * @param appVersion The application version
 */
export function initializeAnalytics(appVersion: string): void {
  analytics.registerGlobalProperties({
    app_platform: "electron",
    app_version: appVersion,
    environment: process.env.NODE_ENV || "production",
  });
}
