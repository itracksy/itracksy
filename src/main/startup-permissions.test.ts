import {
  buildPermissionDialogDetail,
  createStartupPermissionChecker,
  runStartupPermissionCheck,
} from "./startup-permissions";

const createLogger = () => ({
  debug: jest.fn(),
  error: jest.fn(),
});

const createDependencies = (
  overrides: Partial<Parameters<typeof runStartupPermissionCheck>[0]> = {}
) => {
  const logger = createLogger();
  const baseDependencies = {
    ci: undefined,
    platform: "darwin" as NodeJS.Platform,
    logger,
    checkAccessibilityPermission: jest.fn(() => true),
    checkScreenRecordingPermission: jest.fn(() => true),
    showMessageBox: jest.fn(async () => ({ response: 0 })),
    requestAccessibilityPermission: jest.fn(async () => true),
    requestScreenRecordingPermission: jest.fn(async () => true),
  };

  return {
    ...baseDependencies,
    ...overrides,
  };
};

describe("startup permissions", () => {
  test("skips the prompt in e2e mode", async () => {
    const dependencies = createDependencies({ ci: "e2e" });

    await runStartupPermissionCheck(dependencies);

    expect(dependencies.checkAccessibilityPermission).not.toHaveBeenCalled();
    expect(dependencies.checkScreenRecordingPermission).not.toHaveBeenCalled();
    expect(dependencies.showMessageBox).not.toHaveBeenCalled();
    expect(dependencies.logger.debug).toHaveBeenCalledWith(
      "Skipping macOS permission prompts during e2e startup"
    );
  });

  test("skips the prompt off macOS", async () => {
    const dependencies = createDependencies({ platform: "win32" });

    await runStartupPermissionCheck(dependencies);

    expect(dependencies.checkAccessibilityPermission).not.toHaveBeenCalled();
    expect(dependencies.showMessageBox).not.toHaveBeenCalled();
    expect(dependencies.logger.debug).toHaveBeenCalledWith(
      "Not on macOS, skipping permission checks"
    );
  });

  test("does not prompt when both permissions are already granted", async () => {
    const dependencies = createDependencies();

    await runStartupPermissionCheck(dependencies);

    expect(dependencies.checkAccessibilityPermission).toHaveBeenCalledTimes(1);
    expect(dependencies.checkScreenRecordingPermission).toHaveBeenCalledTimes(1);
    expect(dependencies.showMessageBox).not.toHaveBeenCalled();
    expect(dependencies.logger.debug).toHaveBeenCalledWith("All permissions already granted");
  });

  test("prompts for missing permissions and opens only the missing settings", async () => {
    const dependencies = createDependencies({
      checkAccessibilityPermission: jest.fn(() => false),
      checkScreenRecordingPermission: jest.fn(() => true),
    });

    await runStartupPermissionCheck(dependencies);

    expect(dependencies.showMessageBox).toHaveBeenCalledWith({
      type: "info",
      title: "Permissions Required",
      message: "iTracksy needs macOS permissions to track activity accurately",
      detail: buildPermissionDialogDetail(["Accessibility"]),
      buttons: ["Open System Settings", "Skip for Now"],
      defaultId: 0,
      cancelId: 1,
    });
    expect(dependencies.requestAccessibilityPermission).toHaveBeenCalledTimes(1);
    expect(dependencies.requestScreenRecordingPermission).not.toHaveBeenCalled();
  });

  test("does not open settings when the user skips", async () => {
    const dependencies = createDependencies({
      checkAccessibilityPermission: jest.fn(() => false),
      checkScreenRecordingPermission: jest.fn(() => false),
      showMessageBox: jest.fn(async () => ({ response: 1 })),
    });

    await runStartupPermissionCheck(dependencies);

    expect(dependencies.requestAccessibilityPermission).not.toHaveBeenCalled();
    expect(dependencies.requestScreenRecordingPermission).not.toHaveBeenCalled();
    expect(dependencies.logger.debug).toHaveBeenCalledWith(
      "User chose to skip permission setup for now"
    );
  });

  test("reuses the in-flight startup prompt promise", async () => {
    let resolveDialog: ((value: { response: number }) => void) | undefined;

    const dependencies = createDependencies({
      checkAccessibilityPermission: jest.fn(() => false),
      showMessageBox: jest.fn(
        () =>
          new Promise<{ response: number }>((resolve) => {
            resolveDialog = resolve;
          })
      ),
    });

    const checkPermissions = createStartupPermissionChecker(dependencies);
    const firstRun = checkPermissions();
    const secondRun = checkPermissions();

    expect(dependencies.showMessageBox).toHaveBeenCalledTimes(1);

    resolveDialog?.({ response: 1 });
    await Promise.all([firstRun, secondRun]);
  });
});
