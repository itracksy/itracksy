# Session Review Feature

## Overview

The Session Review feature allows users to review their focus and break sessions directly from the FocusPage. Users can view detailed information about their sessions, including activities, productivity metrics, and classification status.

## Features

### 1. Session Review Button

- **Single "Review Session" Button**: Intelligently shows the appropriate session based on current state
- **Smart Logic**:
  - If there's an active session → shows current session
  - If no active session but last session was focus → shows last focus session
  - If no focus sessions available → button is hidden
- **Focus Sessions Only**: Only shows focus sessions, excludes break sessions from review

### 2. Session Review Dialog

The dialog displays comprehensive session information:

#### Session Header

- Session title (from task or description)
- Duration (completed sessions) or "Ongoing" (active sessions)
- Session type (Focus/Break)
- Target duration (if set)

#### Classification Status

- **Fully Classified**: Green badge with checkmark
- **Partially Classified**: Yellow badge with alert icon
- **Unclassified**: Gray badge with help icon

#### Productivity Metrics

- Session summary with classification progress
- Productivity percentage with visual progress bar
- Number of classified vs. total activities

#### Session Activities

- Grouped by application
- Individual activity details
- Classification toggles for productivity/distraction
- Rule creation and management

## Implementation Details

### Components

#### `SessionReviewDialog`

- Main dialog component for reviewing sessions
- Handles activity classification and rule management
- Integrates with existing activity classification system

#### Integration Points

- **FocusPage**: Main integration with session review buttons
- **ActiveSession**: Additional review button for active sessions
- **ActivityGroup**: Reuses existing activity classification components

### Data Flow

1. **Session Data**: Uses `useLastTimeEntry` and `useActiveTimeEntry` hooks
2. **Activity Data**: Fetches activities via `getGroupActivitiesForTimeEntry` TRPC endpoint
3. **Classification**: Integrates with existing rule and rating systems
4. **Real-time Updates**: Mutations invalidate queries for fresh data

### Key Features

#### Activity Classification

- Mark individual activities as productive or distracting
- Create rules for applications and domains
- Update existing rules
- Real-time productivity metrics

#### Rule Management

- Automatic rule creation from activity classifications
- Domain and application-level rules
- Persistent rule storage and retrieval

#### Performance

- Lazy loading of activity data (only when dialog opens)
- Efficient query invalidation
- Optimized re-renders

#### Data Synchronization

- **Real-time Updates**: All mutations automatically refresh the UI
- **Query Invalidation**: Proper cache management for fresh data
- **Immediate Feedback**: Users see changes instantly after classification
- **Consistent State**: UI always reflects the latest data from the server

## Usage

### For Users

1. **Review Session**:
   - Click the single "Review Session" button on FocusPage
   - Button automatically shows current active session or last focus session
   - Break sessions are automatically excluded from review
   - View session details, activities, and productivity metrics

2. **Activity Classification**:
   - Use toggle buttons to mark activities as productive or distracting
   - Create rules for future automation
   - View productivity metrics and progress

### For Developers

#### Adding to New Pages

```tsx
import { SessionReviewDialog } from "@/pages/focus/components/SessionReviewDialog";

<SessionReviewDialog session={timeEntry} trigger={<Button>Review Session</Button>} />;
```

#### Customizing the Dialog

- Override default trigger with custom `trigger` prop
- Dialog automatically handles session data and activities
- Integrates with existing classification system

## Technical Architecture

### Dependencies

- **React Query**: Data fetching and caching
- **TRPC**: Type-safe API calls
- **Radix UI**: Dialog component primitives
- **Lucide React**: Icons
- **Date-fns**: Date formatting

### State Management

- Local dialog open/close state
- Query state for activities and metrics
- Mutation state for classifications and rules

### Error Handling

- Graceful fallbacks for missing data
- Loading states for better UX
- Error boundaries for robust operation

## Future Enhancements

### Potential Improvements

1. **Session Comparison**: Compare multiple sessions side-by-side
2. **Export Functionality**: Export session data and metrics
3. **Advanced Analytics**: Trend analysis and insights
4. **Batch Operations**: Bulk activity classification
5. **Custom Metrics**: User-defined productivity measures

### Performance Optimizations

1. **Virtual Scrolling**: For sessions with many activities
2. **Pagination**: Large activity lists
3. **Caching**: Improved query caching strategies
4. **Background Sync**: Offline classification support

## Testing

### Component Testing

- Dialog open/close functionality
- Data loading and error states
- Classification interactions
- Rule creation and updates

### Integration Testing

- TRPC endpoint integration
- State management consistency
- User interaction flows
- Performance under load

## Conclusion

The Session Review feature provides users with comprehensive insights into their productivity patterns while maintaining the existing application architecture. It seamlessly integrates with the current classification system and provides a foundation for future productivity analytics features.
