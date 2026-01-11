# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iTracksy is an Electron-based productivity app that tracks time, monitors focus sessions, and provides insights into work habits. It runs as a desktop application with a system tray icon on macOS and Windows.

## Development Commands

```bash
# Development
npm run dev              # Start Electron app in development mode

# Testing
npm test                 # Run Jest unit tests
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run Playwright e2e tests

# Type checking
npm run type-check       # TypeScript type checking without emit

# Database
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Apply migrations
npm run db:apply         # Generate and apply migrations
npm run db:studio        # Open Drizzle Studio

# Build
npm run make             # Build distributable
npm run mac-build        # Build for macOS
npm run win-build        # Build for Windows
```

## Architecture

### Electron Process Model
- **Main process** (`src/main.ts`): Electron main process, handles system tray, window management, IPC handlers
- **Renderer process** (`src/renderer.ts`, `src/App.tsx`): React frontend
- **Preload** (`src/preload.ts`): Bridge between main and renderer processes

### Communication Layer (tRPC + electron-trpc)
The app uses tRPC over IPC for type-safe communication between renderer and main processes:
- **Router definition**: `src/api/index.ts` - combines all routers
- **Individual routers**: `src/api/routers/*.ts` - domain-specific endpoints
- **tRPC client**: `src/utils/trpc.ts` - renderer-side client using `ipcLink()`
- **Procedures**: `src/api/trpc.ts` - defines `publicProcedure` and `protectedProcedure`

### Database (Drizzle ORM + SQLite)
- **Schema**: `src/api/db/schema.ts` - all table definitions and relations
- **Config**: `drizzle.config.ts`
- **Services**: `src/api/services/*.ts` - business logic accessing the database

Key tables: `boards`, `items`, `columns`, `timeEntries`, `activities`, `categories`, `activityRules`, `scheduledSessions`

### Frontend (React + TanStack Router + TanStack Query)
- **Routing**: `src/routes/routes.tsx` - all route definitions using TanStack Router
- **Pages**: `src/pages/*/` - page components organized by feature
- **UI Components**: `src/components/ui/` - shadcn/ui components
- **Hooks**: `src/hooks/` - React Query hooks wrapping tRPC mutations
- **State**: Jotai for local state, React Query for server state

### Services Layer
Located in `src/api/services/`:
- `trackingIntervalActivity.ts` - core activity tracking logic
- `category/*.ts` - category management and auto-categorization
- `timeEntry.ts` - time entry CRUD operations
- `systemMonitor.ts` - idle/sleep/lock detection
- `scheduledSessions.ts` - scheduled focus sessions

## Code Style Requirements

### Mandatory: Functional Programming Only
- No classes, constructors, or OOP patterns
- Use pure functions and function composition
- State management through immutable data structures
- Export functions directly, use barrel exports (`index.ts`)

### React Component Rules
- Maximum 300 lines per component file
- Single responsibility per component
- Extract complex logic to custom hooks
- Use tRPC hooks directly - avoid unnecessary wrapper hooks

### TypeScript
- No `any` type - use specific types or generics
- Use interfaces for data structures
- Use `readonly` for immutable data
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### Path Aliases
Use `@/` prefix for imports from src directory (configured in `tsconfig.json`):
```typescript
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
```
