import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import { shell, net, app } from "electron";
import {
  createNotificationWindow,
  closeNotificationWindow as closeWindow,
} from "../../main/windows/notification";
import { sendNotificationToWindow } from "../../helpers/notification/notification-window-utils";
import { buildAppLinks } from "../../config/app-links";

import { logger } from "../../helpers/logger";
import path from "path";
import fs from "fs";
import os from "os";
import { EventEmitter } from "events";
import * as yauzl from "yauzl";

// Custom ZIP extraction function using yauzl for better error handling
const extractZipWithYauzl = (zipPath: string, extractDir: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(err);
        return;
      }

      if (!zipfile) {
        reject(new Error("Failed to open ZIP file"));
        return;
      }

      logger.info(`Opened ZIP file with ${zipfile.entryCount} entries`);

      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        logger.info(`Processing entry: ${entry.fileName}`);

        if (/\/$/.test(entry.fileName)) {
          // Directory entry
          const dirPath = path.join(extractDir, entry.fileName);
          fs.mkdirSync(dirPath, { recursive: true });
          zipfile.readEntry();
        } else {
          // File entry
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              logger.error(`Error opening read stream for ${entry.fileName}:`, err);
              reject(err);
              return;
            }

            if (!readStream) {
              logger.error(`No read stream for ${entry.fileName}`);
              reject(new Error(`No read stream for ${entry.fileName}`));
              return;
            }

            const filePath = path.join(extractDir, entry.fileName);
            const dirPath = path.dirname(filePath);

            // Ensure directory exists
            fs.mkdirSync(dirPath, { recursive: true });

            const writeStream = fs.createWriteStream(filePath);

            readStream.pipe(writeStream);

            writeStream.on("error", (err) => {
              logger.error(`Error writing file ${entry.fileName}:`, err);
              reject(err);
            });

            writeStream.on("close", () => {
              logger.info(`Successfully extracted: ${entry.fileName}`);
              zipfile.readEntry();
            });
          });
        }
      });

      zipfile.on("end", () => {
        logger.info("ZIP extraction completed successfully");
        resolve();
      });

      zipfile.on("error", (err) => {
        logger.error("ZIP extraction error:", err);
        reject(err);
      });
    });
  });
};

//   a function to get platform-specific download URL for auto-updates (ZIP files)
//   Returns ZIP files for all platforms for seamless auto-updates
const getPlatformDownloadUrl = (version: string): string => {
  const customAppLinks = buildAppLinks(version);
  // Use Electron's process.platform for platform detection
  switch (process.platform) {
    case "win32":
      return customAppLinks.windowsZip;
    case "darwin":
      // For macOS, check if running on ARM
      return process.arch === "arm64"
        ? customAppLinks.macosZip
        : customAppLinks.macosIntelZip || customAppLinks.macosZip;
    case "linux":
      return customAppLinks.linuxZip;
    default:
      return customAppLinks.releases;
  }
};

//   a function to get platform-specific download URL for manual downloads (installers)
//   Returns DMG files for macOS, EXE for Windows, DEB for Linux
const getPlatformInstallerUrl = (version: string): string => {
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
        const filename = urlParts[urlParts.length - 1] || "itracksy-update.zip";
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
              let totalBytesWritten = 0;

              response.on("data", (chunk) => {
                const success = writeStream.write(chunk);
                totalBytesWritten += chunk.length;

                // Handle backpressure
                if (!success) {
                  (response as any).pause();
                  writeStream.once("drain", () => {
                    (response as any).resume();
                  });
                }
              });

              response.on("end", () => {
                const contentLength = response.headers["content-length"];
                const expectedSize = parseInt(
                  Array.isArray(contentLength) ? contentLength[0] : contentLength || "0"
                );
                logger.info(`Response ended, total bytes received: ${totalBytesWritten}`);
                logger.info(`Expected content-length: ${expectedSize}`);

                if (expectedSize > 0 && totalBytesWritten !== expectedSize) {
                  logger.error(
                    `Download incomplete! Expected ${expectedSize} bytes, got ${totalBytesWritten} bytes`
                  );
                  writeStream.destroy();
                  reject({
                    status: "error",
                    message: `Download incomplete. Expected ${expectedSize} bytes, received ${totalBytesWritten} bytes`,
                  });
                  return;
                }

                writeStream.end();

                // Wait for write stream to finish
                writeStream.on("finish", () => {
                  logger.info("Download completed and file written:", filePath);

                  // Verify file exists and has content
                  if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    logger.info(`File size: ${stats.size} bytes`);

                    if (stats.size === 0) {
                      logger.error("Downloaded file is empty!");
                      reject({
                        status: "error",
                        message: "Downloaded file is empty",
                      });
                      return;
                    }

                    // Quick ZIP integrity check
                    try {
                      const fd = fs.openSync(filePath, "r");
                      const buffer = Buffer.alloc(4);
                      fs.readSync(fd, buffer, 0, 4, 0);
                      fs.closeSync(fd);
                      const signature = buffer.toString("hex");
                      logger.info(`Downloaded ZIP signature: ${signature}`);

                      if (!signature.startsWith("504b0304")) {
                        logger.error(`Invalid ZIP signature in downloaded file: ${signature}`);
                        reject({
                          status: "error",
                          message: `Downloaded file has invalid ZIP signature: ${signature}`,
                        });
                        return;
                      }
                    } catch (sigError) {
                      logger.error("Failed to check ZIP signature:", sigError);
                    }
                  } else {
                    logger.error("Downloaded file does not exist!");
                    reject({
                      status: "error",
                      message: "Downloaded file does not exist",
                    });
                    return;
                  }

                  resolve({
                    status: "success",
                    message: "Download completed successfully",
                    filePath,
                    filename,
                  });
                });

                writeStream.on("error", (error) => {
                  logger.error("Write stream error:", error);
                  reject({
                    status: "error",
                    message: "Failed to write download file",
                  });
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

            // Add timeout to prevent hanging downloads
            const timeout = setTimeout(
              () => {
                logger.error("Download timeout after 5 minutes");
                request.abort();
                reject({
                  status: "error",
                  message: "Download timeout",
                });
              },
              5 * 60 * 1000
            ); // 5 minutes

            request.on("response", () => {
              clearTimeout(timeout);
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

  // Check if update file already exists
  checkExistingUpdate: protectedProcedure
    .input(
      z.object({
        version: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { version } = input;

      try {
        // Use a more reliable way to detect platform in main process
        const platform = process.platform;
        const arch = process.arch;
        const expectedFilename = `itracksy-${platform}-${arch}-${version}.zip`;
        const downloadsDir = path.join(os.homedir(), "Downloads");
        const expectedPath = path.join(downloadsDir, expectedFilename);

        // Check if file exists
        if (fs.existsSync(expectedPath)) {
          logger.info("Found existing downloaded file:", expectedPath);
          return {
            exists: true,
            filePath: expectedPath,
          };
        }

        return {
          exists: false,
          filePath: null,
        };
      } catch (error) {
        logger.error("Error checking for existing file:", error);
        return {
          exists: false,
          filePath: null,
          error: String(error),
        };
      }
    }),

  // Install auto-update from ZIP file
  installUpdate: protectedProcedure
    .input(
      z.object({
        zipFilePath: z.string(),
        version: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { zipFilePath, version } = input;

      try {
        logger.info(`Installing update from ZIP file: ${zipFilePath}`);

        // Check if ZIP file exists
        if (!fs.existsSync(zipFilePath)) {
          throw new Error(`ZIP file not found: ${zipFilePath}`);
        }

        // Wait and retry mechanism for file system operations
        let zipStats: fs.Stats | undefined;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 + retryCount * 1000));

          zipStats = fs.statSync(zipFilePath);
          logger.info(`Attempt ${retryCount + 1}: ZIP file size: ${zipStats.size} bytes`);

          if (zipStats.size === 0) {
            logger.error(`Attempt ${retryCount + 1}: ZIP file is empty`);
            if (retryCount === maxRetries - 1) {
              throw new Error("ZIP file is empty after multiple attempts");
            }
            retryCount++;
            continue;
          }

          // Check if file size is reasonable (should be around 114MB)
          if (zipStats.size < 100000000) {
            logger.error(
              `Attempt ${retryCount + 1}: ZIP file size seems too small: ${zipStats.size} bytes. Expected around 114MB.`
            );
            if (retryCount === maxRetries - 1) {
              throw new Error(
                `ZIP file appears to be truncated after ${maxRetries} attempts. Size: ${zipStats.size} bytes, expected ~114MB`
              );
            }
            retryCount++;
            continue;
          }

          // File size looks good, break out of retry loop
          logger.info(`ZIP file size validation passed on attempt ${retryCount + 1}`);
          break;
        }

        // Ensure zipStats is defined
        if (!zipStats) {
          throw new Error("Failed to get valid ZIP file stats after all retry attempts");
        }

        // Basic ZIP file validation - check for ZIP signature
        const fd = fs.openSync(zipFilePath, "r");
        const zipBuffer = Buffer.alloc(4);
        fs.readSync(fd, zipBuffer, 0, 4, 0);
        fs.closeSync(fd);
        const zipSignature = zipBuffer.toString("hex");

        // ZIP files should start with "504b0304" (PK..)
        if (!zipSignature.startsWith("504b0304")) {
          logger.error(`Invalid ZIP file signature: ${zipSignature}`);
          throw new Error(
            `Invalid ZIP file signature: ${zipSignature}. Expected ZIP file to start with '504b0304'`
          );
        }

        logger.info("ZIP file signature validation passed");

        // Create temporary extraction directory
        const tempDir = path.join(os.tmpdir(), `itracksy-update-${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });

        // Copy ZIP file to temp directory to avoid file locking issues
        const tempZipPath = path.join(tempDir, `update-${Date.now()}.zip`);
        logger.info(`Copying ZIP file to temp location: ${tempZipPath}`);

        try {
          // Verify file size again before copying
          const preCopyStats = fs.statSync(zipFilePath);
          logger.info(`Pre-copy file size: ${preCopyStats.size} bytes`);

          if (preCopyStats.size !== zipStats.size) {
            throw new Error(
              `File size changed during validation: original ${zipStats.size}, pre-copy ${preCopyStats.size}`
            );
          }

          fs.copyFileSync(zipFilePath, tempZipPath);
          const copiedStats = fs.statSync(tempZipPath);
          logger.info(`Copied ZIP file size: ${copiedStats.size} bytes`);

          if (copiedStats.size !== zipStats.size) {
            throw new Error(
              `File copy failed: original size ${zipStats.size}, copied size ${copiedStats.size}`
            );
          }

          logger.info("File copy completed successfully with size verification");
        } catch (copyError) {
          logger.error("Failed to copy ZIP file:", copyError);
          throw new Error(`Failed to copy ZIP file: ${copyError}`);
        }

        logger.info(`Extracting ZIP to: ${tempDir}`);

        // Extract ZIP file with better error handling
        try {
          logger.info(`Starting ZIP extraction from: ${tempZipPath}`);
          logger.info(`Extracting to directory: ${tempDir}`);
          logger.info(`ZIP file size before extraction: ${fs.statSync(tempZipPath).size} bytes`);

          // Check if temp directory exists and is writable
          if (!fs.existsSync(tempDir)) {
            logger.info(`Creating temp directory: ${tempDir}`);
            fs.mkdirSync(tempDir, { recursive: true });
          }

          // Check temp directory permissions
          try {
            fs.accessSync(tempDir, fs.constants.W_OK);
            logger.info("Temp directory is writable");
          } catch (permError) {
            logger.error("Temp directory is not writable:", permError);
            throw new Error(`Temp directory is not writable: ${permError}`);
          }

          // Log ZIP file details before extraction
          const zipStats = fs.statSync(tempZipPath);
          logger.info(
            `ZIP file stats: size=${zipStats.size}, mtime=${zipStats.mtime}, mode=${zipStats.mode}`
          );

          // Check if ZIP file is readable
          try {
            fs.accessSync(tempZipPath, fs.constants.R_OK);
            logger.info("ZIP file is readable");
          } catch (readError) {
            logger.error("ZIP file is not readable:", readError);
            throw new Error(`ZIP file is not readable: ${readError}`);
          }

          logger.info("Starting ZIP extraction with yauzl library...");

          // Extract ZIP file using yauzl (our robust extraction method)
          await extractZipWithYauzl(tempZipPath, tempDir);
          logger.info("ZIP extraction with yauzl completed successfully");

          // Verify extraction results
          const extractedFiles = fs.readdirSync(tempDir);
          logger.info(
            `Extracted ${extractedFiles.length} items to temp directory:`,
            extractedFiles
          );

          // Check if app.asar was extracted and its properties
          const appAsarPath = path.join(
            tempDir,
            "itracksy.app",
            "Contents",
            "Resources",
            "app.asar"
          );
          if (fs.existsSync(appAsarPath)) {
            const appAsarStats = fs.statSync(appAsarPath);
            logger.info(
              `app.asar extracted successfully: size=${appAsarStats.size} bytes, mode=${appAsarStats.mode}`
            );

            // Check if app.asar is readable
            try {
              fs.accessSync(appAsarPath, fs.constants.R_OK);
              logger.info("app.asar is readable");

              // Check the first few bytes to see if it's a valid ASAR file
              const fd = fs.openSync(appAsarPath, "r");
              const headerBuffer = Buffer.alloc(8);
              fs.readSync(fd, headerBuffer, 0, 8, 0);
              fs.closeSync(fd);

              const headerHex = headerBuffer.toString("hex");
              logger.info(`app.asar header (first 8 bytes): ${headerHex}`);

              // ASAR files should start with specific magic bytes
              if (headerHex.startsWith("04000000")) {
                logger.info("app.asar appears to have valid ASAR header");
              } else {
                logger.warn("app.asar does not appear to have valid ASAR header");
              }
            } catch (readError) {
              logger.error("app.asar is not readable:", readError);
            }
          } else {
            logger.error("app.asar not found after extraction");
          }
        } catch (extractError) {
          logger.error("ZIP extraction failed:", extractError);
          logger.error("Extract error details:", {
            message: extractError instanceof Error ? extractError.message : String(extractError),
            stack: extractError instanceof Error ? extractError.stack : undefined,
            originalZipFilePath: zipFilePath,
            tempZipPath,
            tempDir,
            originalZipFileSize: fs.existsSync(zipFilePath)
              ? fs.statSync(zipFilePath).size
              : "file not found",
            tempZipFileSize: fs.existsSync(tempZipPath)
              ? fs.statSync(tempZipPath).size
              : "file not found",
          });
          throw new Error(`Failed to extract ZIP file: ${extractError}`);
        }

        // Find the extracted app bundle
        const extractedFiles = fs.readdirSync(tempDir);
        const appBundle = extractedFiles.find(
          (file) => file.endsWith(".app") || file.endsWith(".exe") || file.endsWith("AppImage")
        );

        if (!appBundle) {
          throw new Error("No app bundle found in extracted files");
        }

        const extractedAppPath = path.join(tempDir, appBundle);
        const currentAppPath = process.execPath;

        logger.info(`Found app bundle: ${appBundle}`);
        logger.info(`Current app path: ${currentAppPath}`);

        // For macOS, we need to use a different approach due to code signing
        if (process.platform === "darwin") {
          logger.info("Platform detected: macOS - using script-based installation");

          // Instead of replacing the app bundle directly, we'll use a script approach
          // This is because signed app bundles can't be directly moved/replaced

          const currentAppDir = path.dirname(currentAppPath);
          const newAppPath = path.join(currentAppDir, appBundle);
          const updateScriptPath = path.join(tempDir, "update.sh");

          logger.info(`Current app directory: ${currentAppDir}`);
          logger.info(`New app path: ${newAppPath}`);
          logger.info(`Update script path: ${updateScriptPath}`);

          // Create an update script that will handle the replacement
          const updateScript = `#!/bin/bash
echo "Starting update process..."
echo "Current app path: ${newAppPath}"
echo "Extracted app path: ${extractedAppPath}"
echo "Temp directory: ${tempDir}"

# Kill the current app
echo "Killing current app process..."
pkill -f "itracksy" || true
sleep 2

# Remove old app bundle
echo "Removing old app bundle..."
rm -rf "${newAppPath}"

# Move new app bundle
echo "Moving new app bundle..."
mv "${extractedAppPath}" "${newAppPath}"

# Launch the new app
echo "Launching new app..."
open "${newAppPath}"

# Clean up
echo "Cleaning up temporary files..."
rm -rf "${tempDir}"

echo "Update process completed successfully!"
`;

          // Write the update script
          logger.info("Writing update script to disk...");
          fs.writeFileSync(updateScriptPath, updateScript);
          fs.chmodSync(updateScriptPath, 0o755);

          logger.info(`Created update script at: ${updateScriptPath}`);
          logger.info(`New app will be installed at: ${newAppPath}`);
          logger.info("Script contents:");
          logger.info(updateScript);

          // Execute the update script
          logger.info("Spawning update script process...");
          const { spawn } = require("child_process");
          const updateProcess = spawn("bash", [updateScriptPath], {
            detached: true,
            stdio: "pipe", // Changed to pipe to capture output
          });

          // Log script output for debugging
          updateProcess.stdout?.on("data", (data: Buffer) => {
            logger.info(`Update script stdout: ${data.toString()}`);
          });

          updateProcess.stderr?.on("data", (data: Buffer) => {
            logger.error(`Update script stderr: ${data.toString()}`);
          });

          updateProcess.on("close", (code: number | null) => {
            logger.info(`Update script process exited with code: ${code}`);
          });

          updateProcess.on("error", (error: Error) => {
            logger.error(`Update script process error: ${error}`);
          });

          updateProcess.unref();

          // Exit the current app so the update can proceed
          logger.info("Scheduling app quit in 1 second...");
          setTimeout(() => {
            logger.info("Quitting application to allow update...");
            app.quit();
          }, 1000);

          return {
            status: "success" as const,
            message: `Update to version ${version} is being installed. The application will restart automatically.`,
          };
        }

        // For other platforms (Windows, Linux), handle normally
        if (process.platform === "win32" || process.platform === "linux") {
          logger.info(`Platform detected: ${process.platform} - using direct file replacement`);

          const currentAppDir = path.dirname(currentAppPath);
          const newAppPath = path.join(currentAppDir, appBundle);

          logger.info(`Current app directory: ${currentAppDir}`);
          logger.info(`New app path: ${newAppPath}`);

          // Remove old app bundle if it exists
          if (fs.existsSync(newAppPath)) {
            logger.info("Removing existing app bundle...");
            fs.rmSync(newAppPath, { recursive: true, force: true });
          }

          // Move new app bundle to replace old one
          logger.info("Moving new app bundle to replace old one...");
          fs.renameSync(extractedAppPath, newAppPath);

          logger.info(`App bundle replaced at: ${newAppPath}`);

          // Clean up temporary directory
          logger.info("Cleaning up temporary directory...");
          fs.rmSync(tempDir, { recursive: true, force: true });

          // Clean up downloaded ZIP file
          logger.info("Cleaning up downloaded ZIP file...");
          fs.unlinkSync(zipFilePath);

          logger.info(`Update installation completed successfully`);

          return {
            status: "success" as const,
            message: `Update to version ${version} installed successfully. Please restart the application.`,
          };
        }
      } catch (error) {
        logger.error(`Failed to install update: ${error}`);

        // Get the download URL for manual download fallback
        const downloadUrl = getPlatformDownloadUrl(version);

        return {
          status: "error" as const,
          message: `Failed to install update: ${error}`,
          fallbackUrl: downloadUrl,
          fallbackMessage: "You can manually download the update from the releases page.",
        };
      }
    }),

  // Get releases page URL for manual download fallback
  getReleasesPageUrl: protectedProcedure
    .input(z.object({ version: z.string() }))
    .query(async ({ input }) => {
      try {
        const { version } = input;
        const releasesPageUrl = `https://github.com/itracksy/itracksy/releases/tag/v${version}`;
        const downloadUrl = getPlatformDownloadUrl(version);

        return {
          releasesPageUrl,
          downloadUrl,
          message: "Manual download options available",
        };
      } catch (error) {
        logger.error(`Failed to get releases page URL: ${error}`);
        return {
          releasesPageUrl: "https://github.com/itracksy/itracksy/releases",
          downloadUrl: null,
          message: "Failed to get specific version URL, using general releases page",
        };
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
