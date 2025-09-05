# Auto-Update System Documentation

## Overview

iTracksy uses the [update-electron-app](https://github.com/electron/update-electron-app) module to provide automatic updates to users. This system leverages the free [update.electronjs.org](https://update.electronjs.org) service, which is perfect for open-source projects hosted on GitHub.

## How It Works

### 1. Update Flow

```
User's App → Checks for updates every 24 hours → update.electronjs.org → GitHub Releases → Downloads & Installs
```

### 2. Update Sources

- **Primary**: [update.electronjs.org](https://update.electronjs.org) (free service for open-source apps)
- **Fallback**: Direct GitHub releases (if configured)

### 3. Update Frequency

- **Development**: Updates are disabled (prevents interference during development)
- **Production**: Checks every 24 hours for new versions

## Configuration

### Required Packages

```json
{
  "dependencies": {
    "update-electron-app": "^2.0.0",
    "electron-log": "^5.0.0"
  }
}
```

### Package.json Configuration

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/hunght/itracksy.git"
  }
}
```

### Forge Configuration

```typescript
// forge.config.ts
import { PublisherGithub } from "@electron-forge/publisher-github";

export default {
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
};
```

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

## Features

### ✅ What's Included

- **Automatic Update Checks**: Every 24 hours in production
- **Silent Downloads**: Updates download in background
- **User Notifications**: Informs users when updates are ready
- **Automatic Installation**: Installs updates on app restart
- **Logging**: Comprehensive logging via electron-log
- **Error Handling**: Graceful fallback if updates fail

### 🔒 Security Features

- **Code Signing Required**: macOS requires signed apps for auto-updates
- **HTTPS Only**: All update communications use secure connections
- **GitHub Verification**: Updates are verified against GitHub releases

## Development vs Production

### Development Mode

- Auto-updates are **disabled**
- Prevents interference with development workflow
- Logs show: `"update-electron-app config looks good; aborting updates since app is in development mode"`

### Production Mode

- Auto-updates are **enabled**
- Checks for updates every 24 hours
- Downloads and installs updates automatically

## Testing

### Test Script

Run the auto-update configuration test:

```bash
node scripts/test-auto-update.js
```

Expected output:

```
🔍 Testing Auto-Update Configuration...

✅ update-electron-app package is installed
✅ electron-log package is installed
✅ Repository field is configured in package.json
✅ GitHub publisher is configured in forge.config.ts
✅ Repository owner/name is correctly configured

📋 Auto-Update Configuration Summary:
   • update-electron-app: ✅ Installed
   • electron-log: ✅ Installed
   • Repository: ✅ Configured
   • GitHub Publisher: ✅ Configured
   • Main Process: ✅ Auto-update code added

🚀 Your app is ready for auto-updates!
```

### Manual Testing

1. **Build the app**: `npm run make`
2. **Publish to GitHub**: `npm run publish`
3. **Create a release** with higher version number
4. **Test update flow** in production build

## Deployment Workflow

### 1. Version Management

```bash
# Update version in package.json
npm version patch  # 1.0.200 → 1.0.201
npm version minor  # 1.0.200 → 1.1.0
npm version major  # 1.0.200 → 2.0.0
```

### 2. Build and Publish

```bash
# Build the application
npm run make

# Publish to GitHub
npm run publish
```

### 3. Create GitHub Release

- Go to GitHub repository
- Create new release with the version tag
- Upload built artifacts (DMG, EXE, etc.)
- Publish the release

### 4. Auto-Update Delivery

- Users receive updates automatically
- Updates are downloaded in background
- Installation happens on next app restart

## Troubleshooting

### Common Issues

#### 1. Updates Not Working

**Symptoms**: App doesn't update automatically
**Solutions**:

- Verify app is code-signed (required for macOS)
- Check GitHub repository configuration
- Ensure GitHub releases contain correct artifacts
- Verify network connectivity to update.electronjs.org

#### 2. Update Errors in Logs

**Check electron-log files**:

```bash
# macOS
~/Library/Logs/itracksy/main.log

# Windows
%USERPROFILE%\AppData\Roaming\itracksy\logs\main.log

# Linux
~/.config/itracksy/logs/main.log
```

#### 3. Development Mode Updates

**Symptom**: Updates disabled in development
**Solution**: This is expected behavior. Updates only work in production builds.

### Debug Mode

Enable debug logging for update issues:

```typescript
updateElectronApp({
  logger: require("electron-log"),
  updateInterval: "1 day",
  debug: true, // Enable debug mode
});
```

## Configuration Options

### updateElectronApp Options

```typescript
updateElectronApp({
  // Logging
  logger: require("electron-log"),

  // Update frequency
  updateInterval: "1 day", // or "1 hour", "1 week"

  // Debug mode
  debug: process.env.NODE_ENV === "development",

  // Custom update source
  updateSource: {
    type: "github",
    owner: "hunght",
    repo: "itracksy",
  },

  // Notify user about updates
  notifyUser: true,

  // Auto download updates
  autoDownload: true,

  // Auto install updates
  autoInstallOnAppQuit: true,
});
```

### Environment Variables

```bash
# GitHub token for private repositories
GITHUB_TOKEN=your_github_token

# Custom update server
UPDATE_SERVER=https://your-update-server.com
```

## Best Practices

### 1. Version Management

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Increment version before each release
- Tag releases in Git with version numbers

### 2. Release Process

- Test builds thoroughly before release
- Create comprehensive release notes
- Include all platform builds in releases
- Verify auto-update functionality

### 3. User Experience

- Notify users about available updates
- Provide clear update instructions
- Handle update failures gracefully
- Log all update activities

### 4. Security

- Always code-sign your applications
- Verify update integrity
- Use HTTPS for all communications
- Monitor for suspicious update activity

## Monitoring and Analytics

### Update Metrics

Track update success rates and user adoption:

```typescript
// Log update events
logger.info("Update check started");
logger.info("Update available: v1.0.201");
logger.info("Update downloaded successfully");
logger.info("Update installed on restart");
```

### User Feedback

- Monitor update success rates
- Track user adoption of new versions
- Collect feedback on update experience
- Identify and fix update issues

## Resources

### Official Documentation

- [update-electron-app](https://github.com/electron/update-electron-app)
- [Electron Forge Auto-Update](https://www.electronforge.io/advanced/auto-update)
- [update.electronjs.org](https://update.electronjs.org)

### Related Tools

- [electron-log](https://github.com/megahertz/electron-log) - Logging
- [electron-updater](https://github.com/electron-userland/electron-builder) - Alternative updater
- [electron-release-server](https://github.com/ArekSredzki/electron-release-server) - Self-hosted updates

### Community Support

- [Electron Forge Discord](https://discord.gg/electron-forge)
- [Electron GitHub Discussions](https://github.com/electron/electron/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/electron)

## Changelog

### v1.0.200 - Initial Auto-Update Setup

- ✅ Added update-electron-app integration
- ✅ Configured GitHub publisher
- ✅ Set up automatic update checks
- ✅ Added comprehensive logging
- ✅ Created test and documentation

---

**Note**: This auto-update system is designed to work seamlessly with your existing Electron Forge workflow. Updates are delivered automatically to users, ensuring they always have the latest version of iTracksy.
