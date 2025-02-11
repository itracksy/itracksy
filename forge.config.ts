import type { ForgeConfig, ForgePackagerOptions } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import path from "path";
import fs from "fs";
import { spawn, spawnSync } from "child_process";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { PublisherGithub } from "@electron-forge/publisher-github";

const packagerConfig: ForgePackagerOptions = {
  executableName: "itracksy",
  name: "itracksy",
  asar: true,
  icon: "./resources/icon",
  appBundleId: "com.itracksy.app",
  protocols: [
    {
      name: "iTracksy",
      schemes: ["itracksy"],
    },
  ],
  extraResource: ["data"],
};
if (process.env["NODE_ENV"] !== "development") {
  packagerConfig.osxSign = {
    optionsForFile: (filePath: string) => ({
      app: "com.itracksy.app",
      entitlements: path.join(__dirname, "entitlements.plist"),
      "entitlements-inherit": path.join(__dirname, "entitlements.plist"),
      hardenedRuntime: true,
      "gatekeeper-assess": false,
    }),
  };
  packagerConfig.osxNotarize = {
    //@ts-ignore
    tool: "notarytool",
    appleId: process.env.APPLE_ID || "",
    appleIdPassword: process.env.APPLE_ID_PASSWORD || "",
    teamId: process.env.APPLE_TEAM_ID || "",
  };
}
const config: ForgeConfig = {
  packagerConfig: packagerConfig,
  makers: [new MakerSquirrel({}), new MakerDMG({}), new MakerRpm({}), new MakerDeb({})],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "hunght",
        name: "itracksy",
      },
      prerelease: false,
      draft: false,
    }),
  ],
  hooks: {
    packageAfterPrune: async (_, buildPath, __, platform) => {
      console.log("=== Starting packageAfterPrune ===");
      console.log("Build Path:", buildPath);
      console.log("Platform:", platform);

      // build better-sqlite3

      const commands = [
        "install",
        "--no-package-lock",
        "--no-save",
        "--verbose",
        "better-sqlite3@^11.8.1",
        platform === "win32" ? "get-windows@^9.2.0" : "",
      ];

      console.log("Running npm command:", commands.join(" "));

      // Get Python path based on platform
      const getPythonPath = () => {
        if (process.env.PYTHON_PATH) return process.env.PYTHON_PATH;
        if (platform === "darwin") return "/usr/bin/python3";
        if (platform === "win32") return "python";
        return "python3";
      };

      const oldPckgJson = path.join(buildPath, "package.json");
      const newPckgJson = path.join(buildPath, "_package.json");

      fs.renameSync(oldPckgJson, newPckgJson);

      const pythonPath = getPythonPath();
      console.log(`Using Python path: ${pythonPath}`);

      // Run npm install synchronously
      const npmInstall = spawnSync("npm", commands, {
        cwd: buildPath,
        stdio: "inherit",
        shell: true,
        env: {
          ...process.env,
          npm_config_python: pythonPath,
        },
      });

      console.log("npm install exit code:", npmInstall.status);
      if (npmInstall.error) {
        console.error("npm install error:", npmInstall.error);
      }

      if (npmInstall.status !== 0) {
        throw new Error("npm install process finished with error code " + npmInstall.status);
      }

      // Rebuild better-sqlite3 using node-gyp synchronously
      const nodeGyp = spawnSync(
        "node-gyp",
        [
          "rebuild",
          "--target=33.2.0",
          "--arch=" + process.arch,
          "--dist-url=https://electronjs.org/headers",
        ],
        {
          cwd: path.join(buildPath, "node_modules", "better-sqlite3"),
          stdio: "inherit",
          shell: true,
          env: {
            ...process.env,
            npm_config_target: "33.2.0",
            npm_config_arch: process.arch,
            npm_config_target_arch: process.arch,
            npm_config_disturl: "https://electronjs.org/headers",
            npm_config_runtime: "electron",
            npm_config_build_from_source: "true",
            npm_config_python: pythonPath,
          },
        }
      );

      if (nodeGyp.status !== 0) {
        throw new Error(`node-gyp rebuild failed with code ${nodeGyp.status}`);
      }

      fs.renameSync(newPckgJson, oldPckgJson);

      /**
       * On windows code signing fails for ARM binaries etc.,
       * we remove them here
       */
      if (platform === "win32") {
        const problematicPaths = [
          "android-arm",
          "android-arm64",
          "darwin-x64+arm64",
          "linux-arm",
          "linux-arm64",
          "linux-x64",
        ];

        problematicPaths.forEach((binaryFolder) => {
          fs.rmSync(
            path.join(
              buildPath,
              "node_modules",
              "better-sqlite3",
              "bindings-cpp",
              "prebuilds",
              binaryFolder
            ),
            { recursive: true, force: true }
          );
        });
      }
      return;
    },
  },
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "src/main.ts",
          config: "vite.main.config.ts",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
