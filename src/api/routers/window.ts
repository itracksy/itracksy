import { z } from "zod";
import { protectedProcedure, t } from "../trpc";
import { BrowserWindow, Tray } from "electron";
import { logger } from "../../helpers/logger";
import { hideClockWindow } from "../../main/windows/clock";

// Global references to main window and tray
let mainWindowRef: BrowserWindow | null = null;
let trayRef: Tray | null = null;

// Function to set references (called from main process)
export const setWindowReferences = (mainWindow: BrowserWindow, tray: Tray | null) => {
  mainWindowRef = mainWindow;
  trayRef = tray;
};

export const windowRouter = t.router({
  // WIN_MINIMIZE_CHANNEL
  minimize: protectedProcedure.mutation(async () => {
    try {
      if (!mainWindowRef) {
        throw new Error("Main window not available");
      }
      mainWindowRef.minimize();
      return { success: true };
    } catch (error) {
      logger.error("Failed to minimize window", { error });
      throw error;
    }
  }),

  // WIN_MAXIMIZE_CHANNEL
  maximize: protectedProcedure.mutation(async () => {
    try {
      if (!mainWindowRef) {
        throw new Error("Main window not available");
      }

      if (mainWindowRef.isMaximized()) {
        mainWindowRef.unmaximize();
      } else {
        mainWindowRef.maximize();
      }
      return { success: true };
    } catch (error) {
      logger.error("Failed to maximize/unmaximize window", { error });
      throw error;
    }
  }),

  // WIN_CLOSE_CHANNEL
  close: protectedProcedure.mutation(async () => {
    try {
      if (!mainWindowRef) {
        throw new Error("Main window not available");
      }
      mainWindowRef.close();
      return { success: true };
    } catch (error) {
      logger.error("Failed to close window", { error });
      throw error;
    }
  }),

  // WIN_UPDATE_TRAY_TITLE_CHANNEL
  updateTrayTitle: protectedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ input }) => {
      try {
        if (!trayRef) {
          throw new Error("Tray not available");
        }
        trayRef.setTitle(input.title);
        return { success: true };
      } catch (error) {
        logger.error("Failed to update tray title", { error, title: input.title });
        throw error;
      }
    }),

  // WIN_CLOCK_VISIBILITY_CHANGE_CHANNEL
  setClockVisibility: protectedProcedure
    .input(z.object({ isVisible: z.boolean() }))
    .mutation(async ({ input }) => {
      try {
        // When clock visibility is disabled, hide the clock window
        if (!input.isVisible) {
          hideClockWindow();
        }
        // When enabled, don't show it immediately - it will show on next new session
        return { success: true };
      } catch (error) {
        logger.error("Failed to handle clock visibility change", {
          error,
          isVisible: input.isVisible,
        });
        throw error;
      }
    }),
});
