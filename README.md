# iTracksy

iTracksy is a powerful desktop application for tracking your activities and managing projects efficiently. It provides real-time window activity tracking, project management with boards, and detailed time analytics to help you understand how you spend your time.

![Screenshot 2025-03-08 at 20 18 19](https://github.com/user-attachments/assets/e2255cb1-4a3c-4ab8-a83b-c95c3196caab)
![Screenshot 2025-03-25 at 14 40 29](https://github.com/user-attachments/assets/617b065d-88ff-4f5b-9734-518fe9e4436d)

## Features

- **Activity Tracking**: Automatically tracks window activities and provides detailed insights about your application usage
- **Project Management**: Organize your work with kanban boards, lists, and cards
- **Time Analytics**: View detailed breakdowns of time spent on different applications, domains, and tasks
- **Dark/Light Mode**: Supports system theme as well as manual light/dark mode switching
- **Cross-Platform**: Built with Electron for seamless experience across operating systems

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
- **Squirrel.Windows**: Auto-updates
- **GitHub Actions**: CI/CD pipeline
- **Azure Code Signing**: Certificate signing for Windows

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
