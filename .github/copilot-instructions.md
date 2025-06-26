---
applyTo: "**/*.ts,**/*.tsx"
---

# Project coding standards for TypeScript and React

Apply the [general coding guidelines](./general-coding.instructions.md) to all code.

## TypeScript Guidelines

- Use TypeScript for all new code
- Follow functional programming principles where possible
- Use interfaces for data structures and type definitions
- Prefer immutable data (const, readonly)
- Use optional chaining (?.) and nullish coalescing (??) operators
- No using `any` type; use specific types or generics

## React Guidelines

- Use functional components with hooks
- Follow the React hooks rules (no conditional hooks)
- Use React.FC type for components with children
- **MANDATORY: Keep components small and focused**
  - **Maximum 300 lines per component file**
  - **Single responsibility principle - one main purpose per component**
  - **Extract sub-components when logic becomes complex**
  - **Break large components into smaller, composable pieces**
  - **Use custom hooks to extract complex logic**

## Component Size and Structure Enforcement

### MANDATORY RULES:

1. **File Size Limit**: No component file should exceed 300 lines
2. **Single Responsibility**: Each component should have one clear purpose
3. **Extract When Complex**: If a component has more than 3-4 different concerns, split it
4. **Use Composition**: Prefer multiple small components over one large component

### Component Breakdown Patterns:

```typescript
// ❌ BAD - Large monolithic component (400+ lines)
export function LargeDataTable() {
  // 50+ lines of state management
  // 100+ lines of data processing
  // 200+ lines of JSX rendering
  // Multiple different concerns mixed together
}

// ✅ GOOD - Broken into focused components
export function DataTable() {
  const data = useTableData();
  const { filters, setFilters } = useTableFilters();
  const { pagination, setPagination } = useTablePagination();

  return (
    <div>
      <TableFilters filters={filters} onFiltersChange={setFilters} />
      <TableContent data={data} pagination={pagination} />
      <TablePagination pagination={pagination} onPaginationChange={setPagination} />
    </div>
  );
}

// Individual focused components in separate files:
// - TableFilters.tsx (handles only filtering logic)
// - TableContent.tsx (handles only data display)
// - TablePagination.tsx (handles only pagination)
// - useTableData.ts (custom hook for data logic)
// - useTableFilters.ts (custom hook for filter logic)
// - useTablePagination.ts (custom hook for pagination logic)
```

### When to Split a Component:

- **State Management**: If managing 5+ pieces of state, extract to custom hooks
- **Event Handlers**: If more than 5-6 event handlers, extract to separate files
- **Complex Logic**: If business logic exceeds 20-30 lines, move to custom hooks
- **JSX Complexity**: If JSX has 3+ levels of nesting, extract sub-components
- **Multiple Concerns**: If handling data + UI + side effects, separate each concern

### File Organization for Components:

```
src/pages/categorization/
├── index.tsx                 # Main page component (< 50 lines)
├── components/
│   ├── CategoryList.tsx      # Main list component (< 200 lines)
│   ├── CategoryItem.tsx      # Individual item (< 100 lines)
│   ├── CategoryFilters.tsx   # Filter controls (< 150 lines)
│   ├── AddCategoryModal.tsx  # Modal dialog (< 200 lines)
│   └── CategoryStats.tsx     # Statistics display (< 100 lines)
├── hooks/
│   ├── useCategoryData.ts    # Data fetching logic
│   ├── useCategoryFilters.ts # Filter state logic
│   └── useCategoryActions.ts # CRUD operations
└── types/
    └── category.ts           # Type definitions
```

## File Organization

- **Group related functionality in folders** (e.g., `services/category/`, `services/user/`)
- **One function per file** for complex operations
- **Use barrel exports** (`index.ts`) to provide clean import paths
- **Export functions directly** - avoid wrapping in objects unless necessary for state
- **Use descriptive file names** that match the function name

### Example folder structure:

```
src/
├── services/
│   ├── category/
│   │   ├── types.ts
│   │   ├── seed-categories.ts
│   │   ├── match-activity.ts
│   │   ├── get-hierarchy.ts
│   │   └── index.ts
│   └── user/
│       ├── get-user.ts
│       ├── create-user.ts
│       └── index.ts
```

## Functional Programming Enforcement

### FORBIDDEN Patterns:

```typescript
// ❌ Classes
class MyService {}

// ❌ Constructors
constructor() {}

// ❌ Class inheritance
class Child extends Parent {}

// ❌ Abstract classes
abstract class BaseClass {}
```

### REQUIRED Patterns:

```typescript
// ✅ Separate files in organized folders - export functions directly
// Folder: services/user/
// File: services/user/get-user.ts
export const getUser = async (id: string): Promise<User> => {
  // Implementation
};

// File: services/user/create-user.ts
export const createUser = async (userData: UserData): Promise<User> => {
  // Implementation
};

// File: services/user/index.ts (barrel export)
export { getUser } from "./get-user";
export { createUser } from "./create-user";

// ✅ Higher-order functions
const withLogging =
  <T extends (...args: any[]) => any>(fn: T) =>
  (...args: Parameters<T>): ReturnType<T> => {
    console.log("Calling function");
    return fn(...args);
  };

// ✅ Pure functions
const processData = (input: Data): ProcessedData => {
  // Pure transformation
  return { ...input, processed: true };
};
```

## Type Definitions

- Use `interface` for object shapes
- Use `type` for unions, primitives, and computed types
- Always use `readonly` for immutable data structures
- Prefer `const assertions` for literal types

```typescript
// ✅ Immutable interfaces
interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

// ✅ Readonly arrays
type UserList = readonly User[];

// ✅ Const assertions
const STATUSES = ["active", "inactive", "pending"] as const;
type Status = (typeof STATUSES)[number];
```
