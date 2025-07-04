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

## ANTI-PATTERNS TO AVOID

### ❌ FORBIDDEN: Useless Wrapper Hooks

**Never create hooks that just wrap other hooks without adding value.**

```typescript
// ❌ BAD - Useless wrapper that adds no value
export const useCategoryData = () => {
  const categoryTreeQuery = useCategoryTree();
  const categoriesQuery = useCategories();
  const createMutation = useCreateCategoryMutation();

  return {
    categories: categoriesQuery.data || [],
    categoryTree: categoryTreeQuery.data || [],
    isLoading: categoryTreeQuery.isLoading || categoriesQuery.isLoading,
    createCategory: createMutation.mutateAsync,
    // Just wrapping existing hooks with different names
  };
};

// ✅ GOOD - Use trpc/React Query hooks directly
export function CategoryManagement() {
  const { data: categories, isLoading } = useCategories();
  const { data: categoryTree } = useCategoryTree();
  const createMutation = useCreateCategoryMutation();

  // Direct usage - clear, maintainable, no extra layers
}
```

### ❌ FORBIDDEN: Unnecessary Abstraction Layers

```typescript
// ❌ BAD - Wrapping functions that don't need wrapping
export const categoryService = {
  getAll: () => api.category.getAll.query(),
  create: (data) => api.category.create.mutate(data),
  // Just wrapping trpc calls
};

// ✅ GOOD - Use trpc client directly
export function MyComponent() {
  const { data } = api.category.getAll.useQuery();
  const createMutation = api.category.create.useMutation();
}
```

### When Wrapper Hooks ARE Justified:

**Only create wrapper hooks when they add real value:**

```typescript
// ✅ GOOD - Adds business logic and validation
export const useCategoryWithValidation = (categoryId: string) => {
  const { data: category, ...query } = useCategory(categoryId);

  // ADDS VALUE: Complex validation logic
  const validationErrors = useMemo(() => {
    if (!category) return [];
    const errors = [];
    if (!category.name?.trim()) errors.push("Name is required");
    if (category.name.length > 50) errors.push("Name too long");
    return errors;
  }, [category]);

  // ADDS VALUE: Computed state
  const isValid = validationErrors.length === 0;

  return {
    category,
    validationErrors,
    isValid,
    ...query,
  };
};

// ✅ GOOD - Combines multiple queries with complex logic
export const useDashboardData = () => {
  const { data: stats } = useCategoryStats();
  const { data: recent } = useRecentActivities();

  // ADDS VALUE: Complex data transformation
  const dashboardMetrics = useMemo(() => {
    if (!stats || !recent) return null;

    return {
      productivity: calculateProductivity(stats, recent),
      trends: analyzeTrends(recent),
      alerts: generateAlerts(stats),
    };
  }, [stats, recent]);

  return { dashboardMetrics, isLoading: !stats || !recent };
};
```

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

### Code Refactoring Guidelines:

**When you encounter useless wrapper hooks or unnecessary abstractions:**

1. **Identify the anti-pattern**: Look for hooks that just rename or wrap existing functionality
2. **Check usage**: Find all components using the wrapper hook
3. **Direct replacement**: Update components to use the underlying hooks directly
4. **Remove dead code**: Delete the wrapper hook file completely
5. **Update documentation**: Remove references to deleted patterns

**Example refactoring process:**

```typescript
// 1. BEFORE - Found useless wrapper
export const useUserData = () => {
  const userQuery = useUser();
  return { user: userQuery.data, isLoading: userQuery.isLoading };
};

// 2. DURING - Update components
// ❌ Old way
const { user, isLoading } = useUserData();

// ✅ New way
const { data: user, isLoading } = useUser();

// 3. AFTER - Delete the wrapper hook file
```

## tRPC Best Practices

### MANDATORY: Use tRPC Hooks Directly

**Never wrap tRPC hooks unless adding significant business value.**

```typescript
// ✅ GOOD - Direct tRPC usage
export function CategoryList() {
  const { data: categories, isLoading, error } = api.category.getAll.useQuery();
  const createMutation = api.category.create.useMutation();
  const updateMutation = api.category.update.useMutation();

  const handleCreate = (data: CreateCategoryData) => {
    createMutation.mutate(data);
  };

  // Clear, direct, maintainable
}

// ❌ BAD - Unnecessary wrapper
export const useCategoryOperations = () => {
  const query = api.category.getAll.useQuery();
  const createMutation = api.category.create.useMutation();

  return {
    categories: query.data,
    isLoading: query.isLoading,
    create: createMutation.mutate,
    // Just renaming things - no value added
  };
};
```

### tRPC Data Access Patterns:

```typescript
// ✅ GOOD - Multiple queries in one component
export function Dashboard() {
  const { data: stats } = api.analytics.getStats.useQuery();
  const { data: recent } = api.activities.getRecent.useQuery();
  const { data: categories } = api.category.getAll.useQuery();

  // Direct usage, clear dependencies
}

// ✅ GOOD - Conditional queries
export function UserProfile({ userId }: { userId?: string }) {
  const { data: user } = api.user.getById.useQuery({ id: userId as string }, { enabled: !!userId });

  // Proper conditional querying - query only runs when userId exists
}

// ❌ BAD - Wrapping everything
export const useAllData = () => {
  const statsQuery = api.analytics.getStats.useQuery();
  const recentQuery = api.activities.getRecent.useQuery();
  const categoriesQuery = api.category.getAll.useQuery();

  return {
    stats: statsQuery.data,
    recent: recentQuery.data,
    categories: categoriesQuery.data,
    isLoading: statsQuery.isLoading || recentQuery.isLoading || categoriesQuery.isLoading,
    // Unnecessary aggregation
  };
};
```
