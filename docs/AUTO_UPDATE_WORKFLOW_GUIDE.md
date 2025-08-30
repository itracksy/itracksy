# Auto-Update Workflow Guide

This guide explains how to use the new auto-update workflows for iTracksy, which provide automated release management and update distribution.

## Overview

The auto-update system consists of two main workflows:

1. **Auto-Update Release** (`auto-update-release.yml`) - Handles automatic releases and updates
2. **Auto-Update Monitor** (`auto-update-monitor.yml`) - Monitors system health and provides status reports

## Workflow 1: Auto-Update Release

### Purpose

Automatically builds, signs, and publishes new versions of iTracksy when version tags are pushed, enabling seamless auto-updates for users.

### Triggers

- **Automatic**: Push a version tag (e.g., `v1.0.204`)
- **Manual**: Use the "Run workflow" button in GitHub Actions with a custom version

### What It Does

#### 1. Version Check

- Verifies if the version already exists in releases
- Prevents duplicate releases
- Determines if auto-update is needed

#### 2. Build Process

- Builds for both macOS architectures (Intel x64 and Apple Silicon ARM64)
- Signs the application with your Apple Developer certificate
- Creates installable packages (.dmg files)

#### 3. Release Creation

- Generates comprehensive release notes from git commits
- Creates a GitHub release with the new version
- Uploads all build artifacts to the release

#### 4. Auto-Update Integration

- Publishes to the update.electronjs.org service
- Enables automatic update detection for users
- Verifies the auto-update configuration

### Usage

#### Automatic Release (Recommended)

```bash
# 1. Update version in package.json
npm version patch  # or minor/major

# 2. Push the new tag
git push origin v1.0.204

# 3. The workflow runs automatically
```

#### Manual Release

1. Go to GitHub Actions → Auto-Update Release
2. Click "Run workflow"
3. Enter the version (e.g., `v1.0.204`)
4. Click "Run workflow"

### Output

- **GitHub Release**: Public release with installers
- **Auto-Update**: Users receive automatic update notifications
- **Build Artifacts**: Signed .dmg files for both architectures

## Workflow 2: Auto-Update Monitor

### Purpose

Continuously monitors the health of the auto-update system and provides status reports.

### Triggers

- **Scheduled**: Every 6 hours automatically
- **Manual**: Can be triggered manually
- **Post-Release**: Runs after auto-update releases complete

### What It Monitors

#### 1. System Health

- Auto-update endpoint accessibility
- Release asset availability
- Configuration file integrity

#### 2. Update Service Status

- update.electronjs.org endpoint health
- GitHub API connectivity
- Release asset verification

#### 3. Configuration Validation

- update-electron-app package status
- Main process auto-update code
- Forge configuration validation

### Benefits

- **Proactive Monitoring**: Catches issues before users are affected
- **Health Reports**: Regular status updates on system health
- **Issue Detection**: Automatic problem identification and reporting

## How Auto-Updates Work

### For Users

1. **Automatic Detection**: App checks for updates every time it starts
2. **Background Download**: Updates download automatically in the background
3. **User Notification**: Users are notified when updates are ready
4. **Seamless Installation**: One-click update installation

### Technical Flow

```
User App → update.electronjs.org → GitHub Releases → Download → Install
```

### Update Service

- **Provider**: update.electronjs.org (free service)
- **Repository**: github.com/hunght/itracksy
- **Platform**: macOS (darwin)
- **Architecture**: x64 and ARM64

## Configuration Requirements

### GitHub Secrets

The workflows require these secrets to be configured:

```bash
# Apple Developer Certificate
BUILD_CERTIFICATE_BASE64    # Base64 encoded .p12 certificate
P12_PASSWORD               # Certificate password
KEYCHAIN_PASSWORD          # Temporary keychain password

# Apple Developer Account
APPLE_SIGNING_IDENTITY     # Developer ID Application
APPLE_ID                   # Apple ID email
APPLE_ID_PASSWORD          # App-specific password
APPLE_TEAM_ID             # Team ID

# Application Environment
VITE_AXIOM_TOKEN          # Axiom logging token
VITE_AXIOM_ORG_ID         # Axiom organization ID
VITE_AXIOM_DATASET        # Axiom dataset name
VITE_PUBLIC_POSTHOG_KEY   # PostHog analytics key
VITE_PUBLIC_POSTHOG_HOST  # PostHog host URL
```

### Repository Settings

- **Repository**: Must be public for update.electronjs.org to work
- **Releases**: Must have proper permissions for workflow access
- **Actions**: Must be enabled for workflow execution

## Best Practices

### Release Management

1. **Version Tags**: Always use semantic versioning (v1.0.204)
2. **Changelog**: Write clear commit messages for automatic release notes
3. **Testing**: Test builds locally before pushing tags
4. **Rollback**: Keep previous versions available for rollback scenarios

### Auto-Update Strategy

1. **Gradual Rollout**: Consider staged releases for major updates
2. **User Communication**: Inform users about major changes
3. **Monitoring**: Watch the monitoring workflow for system health
4. **Documentation**: Keep release notes comprehensive and user-friendly

### Troubleshooting

1. **Build Failures**: Check Apple Developer certificate validity
2. **Update Issues**: Verify update.electronjs.org endpoint health
3. **Permission Errors**: Ensure GitHub secrets are properly configured
4. **Rate Limits**: Monitor GitHub API usage

## Workflow Status

### Success Indicators

- ✅ All jobs complete successfully
- ✅ GitHub release created with assets
- ✅ Auto-update endpoint accessible
- ✅ Users receiving update notifications

### Common Issues

- ❌ Certificate signing failures
- ❌ GitHub API rate limits
- ❌ Missing build artifacts
- ❌ Auto-update endpoint errors

## Monitoring and Alerts

### Health Checks

- **Endpoint Status**: update.electronjs.org accessibility
- **Asset Verification**: Release file availability
- **Configuration**: Auto-update setup validation
- **Performance**: Build and publish timing

### Notifications

- **Success**: Workflow completion notifications
- **Issues**: Automatic problem detection and reporting
- **Status**: Regular health reports every 6 hours

## Integration with Existing Workflows

### Current Setup

- **Release Workflow**: `release-macos.yml` (existing)
- **Auto-Update Workflow**: `auto-update-release.yml` (new)
- **Monitor Workflow**: `auto-update-monitor.yml` (new)

### Workflow Coordination

- Auto-update workflow can run independently
- Monitor workflow tracks both workflows
- No conflicts with existing release process
- Complementary functionality

## Future Enhancements

### Planned Features

- **Windows Support**: Extend to Windows builds
- **Linux Support**: Add Linux distribution support
- **Beta Channels**: Separate beta and stable update channels
- **Analytics**: Track update success rates and user adoption

### Customization Options

- **Update Frequency**: Configurable check intervals
- **Rollout Strategy**: Staged release options
- **User Preferences**: Configurable update behavior
- **Notification Settings**: Customizable update notifications

## Support and Maintenance

### Regular Tasks

- **Monitor Workflows**: Check status reports regularly
- **Update Dependencies**: Keep Electron and related packages current
- **Certificate Renewal**: Maintain Apple Developer certificates
- **Performance Review**: Optimize build and publish times

### Getting Help

- **Workflow Logs**: Check GitHub Actions for detailed information
- **Issue Reports**: Monitor automatic issue creation
- **Documentation**: Refer to this guide and related docs
- **Community**: Engage with Electron and GitHub communities

## Conclusion

The auto-update workflows provide a robust, automated system for delivering updates to iTracksy users. By following this guide and maintaining the system properly, you can ensure users always have access to the latest features and improvements with minimal manual intervention.

The combination of automated releases, comprehensive monitoring, and seamless user experience makes this system a powerful tool for maintaining and improving your application over time.
