# Multi-Platform Auto-Update System

## Overview

iTracksy now supports automatic updates across all major platforms:

- **macOS** (Intel x64 & Apple Silicon ARM64)
- **Windows** (x64)
- **Linux** (x64 - AppImage, DEB, RPM)

This system uses GitHub Actions to automatically build and release for all platforms, ensuring every user receives updates regardless of their operating system.

## How It Works

### 1. Automated Build Process

```
Git Tag Push → GitHub Actions → Multi-Platform Builds → GitHub Release → Auto-Updates
```

### 2. Platform Support Matrix

| Platform | Architecture          | Format               | Auto-Update |
| -------- | --------------------- | -------------------- | ----------- |
| macOS    | ARM64 (Apple Silicon) | DMG + ZIP            | ✅          |
| macOS    | x64 (Intel)           | DMG + ZIP            | ✅          |
| Windows  | x64                   | EXE + ZIP            | ✅          |
| Linux    | x64                   | AppImage + DEB + RPM | ✅          |

## Setup Instructions

### 1. GitHub Actions Workflow

The workflow file `.github/workflows/release.yml` automatically:

- Builds for all platforms when a version tag is pushed
- Creates GitHub releases with all platform artifacts
- Enables auto-updates for all users

### 2. Forge Configuration

Updated `forge.config.ts` includes makers for all platforms:

- `MakerSquirrel` - Windows installer
- `MakerZIP` - Portable versions for all platforms
- `MakerDMG` - macOS installer
- `MakerRpm` - Linux RPM packages
- `MakerDeb` - Linux DEB packages

## Release Process

### Option 1: Automated Multi-Platform Release (Recommended)

```bash
# This will trigger builds for ALL platforms
npm run release:multi
```

**What happens:**

1. Creates version tag
2. Pushes to GitHub
3. Triggers GitHub Actions workflow
4. Builds for all platforms simultaneously
5. Creates release with all artifacts
6. Enables auto-updates for all users

### Option 2: Manual Single-Platform Build

```bash
# Build for current platform only
npm run make

# Build for specific platform/architecture
npm run make -- --platform win32 --arch x64
npm run make -- --platform darwin --arch arm64
npm run make -- --platform linux --arch x64
```

## GitHub Actions Workflow

### Trigger Conditions

- **Automatic**: Push of version tag (e.g., `v1.0.203`)
- **Manual**: Workflow dispatch with custom version

### Build Matrix

```yaml
matrix:
  os: [macos-latest, windows-latest, ubuntu-latest]
  include:
    - os: macos-latest
      platform: darwin
      arch: x64
      target: x64
    - os: macos-latest
      platform: darwin
      arch: arm64
      target: arm64
    - os: windows-latest
      platform: win32
      arch: x64
      target: x64
    - os: ubuntu-latest
      platform: linux
      arch: x64
      target: x64
```

### Artifacts Generated

Each platform generates multiple formats:

**macOS:**

- `itracksy-{version}-arm64.dmg` (Apple Silicon)
- `itracksy-{version}-x64.dmg` (Intel)
- `itracksy-{version}-darwin-x64.zip` (Portable)

**Windows:**

- `itracksy Setup {version}.exe` (Installer)
- `itracksy-{version}-win32-x64.zip` (Portable)

**Linux:**

- `itracksy-{version}-1.x86_64.rpm` (RPM package)
- `itracksy-{version}_amd64.deb` (DEB package)
- `itracksy-{version}-linux-x64.zip` (Portable)

## Auto-Update Configuration

### Main Process Integration

```typescript
// src/main.ts
import { updateElectronApp } from "update-electron-app";

app.whenReady().then(async () => {
  // Initialize auto-update functionality
  updateElectronApp({
    logger: require("electron-log"),
    updateInterval: "1 day", // Check for updates every 24 hours
  });

  // ... rest of app initialization
});
```

### Update Sources

- **Primary**: [update.electronjs.org](https://update.electronjs.org) (free service)
- **Fallback**: Direct GitHub releases
- **Platform Detection**: Automatically selects correct binary for user's platform

## User Experience

### Update Flow

1. **Background Check**: App checks for updates every 24 hours
2. **Download**: Updates download silently in background
3. **Notification**: User informed when update is ready
4. **Installation**: Update installs on next app restart

### Platform-Specific Behavior

**macOS:**

- Requires code signing for auto-updates
- Updates install automatically on restart
- Gatekeeper compatibility maintained

**Windows:**

- Squirrel installer handles updates
- Creates shortcuts and registry entries
- Silent installation supported

**Linux:**

- Package manager integration (RPM/DEB)
- Portable AppImage updates
- System integration maintained

## Monitoring and Troubleshooting

### GitHub Actions Monitoring

```bash
# Check workflow status
open https://github.com/hunght/itracksy/actions

# View specific release
open https://github.com/hunght/itracksy/releases
```

### Build Logs

Each platform build generates detailed logs:

- **macOS**: ARM64 and x64 builds run in parallel
- **Windows**: x64 build with Squirrel installer
- **Linux**: Multiple package formats in single build

### Common Issues

#### 1. Build Failures

**Symptoms**: GitHub Actions workflow fails
**Solutions**:

- Check build logs for specific errors
- Verify platform-specific dependencies
- Ensure all required tools are available

#### 2. Auto-Update Issues

**Symptoms**: Users don't receive updates
**Solutions**:

- Verify GitHub release contains all platform artifacts
- Check update.electronjs.org compatibility
- Review app code signing status

#### 3. Platform-Specific Problems

**macOS**: Code signing and notarization
**Windows**: Squirrel installer configuration
**Linux**: Package manager dependencies

## Best Practices

### 1. Version Management

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Tag releases with `v{version}` format
- Keep changelog updated

### 2. Release Process

- Test builds locally before tagging
- Use `npm run release:multi` for production releases
- Monitor GitHub Actions for build success

### 3. Quality Assurance

- Test auto-updates on all platforms
- Verify installer functionality
- Check update delivery to users

### 4. Security

- Code sign all macOS builds
- Verify Windows installer signatures
- Maintain Linux package integrity

## Scripts and Commands

### Release Scripts

```bash
# Multi-platform release (recommended)
npm run release:multi

# Single platform build
npm run make

# Platform-specific builds
npm run make -- --platform win32 --arch x64
npm run make -- --platform darwin --arch arm64
npm run make -- --platform linux --arch x64
```

### Testing Commands

```bash
# Test auto-update configuration
node scripts/test-auto-update.js

# Test permissions
node scripts/test-permissions.js

# Test scheduling monitoring
node scripts/test-scheduling-monitoring.js
```

## Configuration Files

### Key Files

- `.github/workflows/release.yml` - GitHub Actions workflow
- `forge.config.ts` - Electron Forge configuration
- `package.json` - Scripts and dependencies
- `scripts/release-multi-platform.sh` - Release automation

### Environment Variables

```bash
# Required for macOS builds
APPLE_ID=your_apple_id
APPLE_ID_PASSWORD=your_app_specific_password
APPLE_TEAM_ID=your_team_id

# GitHub token (automatically provided by GitHub Actions)
GITHUB_TOKEN=github_pat_...
```

## Future Enhancements

### Planned Features

- **Universal Binaries**: Single package for multiple architectures
- **Delta Updates**: Smaller update packages
- **Rollback Support**: Automatic rollback on update failure
- **Update Channels**: Beta/stable release channels

### Platform Expansion

- **Windows ARM64**: Support for Windows on ARM
- **Linux ARM64**: Support for ARM-based Linux systems
- **BSD Support**: FreeBSD and other BSD variants

## Support and Resources

### Documentation

- [Electron Forge Auto-Update](https://www.electronforge.io/advanced/auto-update)
- [update-electron-app](https://github.com/electron/update-electron-app)
- [GitHub Actions](https://docs.github.com/en/actions)

### Community

- [Electron Forge Discord](https://discord.gg/electron-forge)
- [Electron GitHub Discussions](https://github.com/electron/electron/discussions)

---

**Note**: This multi-platform auto-update system ensures that all iTracksy users receive updates automatically, regardless of their operating system or architecture. The system is designed to be robust, secure, and user-friendly across all supported platforms.
