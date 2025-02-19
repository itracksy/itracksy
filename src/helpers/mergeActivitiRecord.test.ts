import { ActivityRecord } from "@/types/activity";
import { mergeActivityRecord } from "./mergeActivitiRecord";

describe("mergeActivityRecord", () => {
  it("should merge consecutive matching records and update count", () => {
    const now = Date.now();
    const activities: ActivityRecord[] = [
      {
        platform: "darwin",
        activityId: 1,
        title: "Test Window",
        ownerPath: "/test/path",
        ownerProcessId: 123,
        ownerName: "Test App",
        timestamp: now,
        duration: 1,
      },
      {
        platform: "darwin",
        activityId: 1,
        title: "Test Window",
        ownerPath: "/test/path",
        ownerProcessId: 123,
        ownerName: "Test App",
        timestamp: now + 5 * 60 * 1000, // 5 minutes later
        duration: 1,
      },
      {
        platform: "darwin",
        activityId: 2, // Different ID
        title: "Another Window",
        ownerPath: "/test/path2",
        ownerProcessId: 456,
        ownerName: "Another App",
        timestamp: now + 10 * 60 * 1000, // 10 minutes later
        duration: 1,
      },
    ];

    const result = mergeActivityRecord(activities);

    expect(result).toHaveLength(2);
    expect(result[0].duration).toBe(2); // First two records should be merged
    expect(result[1].activityId).toBe(2); // Last record should remain separate
  });

  it("should not merge records more than 15 minutes apart", () => {
    const now = Date.now();
    const activities: ActivityRecord[] = [
      {
        platform: "darwin",
        activityId: 1,
        title: "Test Window",
        ownerPath: "/test/path",
        ownerProcessId: 123,
        ownerName: "Test App",
        timestamp: now,
        duration: 1,
      },
      {
        platform: "darwin",
        activityId: 1,
        title: "Test Window",
        ownerPath: "/test/path",
        ownerProcessId: 123,
        ownerName: "Test App",
        timestamp: now + 16 * 60 * 1000, // 16 minutes later
        duration: 1,
      },
    ];

    const result = mergeActivityRecord(activities);

    expect(result).toHaveLength(2); // Should not merge due to time difference
    expect(result[0].duration).toBe(1);
    expect(result[1].duration).toBe(1);
  });

  it("should handle long array", () => {
    const activities = [
      {
        platform: "macos",
        activityId: 8657,
        title: "itracksy — ActivityStorage.ts",
        ownerPath: "/Applications/Windsurf.app",
        ownerProcessId: 56949,
        ownerBundleId: undefined,
        ownerName: "Windsurf",
        url: undefined,
        timestamp: 1735808205440,
        duration: 21,
      },
      {
        platform: "macos",
        activityId: 8657,
        title: "itracksy — ActivityStorage.test.ts",
        ownerPath: "/Applications/Windsurf.app",
        ownerProcessId: 56949,
        ownerBundleId: undefined,
        ownerName: "Windsurf",
        url: undefined,
        timestamp: 1735808268555,
        duration: 2,
      },
      {
        platform: "macos",
        activityId: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867449986,
        duration: 4,
      },
      {
        platform: "macos",
        activityId: 18743,
        title: "itracksy — ActivityStorage.ts",
        ownerPath: "/Applications/Windsurf.app",
        ownerProcessId: 60395,
        ownerBundleId: undefined,
        ownerName: "Windsurf",
        url: undefined,
        timestamp: 1735867461984,
        duration: 1,
      },
      {
        platform: "macos",
        activityId: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867464978,
        duration: 14,
      },
      {
        platform: "macos",
        activityId: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867504024,
        duration: 4,
      },
      {
        platform: "macos",
        activityId: 18795,
        title:
          "itracksy — npm start — main ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867513089,
        duration: 1,
      },
      {
        platform: "macos",
        activityId: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867516084,
        duration: 1,
      },
      {
        platform: "macos",
        activityId: 18795,
        title:
          "itracksy — npm start — main ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867519096,
        duration: 1,
      },
      {
        platform: "macos",
        activityId: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867522075,
        duration: 2,
      },
      {
        platform: "macos",
        activityId: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867528107,
        duration: 2,
      },
      {
        platform: "macos",
        activityId: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867534101,
        duration: 2,
      },
      {
        platform: "macos",
        activityId: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867537104,
        duration: 1,
      },
    ];
    const count = activities.reduce((acc, activity) => acc + activity.duration, 0);
    const result = mergeActivityRecord(activities);
    const countResult = result.reduce((acc, activity) => acc + activity.duration, 0);
    expect(countResult).toBe(count);
    expect(result).toHaveLength(5);
  });
  it("should handle complex array", () => {
    const activities = [
      {
        duration: 21,
        activityId: 8657,
        ownerBundleId: undefined,
        ownerName: "Windsurf",
        ownerPath: "/Applications/Windsurf.app",
        ownerProcessId: 56949,
        platform: "macos",
        timestamp: 1735808205440,
        title: "itracksy — ActivityStorage.ts",
        url: undefined,
      },
      {
        duration: 2,
        activityId: 8657,
        ownerBundleId: undefined,
        ownerName: "Windsurf",
        ownerPath: "/Applications/Windsurf.app",
        ownerProcessId: 56949,
        platform: "macos",
        timestamp: 1735808268555,
        title: "itracksy — ActivityStorage.test.ts",
        url: undefined,
      },
      {
        duration: 4,
        activityId: 18795,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        platform: "macos",
        timestamp: 1735867449986,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        url: undefined,
      },
      {
        duration: 1,
        activityId: 18743,
        ownerBundleId: undefined,
        ownerName: "Windsurf",
        ownerPath: "/Applications/Windsurf.app",
        ownerProcessId: 60395,
        platform: "macos",
        timestamp: 1735867461984,
        title: "itracksy — ActivityStorage.ts",
        url: undefined,
      },
      {
        duration: 18,
        activityId: 18795,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        platform: "macos",
        timestamp: 1735867464978,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        url: undefined,
      },
      {
        duration: 1,
        activityId: 18795,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        platform: "macos",
        timestamp: 1735867513089,
        title:
          "itracksy — npm start — main ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        url: undefined,
      },
      {
        duration: 1,
        activityId: 18795,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        platform: "macos",
        timestamp: 1735867516084,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        url: undefined,
      },
      {
        duration: 1,
        activityId: 18795,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        platform: "macos",
        timestamp: 1735867519096,
        title:
          "itracksy — npm start — main ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        url: undefined,
      },
      {
        duration: 7,
        activityId: 18795,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        platform: "macos",
        timestamp: 1735867522075,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        url: undefined,
      },
    ];
    const result = mergeActivityRecord(activities);
    const count = activities.reduce((acc, activity) => acc + activity.duration, 0);

    const countResult = result.reduce((acc, activity) => acc + activity.duration, 0);
    expect(countResult).toBe(count);
    expect(result).toHaveLength(5);
  });
});
