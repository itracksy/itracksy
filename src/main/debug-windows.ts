import { BrowserWindow, dialog, app } from "electron";
import { logger } from "@/helpers/logger";

/**
 * Debugs all open windows to identify "ghost" windows.
 * Lists all windows, their visibility, and bounds.
 * Optionally forces them to be visible and highlighted.
 */
export function debugGhostWindows() {
  const windows = BrowserWindow.getAllWindows();
  const debugInfo: string[] = [];

  logger.info("--- DEBUGGING GHOST WINDOWS ---");
  debugInfo.push(`Total Windows: ${windows.length}`);

  windows.forEach((win, index) => {
    const title = win.getTitle();
    const isVisible = win.isVisible();
    const bounds = win.getBounds();
    const isFocused = win.isFocused();
    const isDestroyed = win.isDestroyed();
    const id = win.id;

    // Try to get URL if possible
    let url = "unknown";
    try {
        url = win.webContents.getURL();
    } catch (e) {
        // ignore
    }

    const info = `Window #${index + 1} (ID: ${id}):
      Title: "${title}"
      URL: ${url}
      Visible: ${isVisible}
      Focused: ${isFocused}
      Bounds: x=${bounds.x}, y=${bounds.y}, w=${bounds.width}, h=${bounds.height}
      Destroyed: ${isDestroyed}
    `;

    debugInfo.push(info);
    logger.info(info);

    // Highlight the window to make it visible
    if (!isDestroyed) {
      try {
        // Force show if hidden, to see where it is
        if (!isVisible) {
            logger.info(`Forcing Window #${id} to show for debugging`);
            // We can't just show it, because it might be the ghost one.
            // But if it's a ghost, it's likely "visible" but transparent.
        }

        // Create a visual indicator
        // We'll set a red background and ensure it's opaque
        win.webContents.insertCSS(`
            body {
                border: 5px solid red !important;
                background-color: rgba(255, 0, 0, 0.2) !important;
            }
        `);

        // Flash the window
        if (isVisible) {
            win.flashFrame(true);
        }
      } catch (error) {
        logger.error(`Failed to highlight window #${id}`, error);
      }
    }
  });

  logger.info("--- END DEBUGGING GHOST WINDOWS ---");

  // Show a summary dialog
  dialog.showMessageBox({
    type: 'info',
    title: 'Ghost Window Debugger',
    message: `Found ${windows.length} windows. Check logs for details.`,
    detail: debugInfo.join('\n'),
    buttons: ['OK']
  });
}

