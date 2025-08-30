# Release Options Guide

## Overview

iTracksy now offers multiple release options depending on your needs:

## 🚀 Release Commands

### 1. macOS Only Release (Recommended for macOS updates)
```bash
npm run release:macos
```

**What it does:**
- Creates macOS-specific release with both ARM64 and x64 support
- Triggers `.github/workflows/release-macos.yml` workflow
- Builds DMG installers and ZIP packages for both architectures
- Creates dedicated macOS release with detailed instructions

**Best for:**
- Quick macOS updates
- Testing macOS-specific features
- When you only need to update macOS users

### 2. Multi-Platform Release (Full cross-platform)
```bash
npm run release:multi
```

**What it does:**
- Creates releases for ALL platforms (macOS, Windows, Linux)
- Triggers `.github/workflows/release.yml` workflow
- Builds for macOS (ARM64/x64), Windows (x64), Linux (x64)
- Creates comprehensive release with all platform artifacts

**Best for:**
- Major releases
- When you need to update all users
- Cross-platform feature releases

### 3. Legacy Single Platform Build
```bash
npm run make
```

**What it does:**
- Builds only for your current platform
- No automatic GitHub release creation
- Manual artifact handling required

**Best for:**
- Development testing
- Local builds
- When you need to test before releasing

## 📱 Platform Support Matrix

| Release Type | macOS ARM64 | macOS x64 | Windows x64 | Linux x64 |
|--------------|-------------|-----------|-------------|-----------|
| `release:macos` | ✅ DMG+ZIP | ✅ DMG+ZIP | ❌ | ❌ |
| `release:multi` | ✅ DMG+ZIP | ✅ DMG+ZIP | ✅ EXE+ZIP | ✅ RPM+DEB+ZIP |
| `make` | ❌ | ❌ | ❌ | ❌ (current only) |

## 🔄 Workflow Files

### macOS Workflow (`.github/workflows/release-macos.yml`)
- **Trigger**: Version tags (`v*`)
- **Platforms**: macOS only
- **Architectures**: ARM64 + x64
- **Outputs**: DMG installers + ZIP packages
- **Release**: macOS-specific with detailed instructions

### Multi-Platform Workflow (`.github/workflows/release.yml`)
- **Trigger**: Version tags (`v*`)
- **Platforms**: macOS, Windows, Linux
- **Architectures**: All supported
- **Outputs**: Platform-specific installers + packages
- **Release**: Comprehensive cross-platform release

## 📋 Release Process Comparison

### macOS Release Process
```
Tag Push → macOS Workflow → ARM64 + x64 Builds → macOS Release → Auto-Updates
```

### Multi-Platform Release Process
```
Tag Push → Multi-Platform Workflow → All Platform Builds → Cross-Platform Release → Auto-Updates
```

## 🎯 When to Use Each Option

### Use `npm run release:macos` when:
- ✅ You only need to update macOS users
- ✅ You want faster builds (macOS only)
- ✅ You're testing macOS-specific features
- ✅ You need quick iterations

### Use `npm run release:multi` when:
- ✅ You need to update all platforms
- ✅ You're doing a major release
- ✅ You want to ensure all users get updates
- ✅ You have time for full cross-platform builds

### Use `npm run make` when:
- ✅ You're testing locally
- ✅ You need to debug build issues
- ✅ You don't need GitHub releases
- ✅ You're in development mode

## 🚦 Quick Decision Guide

**Question**: "I just fixed a macOS bug, what should I use?"
**Answer**: `npm run release:macos` - Fast, targeted macOS release

**Question**: "I'm releasing a major new feature, what should I use?"
**Answer**: `npm run release:multi` - Full cross-platform coverage

**Question**: "I want to test the build locally, what should I use?"
**Answer**: `npm run make` - Local build only

## 📊 Build Time Comparison

| Release Type | Estimated Build Time | Platforms |
|--------------|---------------------|-----------|
| `release:macos` | 5-10 minutes | macOS only |
| `release:multi` | 15-25 minutes | All platforms |
| `make` | 2-5 minutes | Current platform only |

## 🔧 Troubleshooting

### macOS Release Issues
- Check `.github/workflows/release-macos.yml` workflow
- Verify macOS-specific build logs
- Ensure both ARM64 and x64 builds complete

### Multi-Platform Release Issues
- Check `.github/workflows/release.yml` workflow
- Verify all platform build logs
- Ensure GitHub Actions have sufficient resources

### Local Build Issues
- Check local environment setup
- Verify dependencies are installed
- Check forge configuration

## 📚 Related Documentation

- [Multi-Platform Auto-Update System](./MULTI_PLATFORM_AUTO_UPDATE.md)
- [Auto-Update Setup](./AUTO_UPDATE_SETUP.md)
- [Release Process](./RELEASE_PROCESS.md)

---

**Note**: Choose the release option that best fits your current needs. For most macOS-focused updates, `npm run release:macos` provides the best balance of speed and functionality.
