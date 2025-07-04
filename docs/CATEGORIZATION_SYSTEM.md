# Activity Categorization System

## Overview

This system provides automatic categorization of activities based on app names and domains using a hierarchical tree structure. It's designed to help users organize and analyze their time tracking data more effectively.

## Database Schema

### Core Tables

1. **categories** - Hierarchical category structure

   - Uses adjacency list pattern with `parentId` for tree relationships
   - Includes `path` field for efficient querying (e.g., "/Work/Development/Frontend")
   - Supports both system and user-defined categories
   - Includes visual metadata (color, icon) for UI representation

2. **category_mappings** - Rules for automatic categorization

   - Maps app names, domains, and title patterns to categories
   - Supports multiple match types: exact, contains, starts_with, regex
   - Priority-based matching (higher priority rules matched first)
   - Can match on app name, domain, or title patterns

3. **activities** - Extended with `categoryId` reference
   - Automatically categorized when created
   - Can be manually re-categorized

## Key Features

### 1. Tree Structure Management

- **Adjacency List**: Simple parent-child relationships
- **Path Enumeration**: Full paths stored for efficient querying
- **Level Tracking**: Depth calculation for tree operations
- **Automatic Path Updates**: When categories are moved or renamed

### 2. Intelligent Matching

- **Multi-criteria Matching**: App name, domain, and title patterns
- **Flexible Match Types**: Exact, contains, starts with, regex
- **Priority System**: Higher priority rules take precedence
- **Confidence Scoring**: Match quality assessment

### 3. Default Categories

Pre-seeded via SQL migration with common productivity categories:

```
Work/
├── Development/
├── Design/
├── Communication/
├── Documentation/
└── Meetings/
Personal/
Learning/
Entertainment/
Social/
Utilities/
```

### 4. Auto-Categorization

- **Real-time**: New activities categorized immediately
- **Bulk Processing**: Categorize existing uncategorized activities
- **Smart Mapping**: 50+ default app/domain mappings included via migration
- **System Categories**: Global category templates available to all users

## Usage Examples

### Basic Category Operations

```typescript
import { createCategory, getCategoryTree, seedUserCategoriesFromSystem } from "./services/category";

// Copy system categories to new user (recommended approach)
await seedUserCategoriesFromSystem(userId);

// Create custom category
const customCategory = await createCategory({
  name: "Machine Learning",
  description: "AI/ML related work",
  color: "#8b5cf6",
  icon: "🤖",
  parentId: developmentCategoryId,
  order: 0,
  userId,
  isSystem: false,
});

// Get complete category tree
const categoryTree = await getCategoryTree(userId);
```

### Setting Up Category Mappings

```typescript
import { createCategoryMapping } from "./services/category";

// Map VS Code to Development category
await createCategoryMapping({
  categoryId: developmentCategoryId,
  appName: "Visual Studio Code",
  matchType: "exact",
  priority: 100,
  userId,
  isActive: true,
});

// Map GitHub domains to Development
await createCategoryMapping({
  categoryId: developmentCategoryId,
  domain: "github.com",
  matchType: "exact",
  priority: 90,
  userId,
  isActive: true,
});

// Map learning videos on YouTube
await createCategoryMapping({
  categoryId: learningCategoryId,
  domain: "youtube.com",
  titlePattern: "tutorial|course|learn|how to",
  matchType: "regex",
  priority: 80,
  userId,
  isActive: true,
});
```

### Automatic Categorization

```typescript
import { categorizeNewActivity, categorizePendingActivities } from "./services/category";

// Auto-categorize when new activity is created
const wasCategorizeed = await categorizeNewActivity(activityTimestamp, userId);

// Bulk categorize all uncategorized activities
const result = await categorizePendingActivities(userId);
console.log(`Categorized ${result.categorized} of ${result.total} activities`);
```

### Category Analytics

```typescript
import { getCategoryStats } from "./services/category";

const stats = await getCategoryStats(userId);
console.log(`
  Categories: ${stats.totalCategories}
  Mappings: ${stats.totalMappings}
  Categorized: ${stats.categorizedActivities}
  Uncategorized: ${stats.uncategorizedActivities}

  Top Categories:
  ${stats.topCategories
    .map(
      (cat) =>
        `${cat.categoryName}: ${cat.activityCount} activities, ${Math.round(cat.totalDuration / 60)}min`
    )
    .join("\\n")}
`);
```

## Integration Points

### 1. Activity Creation Hook

When new activities are tracked, automatically categorize them:

```typescript
// In your activity tracking code
const newActivity = await createActivity(activityData);
await categorizeNewActivity(newActivity.timestamp, userId);
```

### 2. User Onboarding

Set up default categories for new users:

```typescript
// During user registration/first login
await seedUserCategoriesFromSystem(userId);
```

### 3. Settings UI

Allow users to manage categories and mappings:

- Tree view for category hierarchy
- Drag-and-drop for reordering
- Mapping rules management
- Bulk categorization tools

## Database Migration & Setup

### Migration-Based Seeding

The categorization system uses a two-tier approach:

1. **System Categories**: Created via SQL migration `0014_seed-default-categories.sql`

   - Global category templates with consistent IDs
   - Pre-configured app/domain mappings
   - Marked as `is_system = true` with `user_id = 'system'`

2. **User Categories**: Copied from system templates per user
   - Personal copies of system categories
   - User-specific customizations allowed
   - Isolated per user for privacy

### Applying Migrations

To set up the categorization system:

```bash
# Apply all pending migrations including category seeding
npx drizzle-kit push

# Or apply migrations individually
npx drizzle-kit migrate
```

The migration file creates:

- **6 root categories** (Work, Personal, Learning, Entertainment, Social, Utilities)
- **5 work sub-categories** (Development, Design, Communication, Documentation, Meetings)
- **40+ app/domain mappings** for automatic categorization

### Migration Benefits

- **Consistent**: Same category structure across environments
- **Performant**: No runtime category creation overhead
- **Maintainable**: Categories versioned with database schema
- **Reliable**: Idempotent operations with `INSERT OR IGNORE`
- **Scalable**: System categories serve as templates for all users

## Performance Considerations

1. **Indexing**: All query patterns are indexed for performance
2. **Path Optimization**: Full paths stored to avoid recursive queries
3. **Batch Processing**: Bulk operations for large datasets
4. **Caching**: Consider caching category trees and mappings in memory

## Future Enhancements

1. **Machine Learning**: Train models on user categorization patterns
2. **Time-based Rules**: Different categories based on time of day
3. **Context Rules**: Categorize based on current project/board
4. **Category Suggestions**: AI-powered category recommendations
5. **Import/Export**: Share category structures between users
6. **Analytics**: Advanced reporting and insights

## Best Practices

1. **Keep Categories Focused**: Maximum 3-4 levels deep
2. **Consistent Naming**: Use clear, descriptive category names
3. **Regular Cleanup**: Review and update mappings periodically
4. **Priority Management**: Higher priority for more specific rules
5. **User Experience**: Provide visual feedback for categorization status
