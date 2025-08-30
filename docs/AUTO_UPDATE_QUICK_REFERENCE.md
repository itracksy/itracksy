# Auto-Update Quick Reference

## Quick Commands

### Start Auto-Update

```typescript
import { updateElectronApp } from "update-electron-app";

// Initialize auto-update (in main process)
updateElectronApp({
  repo: "hunght/itracksy",
  updateInterval: "1 hour",
  logger: require("electron-log"),
});
```

### Check for Updates

```typescript
// Manual update check
updateElectronApp.checkForUpdates();

// Listen for update events
updateElectronApp.on("update-available", () => {
  console.log("Update available!");
});

updateElectronApp.on("update-downloaded", () => {
  console.log("Update downloaded, ready to install");
});
```

## Workflow Commands

### Trigger Auto-Update Release

```bash
# Automatic (push tag)
git tag v1.0.204
git push origin v1.0.204

# Manual (via GitHub Actions)
# Go to Actions → Auto-Update Release → Run workflow
```

### Check Workflow Status

```bash
# View workflow runs
gh run list --workflow="Auto-Update Release"

# View latest run
gh run view --workflow="Auto-Update Release" --latest
```

### Monitor Auto-Update Health

```bash
# Check endpoint health
curl -I "https://update.electronjs.org/hunght/itracksy/darwin/v1.0.204"

# View monitoring workflow
gh run list --workflow="Auto-Update Monitor"
```

## Configuration

### Required Environment Variables

```bash
# Auto-update service
REPO=hunght/itracksy
PLATFORM=darwin
ARCH=x64,arm64

# Apple signing
APPLE_SIGNING_IDENTITY="Developer ID Application"
APPLE_ID="your-apple-id@example.com"
APPLE_TEAM_ID="YOUR_TEAM_ID"
```

### GitHub Secrets

```bash
BUILD_CERTIFICATE_BASE64    # .p12 certificate (base64)
P12_PASSWORD               # Certificate password
KEYCHAIN_PASSWORD          # Temporary keychain password
APPLE_SIGNING_IDENTITY     # Developer ID Application
APPLE_ID                   # Apple ID email
APPLE_ID_PASSWORD          # App-specific password
APPLE_TEAM_ID             # Team ID
```

## Workflow Files

### Auto-Update Release

- **File**: `.github/workflows/auto-update-release.yml`
- **Trigger**: Version tags (`v*.*.*`)
- **Purpose**: Build, sign, and publish updates
- **Output**: GitHub release with auto-update

### Auto-Update Monitor

- **File**: `.github/workflows/auto-update-monitor.yml`
- **Trigger**: Every 6 hours + post-release
- **Purpose**: Monitor system health
- **Output**: Health reports and status

## Update Flow

### For Users

1. App starts → Check for updates
2. Update available → Background download
3. Download complete → User notification
4. User clicks → Install and restart

### For Developers

1. Push version tag → Workflow triggers
2. Build and sign → Create release
3. Publish assets → Auto-update active
4. Monitor health → Ensure reliability

## Troubleshooting

### Common Issues

```bash
# Build fails
npm run test-auto-update  # Check configuration

# Auto-update not working
curl "https://update.electronjs.org/hunght/itracksy/darwin/latest"

# Certificate issues
security find-identity -v  # Check keychain
```

### Debug Commands

```bash
# Test auto-update locally
npm run test-auto-update

# Check workflow logs
gh run view --workflow="Auto-Update Release" --log

# Verify release assets
gh release view v1.0.204 --json assets
```

## Quick Links

- **Workflows**: [GitHub Actions](https://github.com/hunght/itracksy/actions)
- **Releases**: [GitHub Releases](https://github.com/hunght/itracksy/releases)
- **Auto-Update Service**: [update.electronjs.org](https://update.electronjs.org)
- **Documentation**: [Auto-Update Workflow Guide](AUTO_UPDATE_WORKFLOW_GUIDE.md)

## Status Indicators

### ✅ Healthy

- Auto-update endpoint accessible
- Release assets available
- Configuration valid
- Users receiving updates

### ⚠️ Warning

- Recent release (endpoint may be 404)
- Configuration differences
- Build in progress

### ❌ Issue

- Endpoint inaccessible
- Missing assets
- Configuration errors
- Build failures

## Best Practices

1. **Always use semantic versioning** (`v1.0.204`)
2. **Test builds locally** before pushing tags
3. **Monitor workflow health** regularly
4. **Keep release notes** comprehensive
5. **Maintain certificates** and secrets
6. **Use conventional commits** for auto-changelog
