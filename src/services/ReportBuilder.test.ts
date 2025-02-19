import { calculateDurationsReport } from "./ReportBuilder";
import { ActivityRecord } from "@/types/activity";

describe("calculateDurationsReport", () => {
  const baseTimestamp = 1737594549687; // 2023-01-01 00:00:00

  const createMockRecord = ({
    timestamp,
    ownerName,
    url = "",
    title = "",
    platform = "windows",
    count = 1,
  }: {
    timestamp: number;
    ownerName: string;
    url?: string;
    title?: string;
    platform?: string;
    count?: number;
  }): ActivityRecord => ({
    activityId: timestamp,
    ownerPath: `/path/to/${ownerName}`,
    ownerProcessId: Math.floor(Math.random() * 1000),
    timestamp,
    ownerName,
    url,
    title,
    platform,
    duration: count,
  });

  test("should calculate application durations correctly", () => {
    const records: ActivityRecord[] = [
      createMockRecord({ timestamp: baseTimestamp, ownerName: "VSCode" }),
      createMockRecord({ timestamp: baseTimestamp + 1000, ownerName: "VSCode" }),
      createMockRecord({ timestamp: baseTimestamp + 2000, ownerName: "Chrome" }),
    ];

    const result = calculateDurationsReport(records);

    expect(result.applications).toHaveLength(2);
    expect(result.applications[0].applicationName).toBe("VSCode");
    expect(result.applications[0].instances).toHaveLength(1);
    expect(result.applications[0].percentage).toBeGreaterThan(0);
  });

  test("should calculate domain complex durations correctly", () => {
    const records: ActivityRecord[] = [
      {
        platform: "windows",
        activityId: 66440,
        title: "Windows Default Lock Screen",
        ownerPath: "C:\\Windows\\SystemApps\\Microsoft.LockApp_cw5n1h2txyewy\\LockApp.exe",
        ownerProcessId: 9848,
        ownerName: "LockApp.exe",
        timestamp: 1737594549687,
        duration: 3,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "ReportBuilder.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737594557548,
        duration: 5,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "ActivityStorage.test.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737594574449,
        duration: 1,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "ActivityStorage.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737594577452,
        duration: 12,
      },
      {
        platform: "windows",
        activityId: 1114292,
        title: "Google Chrome",
        ownerPath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        ownerProcessId: 8100,
        ownerName: "Google Chrome",
        timestamp: 1737595590043,
        duration: 2,
      },
      {
        platform: "windows",
        activityId: 1312250,
        title: "iTracksy",
        ownerPath: "C:\\Users\\hung\\itracksy\\node_modules\\electron\\dist\\electron.exe",
        ownerProcessId: 9264,
        ownerName: "Electron",
        timestamp: 1737595593063,
        duration: 5,
      },
      {
        platform: "windows",
        activityId: 1181454,
        title: "Developer Tools - http://localhost:5173/",
        ownerPath: "C:\\Users\\hung\\itracksy\\node_modules\\electron\\dist\\electron.exe",
        ownerProcessId: 9264,
        ownerName: "Electron",
        timestamp: 1737595596094,
        duration: 32,
      },
      {
        platform: "windows",
        activityId: 852966,
        title: "youtube.com/feed/subscriptions - Google Chrome",
        ownerPath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        ownerProcessId: 8100,
        ownerName: "Google Chrome",
        timestamp: 1737595602093,
        duration: 1,
      },
      {
        platform: "windows",
        activityId: 852966,
        title: "Subscriptions - YouTube - Google Chrome",
        ownerPath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        ownerProcessId: 8100,
        ownerName: "Google Chrome",
        url: "YouTube",
        timestamp: 1737595605101,
        duration: 1,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "window-listeners.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737595611103,
        duration: 2,
      },
      {
        platform: "windows",
        activityId: 852966,
        title: "New Tab - Google Chrome",
        ownerPath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        ownerProcessId: 8100,
        ownerName: "Google Chrome",
        timestamp: 1737595617120,
        duration: 3,
      },
      {
        platform: "windows",
        activityId: 852966,
        title: "Sign up | Miro | The Visual Workspace for Innovation - Google Chrome",
        ownerPath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        ownerProcessId: 8100,
        ownerName: "Google Chrome",
        timestamp: 1737595623137,
        duration: 12,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "helper.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737595731448,
        duration: 17,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "window-listerners.test.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737595773558,
        duration: 14,
      },
      {
        platform: "windows",
        activityId: 852966,
        title: "(80) Subscriptions - YouTube - Google Chrome",
        ownerPath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        ownerProcessId: 8100,
        ownerName: "Google Chrome",
        url: "youtube.com",
        timestamp: 1737596488761,
        duration: 3,
      },
      {
        platform: "windows",
        activityId: 852966,
        title: "GitHub - Google Chrome",
        ownerPath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        ownerProcessId: 8100,
        ownerName: "Google Chrome",
        timestamp: 1737596512793,
        duration: 6,
      },
      {
        platform: "windows",
        activityId: 852966,
        title: "Sign up | Miro | The Visual Workspace for Innovation - Google Chrome",
        ownerPath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        ownerProcessId: 8100,
        ownerName: "Google Chrome",
        url: "miro.com",
        timestamp: 1737596524836,
        duration: 8,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "● helper.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737596551896,
        duration: 2,
      },
      {
        platform: "windows",
        activityId: 2164350,
        title: "iTracksy",
        ownerPath: "C:\\Users\\hung\\itracksy\\node_modules\\electron\\dist\\electron.exe",
        ownerProcessId: 2932,
        ownerName: "Electron",
        timestamp: 1737596583014,
        duration: 6,
      },
      {
        platform: "windows",
        activityId: 1574328,
        title: "Developer Tools - http://localhost:5173/",
        ownerPath: "C:\\Users\\hung\\itracksy\\node_modules\\electron\\dist\\electron.exe",
        ownerProcessId: 2932,
        ownerName: "Electron",
        timestamp: 1737596606931,
        duration: 7,
      },
      {
        platform: "windows",
        activityId: 65906,
        title: "Program Manager",
        ownerPath: "C:\\Windows\\explorer.exe",
        ownerProcessId: 6292,
        ownerName: "Windows Explorer",
        timestamp: 1737596637034,
        duration: 1,
      },
      {
        platform: "windows",
        activityId: 394852,
        title:
          "window-listerners.test.ts (Untracked) (window-listerners.test.ts) - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737596643042,
        duration: 5,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "ActivityStorage.test.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737596664098,
        duration: 2,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "jest.config.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737596673134,
        duration: 1,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "window-listeners.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737596676144,
        duration: 1,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "helper.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737596679144,
        duration: 3,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "ReportBuilder.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737596688171,
        duration: 53,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "● ReportBuilder.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737596748386,
        duration: 3,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "ReportBuilder.test.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737596856712,
        duration: 61,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "● ReportBuilder.test.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737596913910,
        duration: 7,
      },
      {
        platform: "windows",
        activityId: 394852,
        title: "ReportBuilder.test.ts - itracksy - Visual Studio Code",
        ownerPath: "C:\\Users\\hung\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        ownerProcessId: 9548,
        ownerName: "Visual Studio Code",
        timestamp: 1737597564261,
        duration: 1,
      },
    ];

    const result = calculateDurationsReport(records);

    expect(result.domains).toHaveLength(3);
  });
  test("should calculate domain durations correctly", () => {
    const records: ActivityRecord[] = [
      createMockRecord({
        timestamp: baseTimestamp,
        ownerName: "Chrome",
        url: "https://github.com",
      }),
      createMockRecord({
        timestamp: baseTimestamp + 1000,
        ownerName: "Chrome",
        url: "https://github.com",
      }),
      createMockRecord({
        timestamp: baseTimestamp + 2000,
        ownerName: "Chrome",
        url: "https://google.com",
      }),
    ];

    const timeWindow = {
      start: baseTimestamp,
      end: baseTimestamp + 3000,
    };

    const result = calculateDurationsReport(records);

    expect(result.domains).toHaveLength(2);
    expect(result.domains[0].domain).toBe("https://github.com");
    expect(result.domains[0].instances).toHaveLength(1);
  });

  test("should calculate title durations correctly", () => {
    const records: ActivityRecord[] = [
      createMockRecord({
        timestamp: baseTimestamp,
        ownerName: "Notepad",
        url: "",
        title: "Document1",
      }),
      createMockRecord({
        timestamp: baseTimestamp + 1000,
        ownerName: "Notepad",
        url: "",
        title: "Document1",
      }),
      createMockRecord({
        timestamp: baseTimestamp + 2000,
        ownerName: "Notepad",
        url: "",
        title: "Document2",
      }),
    ];

    const timeWindow = {
      start: baseTimestamp,
      end: baseTimestamp + 3000,
    };

    const result = calculateDurationsReport(records);

    expect(result.titles).toHaveLength(2);
    expect(result.titles[0].title).toBe("Document1");
    expect(result.titles[0].instances).toHaveLength(1);
  });

  test("should respect time window boundaries", () => {
    const records: ActivityRecord[] = [
      createMockRecord({ timestamp: baseTimestamp - 1000, ownerName: "VSCode" }),
      createMockRecord({ timestamp: baseTimestamp, ownerName: "VSCode" }),
      createMockRecord({ timestamp: baseTimestamp + 1000, ownerName: "VSCode" }),
    ];

    const timeWindow = {
      start: baseTimestamp,
      end: baseTimestamp + 500,
    };

    const result = calculateDurationsReport(records);

    expect(result.applications).toHaveLength(1);
    expect(result.applications[0].instances).toHaveLength(1);
  });

  test("should handle empty records array", () => {
    const records: ActivityRecord[] = [];
    const timeWindow = {
      start: baseTimestamp,
      end: baseTimestamp + 1000,
    };

    const result = calculateDurationsReport(records);

    expect(result.applications).toHaveLength(0);
    expect(result.domains).toHaveLength(0);
    expect(result.titles).toHaveLength(0);
  });

  test("should respect MAX_ITEMS_PER_REPORT limit", () => {
    const records: ActivityRecord[] = Array.from({ length: 10 }, (_, i) =>
      createMockRecord({ timestamp: baseTimestamp + i * 1000, ownerName: `App${i}` })
    );

    const timeWindow = {
      start: baseTimestamp,
      end: baseTimestamp + 10000,
    };

    const result = calculateDurationsReport(records);

    expect(result.applications.length).toBeLessThanOrEqual(7);
  });

  test("should calculate percentages correctly", () => {
    const records: ActivityRecord[] = [
      createMockRecord({ timestamp: baseTimestamp, ownerName: "App1" }),
      createMockRecord({ timestamp: baseTimestamp + 1000, ownerName: "App1" }),
      createMockRecord({ timestamp: baseTimestamp + 2000, ownerName: "App2" }),
    ];

    const timeWindow = {
      start: baseTimestamp,
      end: baseTimestamp + 3000,
    };

    const result = calculateDurationsReport(records);

    const totalPercentage = result.applications.reduce((sum, app) => sum + app.percentage, 0);
    expect(Math.round(totalPercentage)).toBe(100);
  });
});
