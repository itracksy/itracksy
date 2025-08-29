# Auto-Update Quick Reference

## 🚀 Quick Start

### 1. Check Configuration

```bash
node scripts/test-auto-update.js
```

### 2. Release New Version

```bash
# Update version
npm version patch  # or minor/major

# Build and publish
npm run make
npm run publish

# Create GitHub release with artifacts
```

## 📋 Configuration Files

### package.json

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/hunght/itracksy.git"
  }
}
```

### forge.config.ts

```typescript
publishers: [
  new PublisherGithub({
    repository: { owner: "hunght", name: "itracksy" },
    prerelease: false,
    draft: true,
  }),
];
```

### src/main.ts

```typescript
import { updateElectronApp } from "update-electron-app";

updateElectronApp({
  logger: require("electron-log"),
  updateInterval: "1 day",
});
```

## 🔧 Commands

### Development

```bash
npm run dev          # Start dev server (auto-updates disabled)
npm run type-check   # Check for TypeScript errors
```

### Production

```bash
npm run make         # Build application
npm run package      # Package without publishing
npm run publish      # Build and publish to GitHub
```

### Testing

```bash
node scripts/test-auto-update.js  # Test auto-update config
npm run test                      # Run test suite
```

## 📊 Update Flow

```
1. App starts → 2. Checks for updates → 3. Downloads if available → 4. Installs on restart
```

**Timing**: Every 24 hours in production, disabled in development

## 🐛 Troubleshooting

### Updates Not Working?

- ✅ App code-signed? (required for macOS)
- ✅ GitHub repository configured?
- ✅ GitHub releases contain artifacts?
- ✅ Network access to update.electronjs.org?

### Check Logs

```bash
# macOS
~/Library/Logs/itracksy/main.log

# Windows
%USERPROFILE%\AppData\Roaming\itracksy\logs\main.log
```

### Common Issues

- **Development mode**: Updates disabled (expected)
- **Code signing**: Required for macOS auto-updates
- **Network**: Check firewall/proxy settings

## 📝 Release Checklist

- [ ] Update version in package.json
- [ ] Run tests: `npm run test`
- [ ] Build: `npm run make`
- [ ] Publish: `npm run publish`
- [ ] Create GitHub release
- [ ] Upload built artifacts
- [ ] Test auto-update in production build

## 🔗 Resources

- [Full Documentation](./AUTO_UPDATE_SETUP.md)
- [update-electron-app](https://github.com/electron/update-electron-app)
- [Electron Forge Auto-Update](https://www.electronforge.io/advanced/auto-update)
- [update.electronjs.org](https://update.electronjs.org)

---

**Need help?** Run `node scripts/test-auto-update.js` to verify your configuration.
