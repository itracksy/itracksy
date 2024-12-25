# iTracksy Design Prompts for v0.dev

## Dashboard Page
```prompt
Create a modern time tracking dashboard with a dark theme. Include:
- A large time display showing current tracking status at the top
- A sidebar with navigation items: Dashboard, Projects, Reports, Settings
- A main content area with:
  - A "Start Tracking" button prominently displayed
  - A timeline view showing today's activities
  - Circular charts showing time distribution
  - A list of recent activities with application icons
- Use a color scheme of deep purple (#6B46C1) as primary, with dark backgrounds (#1A1A1A)
- Include modern icons from lucide-react
- Make it responsive for desktop screens
```

## Time Entry Modal
```prompt
Design a modal for creating/editing time entries with:
- A clean, floating modal design
- Input fields for:
  - Project selection (dropdown)
  - Start time (time picker)
  - End time (time picker)
  - Description (text area)
  - Tags (multi-select)
- A footer with Save and Cancel buttons
- Use subtle shadows and rounded corners
- Maintain dark theme consistency
```

## Projects View
```prompt
Create a projects management view with:
- A grid of project cards showing:
  - Project name
  - Total time spent
  - Color indicator
  - Progress bar
- A "New Project" card with plus icon
- Filtering options in the header
- List/Grid view toggle
- Search bar at the top
- Use neumorphic design elements
```

## Reports Page
```prompt
Design an analytics dashboard with:
- A date range selector at the top
- Multiple chart sections:
  - Bar chart for daily time distribution
  - Pie chart for project distribution
  - Line chart for productivity trends
- Export buttons for PDF/CSV
- Filters for projects and categories
- Data cards showing key metrics
- Use a grid layout with clean spacing
```

## Settings Panel
```prompt
Create a settings interface with:
- Sidebar categories:
  - General
  - Notifications
  - Privacy
  - Appearance
  - Integrations
- Toggle switches for various options
- Input fields for configurations
- Clean section dividers
- Save button in footer
- Use monospace font for technical settings
```

## Bottom Timer Bar
```prompt
Design a minimal bottom bar with:
- Current tracking status
- Project name being tracked
- Timer display
- Start/Stop button
- Quick project switcher
- Make it sticky to bottom
- Semi-transparent background
- Compact height
```

## Activity Timeline
```prompt
Create a vertical timeline showing:
- Time blocks with:
  - Application icons
  - Time duration
  - Project tags
  - Activity description
- Hour markers on the left
- Hover states for each block
- Ability to group similar activities
- Use subtle connecting lines
```

## Quick Actions Menu
```prompt
Design a quick actions popup with:
- Recent projects list
- Common actions:
  - New timer
  - Add manual time
  - Generate report
- Keyboard shortcuts displayed
- Search bar at top
- Clean dividers between sections
```

## Design System Guidelines

### Colors
- Primary: #6B46C1 (Deep Purple)
- Background: #1A1A1A (Dark)
- Secondary Background: #2D2D2D
- Text Primary: #FFFFFF
- Text Secondary: #A0AEC0
- Accent: #38B2AC (Teal)
- Error: #E53E3E
- Success: #38A169

### Typography
- Headings: Inter
- Body: Inter
- Monospace: JetBrains Mono

### Components
- Rounded corners: 8px
- Shadow: 0 4px 6px rgba(0, 0, 0, 0.1)
- Button padding: 12px 24px
- Card padding: 24px
- Gap between elements: 16px

### Icons
- Use Lucide icons
- Size: 20px for normal, 16px for small
- Stroke width: 1.5px

### Animations
- Subtle hover transitions: 0.2s ease
- Modal transitions: 0.3s ease
- Loading states: Pulse animation

### Responsive Breakpoints
- Mobile: 640px
- Tablet: 768px
- Desktop: 1024px
- Large Desktop: 1280px
