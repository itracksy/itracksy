import {
  app,
  Menu,
  nativeImage,
  type MenuItemConstructorOptions,
  type NativeImage,
  type ThumbarButton,
} from "electron";
import { getCurrentUserIdLocalStorage } from "@/api/services/userSettings";
import { logger } from "@/helpers/logger";
import { getMainWindowReference, getTrayReference } from "@/main/window-references";
import { toggleClockWindow } from "@/main/windows/clock";

type ActiveTimeEntry = Awaited<
  ReturnType<(typeof import("@/api/services/timeEntry"))["getActiveTimeEntry"]>
>;

interface ShellSessionState {
  readonly activeEntry: ActiveTimeEntry;
  readonly isPaused: boolean;
}

const THUMBAR_ICON_SIZE = 16;
let isShellActionPending = false;

const createThumbarIcon = (svgMarkup: string): NativeImage => {
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgMarkup).toString("base64")}`;
  return nativeImage
    .createFromDataURL(dataUrl)
    .resize({ width: THUMBAR_ICON_SIZE, height: THUMBAR_ICON_SIZE });
};

const PAUSE_ICON = createThumbarIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <rect x="3.5" y="2.5" width="3" height="11" rx="0.8" fill="#000000" />
    <rect x="9.5" y="2.5" width="3" height="11" rx="0.8" fill="#000000" />
  </svg>
`);

const RESUME_ICON = createThumbarIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <path d="M4 2.75L12.5 8L4 13.25V2.75Z" fill="#000000" />
  </svg>
`);

const STOP_ICON = createThumbarIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <rect x="3.25" y="3.25" width="9.5" height="9.5" rx="1" fill="#000000" />
  </svg>
`);

const getSessionKindLabel = (activeEntry: ActiveTimeEntry): string => {
  if (!activeEntry) {
    return "Session";
  }
  if (activeEntry.isFocusMode === true) {
    return "Focus Session";
  }
  if (activeEntry.isFocusMode === false) {
    return "Break Session";
  }
  return "Session";
};

const showMainWindowFromShell = (): void => {
  const mainWindow = getMainWindowReference();
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.focus();

  if (process.platform === "darwin") {
    mainWindow.setAlwaysOnTop(true);
    mainWindow.setAlwaysOnTop(false);
  } else if (process.platform === "win32") {
    mainWindow.setAlwaysOnTop(true);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.moveTop();
  }
};

const getSessionShellState = async (): Promise<ShellSessionState> => {
  try {
    const userId = await getCurrentUserIdLocalStorage();
    if (!userId) {
      return { activeEntry: null, isPaused: false };
    }

    const [{ getActiveTimeEntry }, { getPausedSession }] = await Promise.all([
      import("@/api/services/timeEntry"),
      import("@/api/services/sessionPause"),
    ]);

    const activeEntry = await getActiveTimeEntry(userId);
    if (!activeEntry) {
      return { activeEntry: null, isPaused: false };
    }

    const pausedSession = getPausedSession();
    return {
      activeEntry,
      isPaused: pausedSession?.timeEntryId === activeEntry.id,
    };
  } catch (error) {
    logger.error("[SessionShellControls] Failed to read session state", { error });
    return { activeEntry: null, isPaused: false };
  }
};

const runShellSessionAction = async (actionName: string, action: () => Promise<void>) => {
  if (isShellActionPending) {
    return;
  }

  isShellActionPending = true;
  await refreshSessionShellControls();

  try {
    await action();
  } catch (error) {
    logger.error(`[SessionShellControls] ${actionName} failed`, { error });
  } finally {
    isShellActionPending = false;
    await refreshSessionShellControls();
  }
};

const handlePauseResumeSessionAction = async (): Promise<void> => {
  await runShellSessionAction("pause-resume session", async () => {
    const state = await getSessionShellState();
    if (!state.activeEntry) {
      return;
    }

    if (state.isPaused) {
      const [{ manualResumeSession }, { forceResumeTracking }] = await Promise.all([
        import("@/api/services/sessionPause"),
        import("@/api/services/trackingIntervalActivity"),
      ]);

      const result = await manualResumeSession();
      if (!result.success) {
        logger.warn("[SessionShellControls] Resume action was rejected", {
          error: result.error,
        });
        return;
      }

      forceResumeTracking();
      return;
    }

    const { manualPauseSession } = await import("@/api/services/sessionPause");
    const result = await manualPauseSession();
    if (!result.success) {
      logger.warn("[SessionShellControls] Pause action was rejected", {
        error: result.error,
      });
    }
  });
};

const handleStopSessionAction = async (): Promise<void> => {
  await runShellSessionAction("stop session", async () => {
    const state = await getSessionShellState();
    if (!state.activeEntry) {
      return;
    }

    const { updateTimeEntry } = await import("@/api/services/timeEntry");
    await updateTimeEntry(state.activeEntry.id, { endTime: Date.now() });
  });
};

const buildSessionMenuItems = (state: ShellSessionState): MenuItemConstructorOptions[] => {
  if (!state.activeEntry) {
    return [{ label: "No Active Session", enabled: false }];
  }

  const sessionLabel = getSessionKindLabel(state.activeEntry);
  const pauseResumeLabel = state.isPaused ? `Resume ${sessionLabel}` : `Pause ${sessionLabel}`;

  return [
    {
      label: pauseResumeLabel,
      enabled: !isShellActionPending,
      click: () => {
        void handlePauseResumeSessionAction();
      },
    },
    {
      label: `Stop ${sessionLabel}`,
      enabled: !isShellActionPending,
      click: () => {
        void handleStopSessionAction();
      },
    },
  ];
};

const buildShellMenuTemplate = (
  state: ShellSessionState,
  includeQuit: boolean
): MenuItemConstructorOptions[] => {
  const sessionItems = buildSessionMenuItems(state);

  return [
    {
      label: "Show iTracksy",
      click: () => {
        showMainWindowFromShell();
      },
    },
    {
      label: "Toggle Clock",
      click: () => {
        toggleClockWindow();
      },
    },
    { type: "separator" },
    ...sessionItems,
    ...(includeQuit
      ? [
          { type: "separator" } as MenuItemConstructorOptions,
          {
            label: "Quit",
            click: () => {
              app.quit();
            },
          } as MenuItemConstructorOptions,
        ]
      : []),
  ];
};

const updateTrayMenu = (state: ShellSessionState): void => {
  const tray = getTrayReference();
  if (!tray) {
    return;
  }

  const menu = Menu.buildFromTemplate(buildShellMenuTemplate(state, true));
  tray.setContextMenu(menu);
};

const updateDockMenu = (state: ShellSessionState): void => {
  if (process.platform !== "darwin" || !app.dock) {
    return;
  }

  const menu = Menu.buildFromTemplate(buildShellMenuTemplate(state, false));
  app.dock.setMenu(menu);
};

const updateTaskbarButtons = (state: ShellSessionState): void => {
  const mainWindow = getMainWindowReference();
  if (process.platform !== "win32" || !mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (!state.activeEntry) {
    mainWindow.setThumbarButtons([]);
    return;
  }

  const sessionLabel = getSessionKindLabel(state.activeEntry);
  const pauseResumeTooltip = state.isPaused ? `Resume ${sessionLabel}` : `Pause ${sessionLabel}`;
  const buttonFlags: ThumbarButton["flags"] = isShellActionPending ? ["disabled"] : [];

  const buttons: ThumbarButton[] = [
    {
      tooltip: pauseResumeTooltip,
      icon: state.isPaused ? RESUME_ICON : PAUSE_ICON,
      flags: buttonFlags,
      click: () => {
        void handlePauseResumeSessionAction();
      },
    },
    {
      tooltip: `Stop ${sessionLabel}`,
      icon: STOP_ICON,
      flags: buttonFlags,
      click: () => {
        void handleStopSessionAction();
      },
    },
  ];

  mainWindow.setThumbarButtons(buttons);
};

export const refreshSessionShellControls = async (): Promise<void> => {
  const state = await getSessionShellState();
  updateTrayMenu(state);
  updateDockMenu(state);
  updateTaskbarButtons(state);
};
