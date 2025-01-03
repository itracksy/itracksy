import { ActivityRecord } from "@/types/activity";
import { mergeActivityRecord } from "../../utils/ActivityStorage";

// Mock electron
jest.mock("electron", () => ({
  app: {
    getPath: jest.fn().mockReturnValue("/mock/user/data"),
  },
}));

// Mock fs
jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(true),
  writeFileSync: jest.fn(),
}));

describe("mergeActivityRecord", () => {
  it("should merge consecutive matching records and update count", () => {
    const now = Date.now();
    const activities: ActivityRecord[] = [
      {
        platform: "darwin",
        id: 1,
        title: "Test Window",
        ownerPath: "/test/path",
        ownerProcessId: 123,
        ownerName: "Test App",
        timestamp: now,
        count: 1,
      },
      {
        platform: "darwin",
        id: 1,
        title: "Test Window",
        ownerPath: "/test/path",
        ownerProcessId: 123,
        ownerName: "Test App",
        timestamp: now + 5 * 60 * 1000, // 5 minutes later
        count: 1,
      },
      {
        platform: "darwin",
        id: 2, // Different ID
        title: "Another Window",
        ownerPath: "/test/path2",
        ownerProcessId: 456,
        ownerName: "Another App",
        timestamp: now + 10 * 60 * 1000, // 10 minutes later
        count: 1,
      },
    ];

    const result = mergeActivityRecord(activities);

    expect(result).toHaveLength(2);
    expect(result[0].count).toBe(2); // First two records should be merged
    expect(result[1].id).toBe(2); // Last record should remain separate
  });

  it("should not merge records more than 15 minutes apart", () => {
    const now = Date.now();
    const activities: ActivityRecord[] = [
      {
        platform: "darwin",
        id: 1,
        title: "Test Window",
        ownerPath: "/test/path",
        ownerProcessId: 123,
        ownerName: "Test App",
        timestamp: now,
        count: 1,
      },
      {
        platform: "darwin",
        id: 1,
        title: "Test Window",
        ownerPath: "/test/path",
        ownerProcessId: 123,
        ownerName: "Test App",
        timestamp: now + 16 * 60 * 1000, // 16 minutes later
        count: 1,
      },
    ];

    const result = mergeActivityRecord(activities);

    expect(result).toHaveLength(2); // Should not merge due to time difference
    expect(result[0].count).toBe(1);
    expect(result[1].count).toBe(1);
  });

  it("should handle long array", () => {
    const activities = [
      {
        platform: "macos",
        id: 8657,
        title: "itracksy — ActivityStorage.ts",
        ownerPath: "/Applications/Windsurf.app",
        ownerProcessId: 56949,
        ownerBundleId: undefined,
        ownerName: "Windsurf",
        url: undefined,
        timestamp: 1735808205440,
        count: 21,
      },
      {
        platform: "macos",
        id: 8657,
        title: "itracksy — ActivityStorage.test.ts",
        ownerPath: "/Applications/Windsurf.app",
        ownerProcessId: 56949,
        ownerBundleId: undefined,
        ownerName: "Windsurf",
        url: undefined,
        timestamp: 1735808268555,
        count: 2,
      },
      {
        platform: "macos",
        id: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867449986,
        count: 4,
      },
      {
        platform: "macos",
        id: 18743,
        title: "itracksy — ActivityStorage.ts",
        ownerPath: "/Applications/Windsurf.app",
        ownerProcessId: 60395,
        ownerBundleId: undefined,
        ownerName: "Windsurf",
        url: undefined,
        timestamp: 1735867461984,
        count: 1,
      },
      {
        platform: "macos",
        id: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867464978,
        count: 14,
      },
      {
        platform: "macos",
        id: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867504024,
        count: 4,
      },
      {
        platform: "macos",
        id: 18795,
        title:
          "itracksy — npm start — main ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867513089,
        count: 1,
      },
      {
        platform: "macos",
        id: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867516084,
        count: 1,
      },
      {
        platform: "macos",
        id: 18795,
        title:
          "itracksy — npm start — main ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867519096,
        count: 1,
      },
      {
        platform: "macos",
        id: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867522075,
        count: 2,
      },
      {
        platform: "macos",
        id: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867528107,
        count: 2,
      },
      {
        platform: "macos",
        id: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867534101,
        count: 2,
      },
      {
        platform: "macos",
        id: 18795,
        title:
          "itracksy — npm start — Electron Helper (Renderer) ◂ npm start TERM_PROGRAM=Apple_Terminal SHELL=/bin/zsh — 80×24",
        ownerPath: "/System/Applications/Utilities/Terminal.app",
        ownerProcessId: 6294,
        ownerBundleId: undefined,
        ownerName: "Terminal",
        url: undefined,
        timestamp: 1735867537104,
        count: 1,
      },
    ];
    const count = activities.reduce((acc, activity) => acc + activity.count, 0);
    const result = mergeActivityRecord(activities);
    const countResult = result.reduce((acc, activity) => acc + activity.count, 0);
    expect(countResult).toBe(count);
    expect(result).toHaveLength(5);
  });
  it("should handle complex array", () => {
    const activities = [
      {
        count: 21,
        id: 8657,
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
        count: 2,
        id: 8657,
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
        count: 4,
        id: 18795,
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
        count: 1,
        id: 18743,
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
        count: 18,
        id: 18795,
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
        count: 1,
        id: 18795,
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
        count: 1,
        id: 18795,
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
        count: 1,
        id: 18795,
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
        count: 7,
        id: 18795,
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
    const count = activities.reduce((acc, activity) => acc + activity.count, 0);

    const countResult = result.reduce((acc, activity) => acc + activity.count, 0);
    expect(countResult).toBe(count);
    expect(result).toHaveLength(5);
  });
});
