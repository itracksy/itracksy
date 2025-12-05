# 🎨 itracksy Customization Guide

## Overview

itracksy now features a comprehensive customization system that allows users to personalize their experience. This guide covers all customization options and how to use them.

---

## 🌟 Why Customization Matters

Different users have different needs:

- **Young users** might prefer vibrant colors and animations
- **Older users** might prefer larger fonts and reduced motion
- **Business professionals** might want a subtle, professional theme
- **Power users** might want to hide unused features
- **Accessibility needs** vary greatly between users

Our customization system ensures itracksy works for everyone!

---

## 📍 Accessing Customization Settings

1. Open itracksy
2. Click **Settings** in the sidebar
3. The **Customization** section appears at the top
4. Use the tabs to navigate different customization categories

---

## 🎨 Appearance Customization

### Theme Styles

Choose from 6 carefully designed theme variants:

#### 1. **Default** (Brand Theme)
- **Colors**: Purple & Pink gradient
- **Best for**: Modern, Professional, Brand consistency
- **Description**: Classic itracksy brand colors with vibrant gradients

#### 2. **Professional**
- **Colors**: Subtle blues and grays
- **Best for**: Business, Corporate, Minimal distraction
- **Description**: Perfect for professional environments where you need to stay focused

#### 3. **Comfort**
- **Colors**: Warm amber and yellow tones
- **Best for**: Long sessions, Eye comfort, Warm atmosphere
- **Description**: Easy on the eyes for extended use, reduces eye strain

#### 4. **Vibrant**
- **Colors**: High contrast reds, oranges, and greens
- **Best for**: Energy boost, High visibility, Creative work
- **Description**: Energetic colors that keep you alert and motivated

#### 5. **Minimal**
- **Colors**: Monochrome grays
- **Best for**: Focus, Simplicity, Distraction-free
- **Description**: Clean aesthetic that lets you focus on what matters

#### 6. **Nature**
- **Colors**: Greens and earth tones
- **Best for**: Calm, Wellness, Natural atmosphere
- **Description**: Calming colors inspired by nature

### Typography

#### Font Size
- **Small (14px)**: More content on screen
- **Normal (16px)**: Standard, comfortable reading
- **Large (18px)**: Easier reading, less eye strain
- **Extra Large (20px)**: Maximum readability

#### Font Family
- **Default (System)**: Uses your system's default font
- **Sans Serif (Inter)**: Clean, modern sans-serif
- **Monospace (Code)**: Fixed-width font, great for technical users
- **OpenDyslexic**: Specially designed for users with dyslexia

### Layout & Visual Density

#### UI Size
- **Compact**: More content, less space (75% spacing)
- **Comfortable**: Balanced layout (100% spacing) - Default
- **Spacious**: Relaxed layout with more breathing room (125% spacing)

#### Visual Options
- **Show Icons**: Display icons next to menu items
- **Rounded Corners**: Use rounded corners for UI elements (vs sharp corners)

### Animations & Motion

#### Animation Speed
- **None**: No animations (instant transitions)
- **Reduced**: Minimal animations (0.1s)
- **Normal**: Standard speed (0.2s) - Default
- **Enhanced**: Smooth & fluid (0.3s)

#### Reduce Motion
- Enable for accessibility
- Minimizes all motion and animations
- Recommended for users sensitive to motion

---

## 📐 Sidebar Customization

### Visible Menu Items

Toggle which pages appear in your sidebar:

**Available Items:**
- ✅ **Focus Session** - Start and manage focus sessions
- ✅ **Scheduling** - Plan your time blocks
- ✅ **Projects** - Manage project boards
- ✅ **Categorization** - Organize activities
- ✅ **Classify** - Activity classification rules
- ✅ **Analytics** - View charts and insights
- ✅ **Focus Music** - Background music player
- ✅ **Reports** - Generate time reports
- ✅ **Logs** - Activity history
- 🔒 **Settings** - App configuration (Always visible)

**Use Cases:**
- Hide "Focus Music" if you don't use it
- Hide "Analytics" if you prefer simple tracking
- Hide "Reports" if you only use the dashboard
- Keep only essential features for a cleaner interface

### Sidebar Behavior

- **Collapsed by Default**: Start with sidebar in icon-only mode to save space

---

## 🔔 Notification Customization

### Sound Settings

- **Enable Sounds**: Toggle notification sounds on/off
- **Volume**: Adjust notification volume (0-100%)

### Notification Types

Control which notifications you receive:

- **Desktop Notifications**: System notifications outside the app
- **In-App Notifications**: Notifications within the app
- **Focus Reminders**: Reminders to start focus sessions
- **Break Reminders**: Reminders to take breaks
- **Goal Achievements**: Celebrate when you reach goals

**Recommended Settings:**
- **Deep Work Mode**: Disable all notifications during focus
- **Balanced**: Enable break reminders only
- **Motivated**: Enable all notifications for maximum engagement

---

## 🎯 Focus Mode Customization

### Default Durations

Set your preferred session lengths:

- **Focus Duration**: 5-120 minutes (Default: 25 min)
- **Break Duration**: 1-30 minutes (Default: 5 min)

**Popular Techniques:**
- **Pomodoro**: 25 min focus / 5 min break
- **Extended Focus**: 50 min focus / 10 min break
- **Short Sprints**: 15 min focus / 3 min break
- **Deep Work**: 90 min focus / 15 min break

### Session Behavior

Automate your workflow:

- **Auto-Start Breaks**: Automatically start break timer after focus session
- **Auto-Start Next Session**: Automatically start next focus session after break

**Use Cases:**
- Enable both for fully automated Pomodoro cycles
- Disable both for manual control
- Enable auto-breaks only to ensure you take breaks

### Distraction Management

Minimize distractions during focus:

- **Dim Inactive Windows**: Reduce opacity of non-focus windows
- **Hide Distractions**: Hide non-essential UI elements during focus

---

## 🎯 Use Case Examples

### For Students

```
Theme: Vibrant or Nature
Font Size: Normal or Large
UI Size: Comfortable
Sidebar: Hide Reports, Analytics
Focus: 25 min / 5 min (Pomodoro)
Notifications: Enable all for motivation
```

### For Professionals

```
Theme: Professional or Minimal
Font Size: Normal
UI Size: Comfortable or Compact
Sidebar: Hide Music, keep Analytics
Focus: 50 min / 10 min
Notifications: Break reminders only
```

### For Seniors / Accessibility

```
Theme: Comfort
Font Size: Large or Extra Large
Font Family: OpenDyslexic (if needed)
UI Size: Spacious
Animations: Reduced or None
Reduce Motion: Enabled
Sidebar: Hide unused features
```

### For Creative Professionals

```
Theme: Vibrant or Default
Font Size: Normal
UI Size: Comfortable
Sidebar: Keep all features
Focus: 90 min / 15 min (Deep work)
Notifications: Goal achievements only
```

### For Minimalists

```
Theme: Minimal
Font Size: Small or Normal
UI Size: Compact
Sidebar: Hide Music, Reports, Logs
Animations: None
Notifications: Disabled
```

---

## 🔧 Technical Implementation

### For Developers

#### Accessing Preferences in Code

```typescript
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";

function MyComponent() {
  const { data: preferences } = useQuery({
    queryKey: ["user.getPreferences"],
    queryFn: async () => {
      return trpcClient.user.getPreferences.query();
    },
  });

  // Use preferences
  const themeVariant = preferences?.appearance.themeVariant;
  const visibleItems = preferences?.sidebar.visibleItems;
}
```

#### Updating Preferences

```typescript
import { trpcClient } from "@/utils/trpc";
import { useQueryClient } from "@tanstack/react-query";

async function updateTheme(variant: ThemeVariant) {
  const queryClient = useQueryClient();

  await trpcClient.user.updatePreferences.mutate({
    appearance: { themeVariant: variant },
  });

  queryClient.invalidateQueries({ queryKey: ["user.getPreferences"] });
}
```

#### Using the Theme Hook

```typescript
import { useThemePreferences } from "@/hooks/useThemePreferences";

function App() {
  // Automatically applies theme preferences to document
  useThemePreferences();

  return <YourApp />;
}
```

### CSS Variables

Theme variants automatically set CSS variables:

```css
/* Available in all components */
--variant-primary
--variant-secondary
--variant-accent
--variant-success
--variant-warning
--variant-destructive

/* Spacing (based on UI size) */
--spacing-unit
--padding-sm
--padding-md
--padding-lg
--gap-sm
--gap-md
--gap-lg

/* Animation (based on animation speed) */
--transition-speed
--animation-speed
```

### Data Attributes

The following attributes are set on `<html>`:

```html
<html
  data-theme-variant="professional"
  data-font-scale="large"
  data-font-family="sans"
  data-ui-size="comfortable"
  data-animation-speed="normal"
  data-reduced-motion="false"
  data-rounded-corners="true"
  class="light"
>
```

---

## 🗄️ Storage

Preferences are stored locally using Electron's localStorage API:

- **Key**: `user.preferences`
- **Format**: JSON
- **Persistence**: Survives app restarts
- **Sync**: Local only (not synced across devices)

---

## 🔄 Reset to Defaults

To reset all customization settings:

1. Go to Settings > Customization
2. Click "Reset to Defaults" button (top right)
3. Confirm the action

This will restore:
- Theme: Default
- Font: Normal size, Default family
- UI Size: Comfortable
- All sidebar items visible
- All notifications enabled
- Standard focus durations (25/5)

---

## 🎓 Best Practices

### For Users

1. **Start Simple**: Try the default settings first
2. **Adjust Gradually**: Change one thing at a time
3. **Test Different Themes**: Try themes at different times of day
4. **Consider Your Environment**: Use Professional theme at work, Vibrant at home
5. **Accessibility First**: Prioritize readability and comfort over aesthetics

### For Developers

1. **Respect Preferences**: Always check user preferences before applying defaults
2. **Smooth Transitions**: Use CSS transitions when applying theme changes
3. **Test All Variants**: Test your components with all theme variants
4. **Accessibility**: Ensure all themes meet WCAG contrast requirements
5. **Performance**: Theme changes should be instant (no loading states)

---

## 🐛 Troubleshooting

### Theme Not Applying

1. Check browser console for errors
2. Verify preferences are loaded: `localStorage.getItem('user.preferences')`
3. Try resetting to defaults
4. Restart the application

### Sidebar Items Not Hiding

1. Ensure Settings page is visible (can't be hidden)
2. Check preferences in Settings > Customization > Sidebar
3. Refresh the application

### Fonts Not Changing

1. Verify font files are loaded
2. Check if custom font family is installed
3. Try different font scale first
4. Restart application

---

## 📊 Statistics

- **6 Theme Variants** covering all user preferences
- **4 Font Sizes** from compact to extra large
- **4 Font Families** including accessibility options
- **3 UI Sizes** for different density preferences
- **4 Animation Speeds** including none for accessibility
- **10 Sidebar Items** that can be shown/hidden
- **7 Notification Types** that can be toggled
- **Infinite Combinations** - customize to your heart's content!

---

## 🎉 Future Enhancements

Planned features for future releases:

- [ ] Custom color picker for themes
- [ ] Import/Export customization presets
- [ ] Share customization profiles with team
- [ ] Time-based theme switching (auto dark mode at night)
- [ ] Per-project customization
- [ ] Custom keyboard shortcuts
- [ ] Widget customization
- [ ] Dashboard layout customization

---

## 💡 Tips & Tricks

### Quick Theme Switching

Create keyboard shortcuts for your favorite themes:
1. Professional theme for work hours
2. Comfort theme for evening
3. Vibrant theme for creative work

### Sidebar Optimization

Hide features you use less than once per week to reduce clutter.

### Focus Mode Mastery

Experiment with different durations to find your optimal focus length. Most people find their sweet spot between 25-50 minutes.

### Notification Strategy

- **Morning**: Enable all notifications for motivation
- **Deep Work**: Disable all except break reminders
- **End of Day**: Enable goal achievements to celebrate wins

### Accessibility Combinations

For maximum accessibility:
- Large or Extra Large font
- Spacious UI size
- Reduced motion enabled
- High contrast theme (Vibrant)
- OpenDyslexic font (if needed)

---

## 📞 Support

Need help with customization?

- Check the in-app Settings > Customization section
- Review this guide
- Check the [BRAND_GUIDELINES.md](./BRAND_GUIDELINES.md) for design details
- Submit feedback through the app

---

**Last Updated**: December 5, 2024
**Version**: 1.0.0
**Feature Status**: ✅ Complete and Available

---

## 🎨 Summary

itracksy's customization system puts you in control:

✅ **6 Beautiful Themes** - From professional to vibrant
✅ **Full Typography Control** - Size, family, and accessibility
✅ **Flexible Layout** - Compact to spacious
✅ **Smart Sidebar** - Show only what you need
✅ **Notification Control** - Your way, your schedule
✅ **Focus Optimization** - Durations that work for you
✅ **Accessibility First** - Options for everyone
✅ **Instant Apply** - Changes take effect immediately
✅ **Persistent** - Settings saved across sessions
✅ **Easy Reset** - Back to defaults anytime

**Make itracksy yours! 🚀**

