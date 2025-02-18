# iTracksy

iTracksy is a powerful desktop application for tracking your activities and managing projects efficiently. It provides real-time window activity tracking, project management with boards, and detailed time analytics to help you understand how you spend your time.

![Demo GIF](https://github.com/hunght/iTracksy/blob/main/images/demo.gif)

## Features

- **Activity Tracking**: Automatically tracks window activities and provides detailed insights about your application usage
- **Project Management**: Organize your work with kanban boards, lists, and cards
- **Time Analytics**: View detailed breakdowns of time spent on different applications, domains, and tasks
- **Dark/Light Mode**: Supports system theme as well as manual light/dark mode switching
- **Cross-Platform**: Built with Electron for seamless experience across operating systems

## Libs and tools

### Core 🏍️

- [Electron 32](https://www.electronjs.org) - Framework for building cross-platform desktop applications
- [Vite 5](https://vitejs.dev) - Next generation frontend tooling
- [SWC](https://swc.rs) - Super-fast TypeScript/JavaScript compiler
- [tRPC](https://trpc.io) - End-to-end typesafe APIs with [electron-trpc](https://github.com/jsonnull/electron-trpc) for main-renderer communication

### Database 🗄️

- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM with a focus on type safety and developer experience
- [libSQL](https://github.com/libsql/libsql-client-ts) - TypeScript client for SQLite-compatible databases

### DX 🛠️

- [TypeScript 5](https://www.typescriptlang.org) - JavaScript with syntax for types
- [Prettier](https://prettier.io) - Code formatter
- [Zod](https://zod.dev) - TypeScript-first schema validation
- [React Query (Tan Stack)](https://react-query.tanstack.com)

### UI 🎨

- [React](https://reactjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Shadcn UI](https://ui.shadcn.com)
- [Geist](https://vercel.com/font) as default font
- [i18next](https://www.i18next.com)
- [Lucide](https://lucide.dev)

### Test 🧪

- [Jest](https://jestjs.io)
- [Playwright](https://playwright.dev)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)

### Packing and distribution 📦

- [Electron Forge](https://www.electronforge.io)
- Squirrel.Windows for auto-updates:
  - `.nupkg`: NuGet packages containing application versions
  - Delta packages for efficient updates
  - Automatic update checking and installation

### Documentation 📚

- [Storybook](https://storybook.js.org)

### CI/CD 🚀

- Pre-configured [GitHub Actions workflow](https://github.com/hunght/iTracksy/blob/main/.github/workflows/playwright.yml), for test with Playwright
- Automated release builds for Windows, macOS, and Linux
- Code signing for Windows executables using Azure Code Signing service

### Code Signing 🔐

The Windows installer is automatically signed using:
- Azure Code Signing service
- JSign for Authenticode signing
- GitHub Actions workflow for automated signing during release

For development, you'll need:
1. Access to Azure Code Signing service
2. A valid certificate in your Azure Code Signing account
3. Proper permissions to access the certificate

### Project preferences 🎯

- Use Context isolation
- `titleBarStyle`: hidden (Using custom title bar)
- Geist as default font
- Some default styles was applied, check the [`styles`](https://github.com/hunght/iTracksy/tree/main/src/styles) directory

> If you don't know some of these libraries or tools, I recommend you to check their documentation to understand how they work and how to use them.

## Architecture

### IPC Communication with tRPC

iTracksy uses tRPC for type-safe communication between the main and renderer processes. This provides several benefits:

- **Type Safety**: Full end-to-end type safety between the main and renderer processes
- **Automatic Type Inference**: TypeScript automatically infers the types of your API calls
- **Better Developer Experience**: Autocomplete and inline errors in your IDE
- **Simplified API Management**: Centralized API definition and validation

Example usage:

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

For more details about the tRPC integration, see the [electron-trpc documentation](https://github.com/jsonnull/electron-trpc).

## Directory structure

```plaintext
.
└── ./src/
    ├── ./src/assets/
    │   └── ./src/assets/fonts/
    ├── ./src/components/
    │   └── ./src/components/ui/
    ├── ./src/helpers/
    │   └── ./src/helpers/ipc/
    ├── ./src/layout/
    ├── ./src/lib/
    ├── ./src/pages/
    ├── ./src/stories/
    ├── ./src/style/
    └── ./src/tests/
```

- `src/`: Main directory
  - `assets/`: Store assets like images, fonts, etc.
  - `components/`: Store UI components
    - `ui/`: Store Shadcn UI components (this is the default direcotry used by Shadcn UI)
  - `helpers/`: Store IPC related functions to be called in the renderer process
    - `ipc/`: Directory to store IPC context and listener functions
      - Some implementations are already done, like `theme` and `window` for the custom title bar
  - `layout/`: Directory to store layout components
  - `lib/`: Store libraries and other utilities
  - `pages/`: Store app's pages
  - `stories/`: Store Storybook stories
  - `style/`: Store global styles
  - `tests/`: Store tests (from Jest and Playwright)

## Building from Source

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Build Instructions

1. Clone the repository:
```bash
git clone https://github.com/hunght/iTracksy.git
cd iTracksy
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run make
```

### Build Configuration

The application uses Electron Forge for building and packaging. Key build configurations include:

- Native modules (`*.node` files) are automatically unpacked from the asar archive to ensure proper functionality
- External dependencies like `get-windows` and `libsql` are handled specially during packaging
- Resources are included in the final build from the `./resources` directory

For more details about the build configuration, see `forge.config.ts`.

## Database Migrations

The application uses Drizzle ORM for database management and handles migrations in both development and production environments:

- Migration files are bundled with the app in the `drizzle` directory
- The app automatically runs migrations on startup through `initializeDatabase`
- Migrations are executed from the app's resources directory in production builds
- The database file is stored in the user's application data directory

```bash
# Generate new migrations
npm run db:generate

# View and manage database with Drizzle Studio
npm run db:studio
```

## Development Scripts

### Revert to Tag Script

Located in `scripts/revert-to-tag.sh`, this script allows you to safely revert the main branch to a specific tag's state without rewriting git history.

Usage:
```bash
./scripts/revert-to-tag.sh <tag_name>
```

For example:
```bash
./scripts/revert-to-tag.sh v1.0.69
```

The script will:
1. Check if the tag exists
2. Switch to main branch and update it
3. Revert all changes after the specified tag
4. Create a commit with the reversion
5. Push the changes to the remote repository

## NPM script

To run any of those scripts:

```bash
npm run <script>
```

- `start`: Start the app in development mode
- `package`: Package your application into a platform-specific executable bundle and put the result in a folder.
- `make`: Generate platform-specific distributables (e.g. .exe, .dmg, etc) of your application for distribution.
- `publish`: Electron Forge's way of taking the artifacts generated by the `make` command and sending them to a service somewhere for you to distribute or use as updates.
- `prett`: Run Prettier to format the code
- `storybook`: Start Storybook
- `build-storybook`: Run the Storybook's build command
- `test`: Run the default unit-test script (Jest)
- `test:watch`: Run the default unit-test script in watch mode (Jest)
- `test:unit`: Run the Jest tests
- `test:e2e`: Run the Playwright tests
- `test:all`: Run all tests (Jest and Playwright)

The test scripts involving Playwright require the app be builded before running the tests. So, before run the tests, run the `package`, `make` or `publish` script.

## Development

1. Clone this repository

```bash
git clone https://github.com/hunght/iTracksy.git
```


2. Install dependencies

```bash
npm install
```

3. Start the app

```bash
npm run start
```

## Releasing New Versions

iTracksy uses GitHub Actions for automated releases. To publish a new version:

1. Run one of the following commands:
   ```bash
   npm run release         # Increment patch version (1.0.0 -> 1.0.1)
   npm run release minor   # Increment minor version (1.0.0 -> 1.1.0)
   npm run release major   # Increment major version (1.0.0 -> 2.0.0)
   npm run release 1.2.3   # Set specific version
   ```

2. The release script will:
   - Update version in package.json
   - Create a git commit with the version change
   - Create and push a git tag
   - Push changes to main branch

3. GitHub Actions will automatically:
   - Build the application
   - Create a GitHub release
   - Upload the built artifacts

## Troubleshooting

### Native Modules in Production Build

When building the application for production, you might encounter issues with native modules like `serialport`. This is handled in the project using the `packageAfterPrune` configuration in `forge.config.ts`. This configuration ensures that native modules are properly rebuilt for production.

Reference: [SerialPort Issue #2464](https://github.com/serialport/node-serialport/issues/2464) [Github issue](https://github.com/electron/forge/issues/3738)

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/hunght/iTracksy/blob/main/LICENSE) file for details.
