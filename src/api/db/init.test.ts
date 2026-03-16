import path from "path";
import { resolveMigrationsPath } from "./init";

describe("resolveMigrationsPath", () => {
  test("falls back to the workspace drizzle folder in development builds", () => {
    const fileExists = jest.fn((targetPath: string) => {
      return targetPath === path.join("/workspace/project/drizzle", "meta", "_journal.json");
    });

    const result = resolveMigrationsPath({
      appPath: "/workspace/project/.vite/build",
      cwd: "/workspace/project",
      isPackaged: false,
      resourcesPath: "/Applications/iTracksy.app/Contents/Resources",
      fileExists,
    });

    expect(result).toBe("/workspace/project/drizzle");
  });

  test("prefers the packaged resources folder when the journal exists there", () => {
    const fileExists = jest.fn((targetPath: string) => {
      return (
        targetPath ===
        path.join("/Applications/iTracksy.app/Contents/Resources/drizzle", "meta", "_journal.json")
      );
    });

    const result = resolveMigrationsPath({
      appPath: "/Applications/iTracksy.app/Contents/Resources/app.asar",
      cwd: "/tmp",
      isPackaged: true,
      resourcesPath: "/Applications/iTracksy.app/Contents/Resources",
      fileExists,
    });

    expect(result).toBe("/Applications/iTracksy.app/Contents/Resources/drizzle");
  });
});
