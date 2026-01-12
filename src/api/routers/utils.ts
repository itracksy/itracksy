import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import { shell, net, app } from "electron";
import {
  createNotificationWindow,
  closeNotificationWindow as closeWindow,
  showNotificationWindow,
} from "../../main/windows/notification";
import { sendNotificationToWindow } from "../../helpers/notification/notification-window-utils";
import { buildAppLinks } from "../../config/app-links";

import { logger } from "../../helpers/logger";
import path from "path";
import fs from "fs";
import os from "os";
import { EventEmitter } from "events";
import { getDatabasePath } from "../../utils/paths";

//   a function to get platform-specific download URL without triggering download
const getPlatformDownloadUrl = (version: string): string => {
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
export const utilsRouter = t.router({
  openExternalUrl: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await shell.openExternal(input.url);
      return { success };
    }),

  openLocalFile: protectedProcedure
    .input(
      z.object({
        filePath: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await shell.openPath(input.filePath);
        return { success: true };
      } catch (error) {
        logger.error("Failed to open local file:", error);
        return { success: false, error: String(error) };
      }
    }),

  openFolder: protectedProcedure
    .input(
      z.object({
        folderPath: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await shell.openPath(input.folderPath);
        return { success: true };
      } catch (error) {
        logger.error("Failed to open folder:", error);
        return { success: false, error: String(error) };
      }
    }),

  quitApp: protectedProcedure.mutation(async () => {
    try {
      logger.info("Quitting application...");
      app.quit();
      return { success: true };
    } catch (error) {
      logger.error("Failed to quit app:", error);
      return { success: false, error: String(error) };
    }
  }),

  // Get current app version
  getAppVersion: protectedProcedure.query(() => {
    return app.getVersion();
  }),

  // Get log file content
  getLogFileContent: protectedProcedure.query(async () => {
    try {
      const content = await logger.getFileContent();
      const path = logger.getFilePath();
      const exists = fs.existsSync(path);
      return { content, path, exists };
    } catch (error) {
      logger.error("Failed to get log file content", error);
      throw error;
    }
  }),

  // Get database path
  getDatabasePath: protectedProcedure.query(() => {
    try {
      const dbPath = getDatabasePath();
      // Remove the "file:" prefix to get the actual path
      let actualPath = dbPath.replace(/^file:/, "");
      // Ensure it's an absolute path
      if (!path.isAbsolute(actualPath)) {
        actualPath = path.resolve(app.getAppPath(), actualPath);
      }
      const exists = fs.existsSync(actualPath);
      return { path: actualPath, exists };
    } catch (error) {
      logger.error("Failed to get database path", error);
      throw error;
    }
  }),

  // Clear log file content
  clearLogFile: protectedProcedure.mutation(async () => {
    try {
      await logger.clearLogFile();
      return { success: true };
    } catch (error) {
      logger.error("Failed to clear log file", error);
      return { success: false, error: String(error) };
    }
  }),

  openNotificationWindow: protectedProcedure
    .input(
      z
        .object({
          title: z.string(),
          description: z.string(),
          autoDismiss: z.boolean().optional(), // Optional auto-dismiss setting
        })
        .optional()
    )
    .mutation(async ({ input }) => {
      try {
        const window = createNotificationWindow();

        // If data is provided, send it to the notification window
        if (input && window) {
          const success = await sendNotificationToWindow({
            title: input.title,
            body: input.description,
            autoDismiss: input.autoDismiss ?? false, // Default is false
          });
          return { success };
        }

        // If no input, just show the empty window
        if (window) {
          showNotificationWindow();
        }

        return { success: !!window };
      } catch (error) {
        console.error("Failed to open notification window:", error);
        return { success: false, error: String(error) };
      }
    }),

  // Version checking procedure
  checkForUpdates: protectedProcedure.query(async () => {
    try {
      logger.info("Checking for updates...");
      const currentVersion = app.getVersion();
      logger.info(`Current app version: ${currentVersion}`);

      // Fetch the latest release from GitHub
      const response = await fetch(
        "https://api.github.com/repos/itracksy/itracksy/releases/latest"
      );

      if (!response.ok) {
        logger.error(`Failed to fetch latest release: ${response.statusText}`);
        return {
          status: "error" as const,
          message: "Failed to check for updates. Please try again later.",
          hasUpdate: false,
        };
      }

      const release = await response.json();
      const latestVersion = release.tag_name.replace("v", "");
      const downloadUrl = getPlatformDownloadUrl(latestVersion);

      logger.info(`Latest version available: ${latestVersion}`);

      // Compare versions (simple string comparison, assuming semver format)
      const hasUpdate = latestVersion > currentVersion;

      return {
        status: "success" as const,
        message: hasUpdate
          ? `Update available: ${latestVersion}`
          : "You are using the latest version.",
        hasUpdate,
        currentVersion,
        latestVersion,
        downloadUrl,
      };
    } catch (error) {
      logger.error("Failed to check for updates", error);
      return {
        status: "error" as const,
        message: "Failed to check for updates. Please try again later.",
        hasUpdate: false,
      };
    }
  }),

  // Download update procedure with progress tracking
  downloadUpdate: protectedProcedure
    .input(
      z.object({
        downloadUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { downloadUrl } = input;

      try {
        logger.info("Starting download from:", downloadUrl);

        // Get the download directory
        const downloadsDir = path.join(os.homedir(), "Downloads");

        // Extract filename from URL
        const urlParts = downloadUrl.split("/");
        const filename = urlParts[urlParts.length - 1] || "itracksy-update.dmg";
        const filePath = path.join(downloadsDir, filename);

        // Ensure downloads directory exists
        if (!fs.existsSync(downloadsDir)) {
          fs.mkdirSync(downloadsDir, { recursive: true });
        }

        return new Promise<{
          status: "success" | "error";
          message: string;
          filePath?: string;
          filename?: string;
        }>(async (resolve, reject) => {
          // Helper to perform download and follow redirects up to maxRedirects
          const maxRedirects = 5;

          const doRequest = (urlToFetch: string, redirectsLeft: number) => {
            let request;
            try {
              request = net.request({ method: "GET", url: urlToFetch });
            } catch (err) {
              logger.error("Failed to create net.request:", err);
              return reject({
                status: "error",
                message: `Failed to start download: ${String(err)}`,
              });
            }

            request.on("response", (response) => {
              const statusCode = response.statusCode || 0;
              logger.info(`Download response status: ${statusCode}`);

              // Handle redirects manually
              if (statusCode >= 300 && statusCode < 400 && redirectsLeft > 0) {
                const locationHeader = response.headers["location"] || response.headers["Location"];
                const location = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader;
                if (location) {
                  logger.info("Redirecting download to:", location);
                  // Drain response and start new request to location
                  response.on("data", () => {});
                  response.on("end", () => {
                    doRequest(location, redirectsLeft - 1);
                  });
                  return;
                }
              }

              if (statusCode >= 400) {
                logger.error(
                  "Download failed, status code:",
                  statusCode,
                  "headers:",
                  response.headers
                );
                // consume response and reject
                response.on("data", () => {});
                response.on("end", () => {
                  reject({ status: "error", message: `Download failed with status ${statusCode}` });
                });
                return;
              }

              logger.info(
                `Starting download, content-length: ${response.headers["content-length"] || "unknown"} bytes`
              );

              const writeStream = fs.createWriteStream(filePath);

              response.on("data", (chunk) => {
                writeStream.write(chunk);
              });

              response.on("end", () => {
                writeStream.end();
                logger.info("Download completed:", filePath);

                resolve({
                  status: "success",
                  message: "Download completed successfully",
                  filePath,
                  filename,
                });
              });

              response.on("error", (error) => {
                writeStream.destroy();
                logger.error("Download stream error:", error);
                reject({
                  status: "error",
                  message: "Download failed",
                });
              });
            });

            request.on("error", (error) => {
              logger.error("Download request error:", error);
              reject({
                status: "error",
                message: `Failed to start download: ${String(error)}`,
              });
            });

            request.end();
          };

          // Kick off the request
          doRequest(downloadUrl, maxRedirects);
        });
      } catch (error) {
        logger.error("Failed to download update", error);
        return {
          status: "error" as const,
          message: "Failed to download update",
        };
      }
    }),

  closeNotificationWindow: protectedProcedure.mutation(() => {
    try {
      closeWindow();
      return { success: true };
    } catch (error) {
      console.error("Failed to close notification window:", error);
      return { success: false, error: String(error) };
    }
  }),

  // Direct notification send procedure (uses the new IPC channel)
  sendNotification: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        autoDismiss: z.boolean().optional(), // Optional auto-dismiss setting
      })
    )
    .mutation(async ({ input }) => {
      try {
        const success = await sendNotificationToWindow({
          title: input.title,
          body: input.description,
          autoDismiss: input.autoDismiss ?? false, // Default is false
        });

        return { success };
      } catch (error) {
        console.error("Failed to send notification:", error);
        return { success: false, error: String(error) };
      }
    }),
});
