# Timestamp and Timezone Conventions

This document establishes the canonical patterns for handling timestamps and timezones across the iTracksy application.

## Overview

The application stores activity timestamps in the database and needs to perform queries based on time ranges. Consistency in how we handle these operations is critical to prevent data inconsistencies and bugs.

## Database Schema

### Activities Table

- `timestamp`: INTEGER - Stored in **MILLISECONDS** (not seconds)
- All timestamp fields follow this same pattern

## Timestamp Handling Patterns

### ✅ CORRECT: Reference Implementation

See `getProductivityStats()` in `src/api/services/activities.ts` as the canonical example.

```typescript
// Get day boundaries in LOCAL TIME
const startOfDay = new Date(startTime);
startOfDay.setHours(0, 0, 0, 0);

const endOfDay = new Date(endTime ?? startTime);
endOfDay.setHours(23, 59, 59, 999);

// Query with millisecond timestamps
const result = await db
  .select({...})
  .from(activities)
  .where(
    and(
      eq(activities.userId, userId),
      sql`${activities.timestamp} >= ${startOfDay.getTime()}`,
      sql`${activities.timestamp} <= ${endOfDay.getTime()}`
    )
  );
```

### ❌ INCORRECT: Common Mistakes

```typescript
// ❌ DON'T: Use UTC time
today.setUTCHours(0, 0, 0, 0);

// ❌ DON'T: Divide timestamps by 1000
gte(activities.timestamp, Math.floor(startOfDay / 1000));

// ❌ DON'T: Use lt() for end boundary
lt(activities.timestamp, endTimestamp);

// ❌ DON'T: Use different query patterns
gte(activities.timestamp, startTime); // Use sql template instead
```

## Timezone Rules

### Local Time vs UTC

- **Always use LOCAL TIME** for day boundaries
- Users expect "today" to mean "today in my timezone"
- Use `setHours()`, never `setUTCHours()`

### Day Boundaries

- **Start of day**: `setHours(0, 0, 0, 0)`
- **End of day**: `setHours(23, 59, 59, 999)`
- **Include end boundary**: Use `<=` not `<`

## Query Patterns

### SQL Template Literals

Always use SQL template literals for timestamp comparisons:

```typescript
// ✅ CORRECT
sql`${activities.timestamp} >= ${startTime}`;
sql`${activities.timestamp} <= ${endTime}`;

// ❌ INCORRECT
gte(activities.timestamp, startTime);
lte(activities.timestamp, endTime);
```

### Boundary Conditions

- Use `>=` for start boundary
- Use `<=` for end boundary (to include activities at day end)

## Functions Following These Patterns

### Reference Implementations

1. `getProductivityStats()` in `activities.ts` - **Primary reference**
2. `getTodaysFocusProgress()` in `focusTargets.ts` - **Updated to follow patterns**

### Functions to Audit

When adding new time-based queries, ensure they follow these patterns. Common locations:

- Dashboard services
- Analytics services
- Reporting functions
- Focus tracking features

## Common Pitfalls

1. **Timestamp Unit Confusion**: Database stores milliseconds, not seconds
2. **Timezone Issues**: Using UTC instead of local time
3. **Boundary Errors**: Using `<` instead of `<=` for end times
4. **Query Inconsistency**: Mixing different query patterns

## Testing Considerations

When testing time-based functions:

- Test across timezone boundaries
- Test at midnight (day boundaries)
- Test with activities at exact start/end times
- Verify millisecond precision is maintained

## Migration Notes

If updating existing functions:

1. Check current timestamp handling
2. Verify timezone usage (local vs UTC)
3. Update queries to use sql template literals
4. Test boundary conditions
5. Update documentation

---

**Remember**: When in doubt, follow the patterns in `getProductivityStats()` in `activities.ts`
