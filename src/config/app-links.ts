// Configuration file for application download links and version information

// Function to build download URLs based on a version
export const buildAppLinks = (version: string) => ({
  // Main platform download links
  windows: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy-${version}.Setup.exe`,
  macos: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy-${version}-arm64.dmg`,
  linux: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy_${version}_amd64.deb`,

  // Additional links
  releases: `https://github.com/itracksy/itracksy/releases`,

  // You can add other platform-specific links if needed
  macosIntel: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy-${version}-x64.dmg`,
  linuxRpm: `https://github.com/itracksy/itracksy/releases/download/v${version}/itracksy-${version}-1.x86_64.rpm`,
});
