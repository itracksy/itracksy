// Configuration file for application download links and version information

// Function to build download URLs based on a version
export const buildAppLinks = (version: string) => ({
  // Main platform download links (for manual downloads)
  windows: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy-${version}.Setup.exe`,
  macos: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy-${version}-arm64.dmg`,
  linux: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy_${version}_amd64.deb`,

  // Auto-update ZIP file links (for automatic updates)
  // Note: These patterns match Electron Forge's actual ZIP naming convention
  // Pattern: itracksy-{platform}-{arch}-{version}.zip
  windowsZip: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy-win32-x64-${version}.zip`,
  macosZip: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy-darwin-arm64-${version}.zip`,
  macosIntelZip: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy-darwin-x64-${version}.zip`,
  linuxZip: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy-linux-x64-${version}.zip`,

  // Additional links
  releases: `https://github.com/itracksy/itracksy/releases`,

  // You can add other platform-specific links if needed
  macosIntel: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy-${version}-x64.dmg`,
  linuxRpm: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy-${version}-1.x86_64.rpm`,
});
