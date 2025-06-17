// forge.config.ts - Configuration for Electron Forge build process

import type { ForgeConfig, ForgePackagerOptions } from "@electron-forge/shared-types";
import { readdirSync, rmdirSync, statSync } from "node:fs";
import path, { join, normalize } from "node:path";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDMG } from "@electron-forge/maker-dmg";
// Use flora-colossus for finding all dependencies of EXTERNAL_DEPENDENCIES
// flora-colossus is maintained by MarshallOfSound (a top electron-forge contributor)
// already included as a dependency of electron-packager/galactus (so we do NOT have to add it to package.json)
// grabs nested dependencies from tree
import { Walker, DepType, type Module } from "flora-colossus";
import VitePlugin from "@electron-forge/plugin-vite";
import FusesPlugin from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import MakerSquirrel from "@electron-forge/maker-squirrel";
import PublisherGithub from "@electron-forge/publisher-github";

// Track native module dependencies that need to be packaged
let nativeModuleDependenciesToPackage: string[] = [];

// List of external dependencies that require special handling during packaging
// base on this solution https://github.com/electron/forge/issues/3738
export const EXTERNAL_DEPENDENCIES = [
  "electron-squirrel-startup",
  "get-windows",
  "zod",
  "@libsql/client",
  "@libsql/darwin-x64",
  "drizzle-orm",
  "drizzle-zod",
  "date-fns",
];

// Base packager configuration
const packagerConfig: ForgePackagerOptions = {
  // The name of the executable
  executableName: "itracksy",
  // The name of the application
  name: "itracksy",
  // Path to the application icon
  icon: process.platform === "win32" ? "./resources/icon.ico" : "./resources/icon",
  // The bundle ID for the application
  appBundleId: "com.itracksy.app",
  // Define custom protocols for the application
  protocols: [
    {
      name: "iTracksy",
      schemes: ["itracksy"],
    },
  ],
  // Include additional resources in the final build
  extraResource: ["./resources"],
};

// Configure codesigning and notarization for macOS builds
if (process.env["NODE_ENV"] === "production") {
  packagerConfig.osxSign = {
    // Options for codesigning the application
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

// Main Electron Forge configuration
const config: ForgeConfig = {
  // Hooks for custom build steps
  hooks: {
    // Pre-package hook to gather native module dependencies
    prePackage: async () => {
      const projectRoot = normalize(__dirname);
      const getExternalNestedDependencies = async (
        nodeModuleNames: string[],
        includeNestedDeps = true
      ) => {
        const foundModules = new Set(nodeModuleNames);
        if (includeNestedDeps) {
          for (const external of nodeModuleNames) {
            type MyPublicClass<T> = {
              [P in keyof T]: T[P];
            };
            type MyPublicWalker = MyPublicClass<Walker> & {
              modules: Module[];
              walkDependenciesForModule: (moduleRoot: string, depType: DepType) => Promise<void>;
            };
            const moduleRoot = join(projectRoot, "node_modules", external);
            const walker = new Walker(moduleRoot) as unknown as MyPublicWalker;
            walker.modules = [];
            await walker.walkDependenciesForModule(moduleRoot, DepType.PROD);
            walker.modules
              .filter((dep) => (dep.nativeModuleType as number) === DepType.PROD)
              // for a package like '@realm/fetch', need to split the path and just take the first part
              .map((dep) => dep.name.split("/")[0])
              .forEach((name) => foundModules.add(name));
          }
        }
        return foundModules;
      };
      const nativeModuleDependencies = await getExternalNestedDependencies(EXTERNAL_DEPENDENCIES);
      nativeModuleDependenciesToPackage = Array.from(nativeModuleDependencies);
    },
    // Post-package hook to remove empty directories
    packageAfterPrune: async (_forgeConfig, buildPath) => {
      function getItemsFromFolder(
        path: string,
        totalCollection: {
          path: string;
          type: "directory" | "file";
          empty: boolean;
        }[] = []
      ) {
        try {
          const normalizedPath = normalize(path);
          const childItems = readdirSync(normalizedPath);
          const getItemStats = statSync(normalizedPath);
          if (getItemStats.isDirectory()) {
            totalCollection.push({
              path: normalizedPath,
              type: "directory",
              empty: childItems.length === 0,
            });
          }
          childItems.forEach((childItem) => {
            const childItemNormalizedPath = join(normalizedPath, childItem);
            const childItemStats = statSync(childItemNormalizedPath);
            if (childItemStats.isDirectory()) {
              getItemsFromFolder(childItemNormalizedPath, totalCollection);
            } else {
              totalCollection.push({
                path: childItemNormalizedPath,
                type: "file",
                empty: false,
              });
            }
          });
        } catch {
          return;
        }
        return totalCollection;
      }

      const getItems = getItemsFromFolder(buildPath) ?? [];
      for (const item of getItems) {
        const DELETE_EMPTY_DIRECTORIES = true;
        if (item.empty === true) {
          if (DELETE_EMPTY_DIRECTORIES) {
            const pathToDelete = normalize(item.path);
            // one last check to make sure it is a directory and is empty
            const stats = statSync(pathToDelete);
            if (!stats.isDirectory()) {
              // SKIPPING DELETION: pathToDelete is not a directory
              return;
            }
            const childItems = readdirSync(pathToDelete);
            if (childItems.length !== 0) {
              // SKIPPING DELETION: pathToDelete is not empty
              return;
            }
            rmdirSync(pathToDelete);
          }
        }
      }
    },
  },
  // Packager configuration
  packagerConfig: {
    ...packagerConfig,
    // Enable pruning of unnecessary files
    prune: true,
    // Unpack *.node files from the asar archive
    asar: { unpack: "*.node" },
    // Add drizzle folder to extraResource
    extraResource: ["./resources", "drizzle"],
    // Ignore files that match the following conditions
    ignore: (file) => {
      const filePath = file.toLowerCase();
      const KEEP_FILE = {
        keep: false,
        log: true,
      };
      // NOTE: must return false for empty string or nothing will be packaged
      if (filePath === "") KEEP_FILE.keep = true;
      if (!KEEP_FILE.keep && filePath === "/package.json") KEEP_FILE.keep = true;
      if (!KEEP_FILE.keep && filePath === "/node_modules") KEEP_FILE.keep = true;
      if (!KEEP_FILE.keep && filePath === "/.vite") KEEP_FILE.keep = true;
      if (!KEEP_FILE.keep && filePath.startsWith("/.vite/")) KEEP_FILE.keep = true;
      if (!KEEP_FILE.keep && filePath.startsWith("/node_modules/")) {
        // check if matches any of the external dependencies
        for (const dep of nativeModuleDependenciesToPackage) {
          if (filePath === `/node_modules/${dep}/` || filePath === `/node_modules/${dep}`) {
            KEEP_FILE.keep = true;
            break;
          }
          if (filePath === `/node_modules/${dep}/package.json`) {
            KEEP_FILE.keep = true;
            break;
          }
          if (filePath.startsWith(`/node_modules/${dep}/`)) {
            KEEP_FILE.keep = true;
            KEEP_FILE.log = false;
            break;
          }
        }
      }
      if (KEEP_FILE.keep) {
        if (KEEP_FILE.log) console.log("Keeping:", file);
        return false;
      }
      return true;
    },

    // if applicable, your other config / options / app info

    // Overwrite existing build files
    overwrite: true,

    // osxSign: {
    //   // if applicable, your codesigning configuration here
    // },

    // osxNotarize: {
    //   // if applicable, your notarization configuration here
    // },
  },
  // Rebuild configuration
  rebuildConfig: {},
  // Makers for different platforms
  makers: [
    new MakerSquirrel({
      setupIcon: path.resolve(__dirname, "resources", "icon.ico"),
      iconUrl: "https://raw.githubusercontent.com/hunght/itracksy/main/resources/icon.ico",
      loadingGif: path.resolve(__dirname, "resources", "icon_64x64.png"),
    }),
    new MakerDMG({
      icon: path.resolve(__dirname, "resources", "icon.icns"),
    }),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  // Publishers for different platforms
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "hunght",
        name: "itracksy",
      },
      prerelease: false,
      draft: true,
    }),
  ],
  // Plugins for custom build steps
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
        {
          entry: "src/preload/notification.ts",
          config: "vite.notification-preload.config.ts",
        },
        {
          entry: "src/preload/blocking-notification.ts",
          config: "vite.blocking-notification-preload.config.ts",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
        {
          name: "notification_window",
          config: "vite.notification.config.ts",
        },
        {
          name: "blocking_notification_window",
          config: "vite.blocking-notification.config.ts",
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
