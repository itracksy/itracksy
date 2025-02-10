import path from "path";
import fs from "fs";
import { spawn } from "child_process";

export const getPythonPath = (platform: string): string => {
  if (process.env.PYTHON_PATH) return process.env.PYTHON_PATH;
  if (process.env.PYTHON) return process.env.PYTHON;

  switch (platform) {
    case "darwin":
      return "/usr/bin/python3";
    case "win32":
      return "python.exe";
    default:
      return "python3";
  }
};

export const installBetterSqlite3 = async (
  buildPath: string,
  electronVersion: string,
  platform: string
): Promise<void> => {
  const commands = ["install", "--no-package-lock", "--no-save", "better-sqlite3"];

  return new Promise<void>((resolve, reject) => {
    try {
      // Backup package.json
      const oldPckgJson = path.join(buildPath, "package.json");
      const newPckgJson = path.join(buildPath, "_package.json");
      fs.renameSync(oldPckgJson, newPckgJson);

      const pythonPath = getPythonPath(platform);
      console.log(`Using Python path: ${pythonPath}`);
      console.log(`Installing better-sqlite3 for Electron ${electronVersion}...`);

      const npmInstall = spawn("npm", commands, {
        cwd: buildPath,
        stdio: "inherit",
        shell: true,
        env: {
          ...process.env,
          npm_config_python: pythonPath,
        },
      });

      npmInstall.on("close", (code) => {
        if (code === 0) {
          console.log("better-sqlite3 installed successfully, rebuilding with node-gyp...");

          // Get the actual Electron version or fallback to the provided one
          const targetVersion = electronVersion || "33.2.0";

          // Rebuild better-sqlite3 using node-gyp
          const nodeGyp = spawn(
            "node-gyp",
            [
              "rebuild",
              `--target=${targetVersion}`,
              `--arch=${process.arch}`,
              "--dist-url=https://electronjs.org/headers",
            ],
            {
              cwd: path.join(buildPath, "node_modules", "better-sqlite3"),
              stdio: "inherit",
              shell: true,
              env: {
                ...process.env,
                npm_config_target: targetVersion,
                npm_config_arch: process.arch,
                npm_config_target_arch: process.arch,
                npm_config_disturl: "https://electronjs.org/headers",
                npm_config_runtime: "electron",
                npm_config_build_from_source: "true",
                npm_config_python: pythonPath,
              },
            }
          );

          nodeGyp.on("close", (rebuildCode) => {
            if (rebuildCode === 0) {
              console.log("node-gyp rebuild completed successfully");
              fs.renameSync(newPckgJson, oldPckgJson);

              // Clean up platform-specific binaries
              if (platform === "win32") {
                const problematicPaths = [
                  "android-arm",
                  "android-arm64",
                  "darwin-x64+arm64",
                  "linux-arm",
                  "linux-arm64",
                  "linux-x64",
                ];

                console.log("Cleaning up unnecessary platform binaries...");
                problematicPaths.forEach((binaryFolder) => {
                  const folderPath = path.join(
                    buildPath,
                    "node_modules",
                    "better-sqlite3",
                    "bindings-cpp",
                    "prebuilds",
                    binaryFolder
                  );

                  if (fs.existsSync(folderPath)) {
                    fs.rmSync(folderPath, { recursive: true, force: true });
                  }
                });
              }

              resolve();
            } else {
              fs.renameSync(newPckgJson, oldPckgJson);
              reject(new Error(`node-gyp rebuild failed with code ${rebuildCode}`));
            }
          });

          nodeGyp.on("error", (error) => {
            fs.renameSync(newPckgJson, oldPckgJson);
            reject(new Error(`node-gyp error: ${error.message}`));
          });
        } else {
          fs.renameSync(newPckgJson, oldPckgJson);
          reject(new Error(`npm install failed with code ${code}`));
        }
      });

      npmInstall.on("error", (error) => {
        fs.renameSync(newPckgJson, oldPckgJson);
        reject(new Error(`npm install error: ${error.message}`));
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        reject(new Error(`General error: ${error.message}`));
      } else {
        reject(new Error("An unknown error occurred"));
      }
    }
  });
};
