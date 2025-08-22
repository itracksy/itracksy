import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import { shell, net, app } from "electron";
import {
  createNotificationWindow,
  closeNotificationWindow as closeWindow,
} from "../../main/windows/notification";
import { sendNotificationToWindow } from "../../helpers/notification/notification-window-utils";
import { getPlatformDownloadUrl } from "../../helpers/ipc/window/handleDownload";
import { logger } from "../../helpers/logger";
import path from "path";
import fs from "fs";
import os from "os";
import { EventEmitter } from "events";

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

  // Get current app version
  getAppVersion: protectedProcedure.query(() => {
    return app.getVersion();
  }),

  // Get log file content
  getLogFileContent: protectedProcedure.query(async () => {
    try {
      const logFileContent = await logger.getFileContent();
      return logFileContent;
    } catch (error) {
      logger.error("Failed to get log file content", error);
      throw error;
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
        }>((resolve, reject) => {
          const request = net.request(downloadUrl);
          let downloadedBytes = 0;
          let totalBytes = 0;

          request.on("response", (response) => {
            totalBytes = parseInt(response.headers["content-length"] as string) || 0;
            logger.info(`Download size: ${totalBytes} bytes`);

            const writeStream = fs.createWriteStream(filePath);

            response.on("data", (chunk) => {
              downloadedBytes += chunk.length;
              writeStream.write(chunk);

              // Calculate and log progress
              if (totalBytes > 0) {
                const progress = Math.round((downloadedBytes / totalBytes) * 100);
                logger.debug(`Download progress: ${progress}%`);

                // Note: Progress updates would need to be handled via subscriptions
                // or a different mechanism in tRPC. For now, we'll handle completion only.
              }
            });

            response.on("end", () => {
              writeStream.end();
              logger.info("Download completed:", filePath);

              // Auto-open the downloaded file
              shell
                .openPath(filePath)
                .then(() => {
                  logger.info("Opened downloaded file:", filePath);
                })
                .catch((error) => {
                  logger.error("Failed to open downloaded file:", error);
                });

              resolve({
                status: "success",
                message: "Download completed successfully",
                filePath,
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
              message: "Failed to start download",
            });
          });

          request.end();
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
