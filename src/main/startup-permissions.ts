interface PermissionDialogOptions {
  readonly type: "info";
  readonly title: string;
  readonly message: string;
  readonly detail: string;
  readonly buttons: string[];
  readonly defaultId: number;
  readonly cancelId: number;
}

interface PermissionDialogResult {
  readonly response: number;
}

interface PermissionLogger {
  readonly debug: (message: string, ...args: readonly unknown[]) => void;
  readonly error: (message: string, ...args: readonly unknown[]) => void;
}

interface StartupPermissionCheckerDependencies {
  readonly ci?: string;
  readonly platform: NodeJS.Platform;
  readonly logger: PermissionLogger;
  readonly checkAccessibilityPermission: () => boolean;
  readonly checkScreenRecordingPermission: () => boolean;
  readonly showMessageBox: (options: PermissionDialogOptions) => Promise<PermissionDialogResult>;
  readonly requestAccessibilityPermission: () => Promise<boolean>;
  readonly requestScreenRecordingPermission: () => Promise<boolean>;
}

const buildMissingPermissions = ({
  hasAccessibility,
  hasScreenRecording,
}: {
  readonly hasAccessibility: boolean;
  readonly hasScreenRecording: boolean;
}): readonly string[] => {
  const missingPermissions: string[] = [];

  if (!hasAccessibility) {
    missingPermissions.push("Accessibility");
  }

  if (!hasScreenRecording) {
    missingPermissions.push("Screen Recording");
  }

  return missingPermissions;
};

export const buildPermissionDialogDetail = (missingPermissions: readonly string[]): string =>
  `Missing permissions:\n\n• ${missingPermissions.join("\n• ")}` +
  "\n\nOpen System Settings and enable these for iTracksy. " +
  "You can skip this for now and grant them later from the app Settings.";

export const runStartupPermissionCheck = async ({
  ci,
  platform,
  logger,
  checkAccessibilityPermission,
  checkScreenRecordingPermission,
  showMessageBox,
  requestAccessibilityPermission,
  requestScreenRecordingPermission,
}: StartupPermissionCheckerDependencies): Promise<void> => {
  if (ci === "e2e") {
    logger.debug("Skipping macOS permission prompts during e2e startup");
    return;
  }

  if (platform !== "darwin") {
    logger.debug("Not on macOS, skipping permission checks");
    return;
  }

  try {
    logger.debug("Checking macOS permissions for browser URL tracking");

    const hasAccessibility = checkAccessibilityPermission();
    const hasScreenRecording = checkScreenRecordingPermission();

    logger.debug("Permission status:", { hasAccessibility, hasScreenRecording });

    if (hasAccessibility && hasScreenRecording) {
      logger.debug("All permissions already granted");
      return;
    }

    const missingPermissions = buildMissingPermissions({
      hasAccessibility,
      hasScreenRecording,
    });

    const response = await showMessageBox({
      type: "info",
      title: "Permissions Required",
      message: "iTracksy needs macOS permissions to track activity accurately",
      detail: buildPermissionDialogDetail(missingPermissions),
      buttons: ["Open System Settings", "Skip for Now"],
      defaultId: 0,
      cancelId: 1,
    });

    if (response.response !== 0) {
      logger.debug("User chose to skip permission setup for now");
      return;
    }

    logger.debug("User chose to open permission settings");

    if (!hasAccessibility) {
      logger.debug("Requesting Accessibility permission");
      await requestAccessibilityPermission();
    }

    if (!hasScreenRecording) {
      logger.debug("Requesting Screen Recording permission");
      await requestScreenRecordingPermission();
    }
  } catch (error) {
    logger.error("[checkAndRequestPermissions] Failed to prompt for permissions", { error });
  }
};

export const createStartupPermissionChecker = (
  dependencies: StartupPermissionCheckerDependencies
): (() => Promise<void>) => {
  let startupPermissionPromptPromise: Promise<void> | null = null;

  return async () => {
    if (startupPermissionPromptPromise) {
      await startupPermissionPromptPromise;
      return;
    }

    startupPermissionPromptPromise = runStartupPermissionCheck(dependencies);
    await startupPermissionPromptPromise;
  };
};
