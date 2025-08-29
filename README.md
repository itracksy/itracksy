# iTracksy

iTracksy is a powerful desktop application for tracking your activities and managing projects efficiently. It provides real-time window activity tracking, project management with boards, and detailed time analytics to help you understand how you spend your time.

![Screenshot 2025-03-08 at 20 18 19](https://github.com/user-attachments/assets/e2255cb1-4a3c-4ab8-a83b-c95c3196caab)
![Screenshot 2025-03-25 at 14 40 29](https://github.com/user-attachments/assets/617b065d-88ff-4f5b-9734-518fe9e4436d)

## What's New 🎉

**Latest Release Features:**
- ⏰ **Custom Session Times** - Set your own focus session durations
- ⚙️ **Clock Window Controls** - Toggle the floating clock on/off in settings
- 📊 **Reports & Export** - New reports page with CSV export functionality
- 🎵 **Music Page** - Focus-enhancing playlists to keep you in the zone
- 🔕 **Notification Controls** - Disable time exceeded notifications to avoid interruptions

📋 **[View Full Release Notes](./RELEASE_NOTES.md)** for detailed information about all new features and improvements.

## Features

- **Activity Tracking**: Automatically tracks window activities and provides detailed insights about your application usage
- **Browser URL Tracking**: Captures browser URLs for detailed website analytics (requires macOS permissions)
- **Project Management**: Organize your work with kanban boards, lists, and cards
- **Time Analytics**: View detailed breakdowns of time spent on different applications, domains, and tasks
- **Activity Classification**: Track your productivity goals with focus sessions and classify activities to improve insights
- **Rule-Based Classification**: Customize how activities are categorized with a flexible rule system

## Installation

### Download

Download the latest release for your platform from the [GitHub Releases page](https://github.com/hunght/itracksy/releases).

### Windows Installation

**Important**: The Windows executable is unsigned, which means Windows Defender/SmartScreen will show security warnings when you try to install or run the application. This is expected behavior for unsigned executables.

When you see the "Windows protected your PC" dialog:
1. Click **"More info"**
2. Click **"Run anyway"** to proceed with installation

This warning appears because the application hasn't been digitally signed with a code signing certificate. The application is safe to use - the warning is simply Windows being cautious about unsigned software.

### macOS Installation

The macOS version is properly signed and notarized, so you shouldn't see security warnings during installation.

## macOS Permissions

For full functionality on macOS, iTracksy requires system permissions to track browser URLs:

- **Accessibility Permission**: Required to detect active applications and window information
- **Screen Recording Permission**: Required to access browser URLs and detailed window content

### Quick Setup
1. Launch iTracksy - it will automatically prompt for permissions
2. Follow the guided setup to open System Settings
3. Grant both Accessibility and Screen Recording permissions
4. Restart iTracksy for changes to take effect

### Manual Setup
See [`docs/MACOS_PERMISSIONS.md`](docs/MACOS_PERMISSIONS.md) for detailed instructions.

### Test Permissions
Run `npm run test-permissions` to verify your permission setup.

## Technology Stack

### Core
- **Electron 32**: Cross-platform desktop application framework
- **Vite 5 & SWC**: Fast frontend tooling and compilation
- **tRPC**: End-to-end typesafe API communication between main and renderer processes

### Database
- **Drizzle ORM**: Type-safe database operations
- **libSQL**: SQLite-compatible client for data storage

### UI/UX
- **React & Tailwind CSS**: Frontend development
- **Shadcn UI**: Component library
- **Geist**: Default typography
- **i18next**: Internationalization
- **Lucide**: Icon library

### Development & Testing
- **TypeScript 5**: Static typing
- **Zod**: Schema validation
- **React Query**: Data fetching
- **Jest & Playwright**: Testing framework
- **Storybook**: Component documentation

### Distribution
- **Electron Forge**: Building and packaging
- **Auto-Updates**: Automatic updates via update.electronjs.org
- **GitHub Actions**: CI/CD pipeline
- **Azure Code Signing**: Certificate signing for Windows

## Auto-Updates

iTracksy automatically updates to the latest version, ensuring you always have the newest features and improvements. The app checks for updates every 24 hours and downloads them in the background.

### How It Works
- **Automatic**: Updates are downloaded and installed automatically
- **Seamless**: No interruption to your workflow
- **Secure**: All updates are verified and signed
- **Free**: Uses the free update.electronjs.org service

### Manual Update Check
You can manually check for updates by restarting the application.

📖 **[View Auto-Update Documentation](./docs/AUTO_UPDATE_SETUP.md)** for detailed information.

## Architecture

iTracksy uses tRPC for type-safe communication between the main and renderer processes:

```typescript
// In main process (src/api/index.ts)
export const router = t.router({
  getActivities: t.procedure
    .query(async () => {
      return await getActivities();
    }),
  startTracking: t.procedure
    .input(trackingSettingsSchema)
    .mutation(async ({ input }) => {
      // Handle tracking start
    })
});

// In renderer process
const activities = await trpcClient.getActivities.query();
```

## Activity Classification System

iTracksy includes a powerful activity classification system that helps you visualize and improve your productivity:

- **Focus Session Tracking**: Monitor your dedicated work sessions and see your improvement over time
- **Productivity Percentage**: Get insights into how productive your time usage is based on your own classification rules
- **Activity Classification Progress**: Track what percentage of your activities have been classified
- **Time-Range Selection**: View classification data across different time periods (daily, weekly, monthly)

### Rule-Based Classification

The rule system allows you to classify your activities automatically:

- **Custom Rules**: Create personalized rules to categorize applications and websites as productive, neutral, or distracting
- **Pattern Matching**: Rules can match by application name, window title, or domain
- **Priority System**: Rules are applied in order of specificity, with more specific rules taking precedence
- **Rule Management**: Easily create, edit, and delete rules through the intuitive interface


## Getting Started

### Prerequisites
- Node.js 18 or later
- npm 9 or later

### Development
```bash
# Clone repository
git clone https://github.com/hunght/iTracksy.git

# Install dependencies
npm install

# Start development mode
npm run start
```

### Database Management
```bash
# Generate new migrations
npm run db:generate

# View and manage database
npm run db:studio
```

### Common Scripts
- `npm run start`: Development mode
- `npm run package`: Create executable bundle
- `npm run make`: Generate platform-specific distributables
- `npm run test`: Run unit tests
- `npm run test:e2e`: Run end-to-end tests
- `npm run storybook`: Start Storybook

## Releasing New Versions

```bash
npm run release         # Increment patch version (1.0.0 -> 1.0.1)
npm run release minor   # Increment minor version (1.0.0 -> 1.1.0)
npm run release major   # Increment major version (1.0.0 -> 2.0.0)
npm run release 1.2.3   # Set specific version
```

The GitHub Actions workflow will automatically build, create a release, and upload artifacts.

## Troubleshooting

### Native Modules in Production Build
Native module issues are handled via `packageAfterPrune` in `forge.config.ts`, ensuring proper rebuilding for production.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/hunght/iTracksy/blob/main/LICENSE) file for details.
