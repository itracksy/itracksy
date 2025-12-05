# 🔧 Customization System Integration Guide

## Quick Setup

To activate the customization system in your app, follow these steps:

---

## 1. Import the Theme Hook in Your Root Component

Find your main App component (usually `src/App.tsx` or `src/main.tsx`) and add:

```typescript
import { useThemePreferences } from "@/hooks/useThemePreferences";

function App() {
  // This hook automatically applies user preferences to the document
  useThemePreferences();

  return (
    // Your app content
  );
}
```

**What this does:**
- Loads user preferences from localStorage
- Applies theme variant to document
- Sets font scale, UI size, animations
- Updates whenever preferences change

---

## 2. Ensure Global Styles are Imported

Your `src/styles/global.css` should already have:

```css
@import "./design-tokens.css";
@import "./theme-variants.css";  /* ← This is new! */

@tailwind base;
@tailwind components;
@tailwind utilities;
```

✅ **Already done!** This was added during implementation.

---

## 3. Verify Settings Page Integration

The Settings page should include the CustomizationSection:

```typescript
// src/pages/settings-page/SettingsPage.tsx
import { CustomizationSection } from "@/pages/settings-page/components/CustomizationSection";

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1>Settings</h1>

      {/* Customization section */}
      <CustomizationSection />

      {/* Other settings... */}
    </div>
  );
}
```

✅ **Already done!** This was added during implementation.

---

## 4. Sidebar Integration Check

The AppSidebar should be using preferences:

```typescript
// src/components/app-sidebar.tsx
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";

export function AppSidebar() {
  // Load preferences
  const { data: preferences } = useQuery({
    queryKey: ["user.getPreferences"],
    queryFn: async () => {
      return trpcClient.user.getPreferences.query();
    },
  });

  // Filter visible items
  const visibleItems = React.useMemo(() => {
    if (!preferences) return ALL_ITEMS;
    return ALL_ITEMS.filter((item) =>
      preferences.sidebar.visibleItems.includes(item.id)
    );
  }, [preferences]);

  // Render filtered items...
}
```

✅ **Already done!** This was added during implementation.

---

## 5. Test the Integration

### Manual Testing Checklist

1. **Start the app**
   ```bash
   npm run dev
   ```

2. **Navigate to Settings**
   - Click "Settings" in the sidebar
   - You should see "Customization" section at the top

3. **Test Theme Switching**
   - Click on different theme variants
   - UI should update immediately
   - Colors should change

4. **Test Font Scaling**
   - Change font size (Small → Large)
   - All text should scale

5. **Test Sidebar Customization**
   - Toggle off "Focus Music"
   - Sidebar should hide that item
   - Toggle back on to restore

6. **Test Persistence**
   - Change some settings
   - Restart the app
   - Settings should be preserved

7. **Test Reset**
   - Click "Reset to Defaults"
   - All settings should revert

---

## 6. Optional: Add to Onboarding

Consider showing new users the customization options during onboarding:

```typescript
// In your onboarding flow
import { ThemePreviewGrid } from "@/components/ui/theme-preview";

function OnboardingStep() {
  return (
    <div>
      <h2>Choose Your Theme</h2>
      <p>Pick a color scheme that matches your style</p>

      <ThemePreviewGrid
        activeVariant="default"
        onSelect={(variant) => {
          // Save preference
          trpcClient.user.updatePreferences.mutate({
            appearance: { themeVariant: variant }
          });
        }}
      />
    </div>
  );
}
```

---

## 7. Optional: Add Quick Theme Switcher

Add a quick theme switcher to your header/toolbar:

```typescript
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { THEME_VARIANTS } from "@/lib/types/user-preferences";

function QuickThemeSwitcher() {
  const queryClient = useQueryClient();
  const { data: preferences } = useQuery({
    queryKey: ["user.getPreferences"],
    queryFn: async () => trpcClient.user.getPreferences.query(),
  });

  const switchTheme = async (variant: string) => {
    await trpcClient.user.updatePreferences.mutate({
      appearance: { themeVariant: variant },
    });
    queryClient.invalidateQueries({ queryKey: ["user.getPreferences"] });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(THEME_VARIANTS).map(([key, theme]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => switchTheme(key)}
            className="flex items-center gap-2"
          >
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: theme.colors.primary }}
            />
            {theme.name}
            {preferences?.appearance.themeVariant === key && " ✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 8. Troubleshooting

### Themes Not Applying

**Problem:** Theme changes don't take effect

**Solution:**
1. Check that `useThemePreferences()` is called in your root component
2. Verify `theme-variants.css` is imported in `global.css`
3. Check browser console for errors
4. Clear localStorage and restart: `localStorage.removeItem('user.preferences')`

### Sidebar Items Not Hiding

**Problem:** Toggling sidebar items doesn't work

**Solution:**
1. Verify AppSidebar is using `visibleItems` from preferences
2. Check that preferences are loading (React Query DevTools)
3. Ensure TRPC endpoints are working
4. Check that item IDs match between `ALL_ITEMS` and `SidebarItem` type

### Preferences Not Persisting

**Problem:** Settings reset on app restart

**Solution:**
1. Check localStorage in DevTools (Application tab)
2. Verify `setValue()` is being called in `updateUserPreferences()`
3. Check for errors in browser console
4. Ensure Electron's localStorage is working

### Performance Issues

**Problem:** Theme switching is slow

**Solution:**
1. Check React Query caching configuration
2. Verify CSS transitions are not too long
3. Use React DevTools Profiler to identify bottlenecks
4. Consider memoization for expensive computations

---

## 9. Deployment Checklist

Before deploying to production:

- [ ] All theme variants tested in light mode
- [ ] All theme variants tested in dark mode
- [ ] Font scaling tested at all sizes
- [ ] Sidebar customization tested
- [ ] Notification preferences tested
- [ ] Focus mode settings tested
- [ ] Persistence tested (restart app)
- [ ] Reset to defaults tested
- [ ] Accessibility tested (screen reader, keyboard)
- [ ] Performance tested (theme switching speed)
- [ ] Documentation reviewed
- [ ] User guide accessible

---

## 10. Monitoring & Analytics (Optional)

Consider tracking customization usage:

```typescript
// Track theme changes
const switchTheme = async (variant: ThemeVariant) => {
  await trpcClient.user.updatePreferences.mutate({
    appearance: { themeVariant: variant },
  });

  // Analytics
  analytics.track('theme_changed', {
    from: preferences?.appearance.themeVariant,
    to: variant,
  });
};

// Track which features are hidden most
const toggleSidebarItem = async (itemId: SidebarItem, visible: boolean) => {
  // ... update preferences ...

  analytics.track('sidebar_item_toggled', {
    item: itemId,
    visible,
  });
};
```

**Insights to gather:**
- Most popular themes
- Most commonly hidden features
- Average font size preference
- Animation preference distribution

---

## 11. Future Enhancements

Ideas for future iterations:

### Phase 2
- [ ] Custom color picker
- [ ] Import/Export presets
- [ ] Share presets with team
- [ ] Theme marketplace

### Phase 3
- [ ] Per-project themes
- [ ] Time-based theme switching
- [ ] Custom keyboard shortcuts
- [ ] Widget customization

### Phase 4
- [ ] AI-suggested themes based on usage
- [ ] Collaborative theme editing
- [ ] Theme versioning
- [ ] A/B testing different themes

---

## 12. Support Resources

### For Users
- [CUSTOMIZATION_GUIDE.md](./CUSTOMIZATION_GUIDE.md) - Complete user guide
- [CUSTOMIZATION_FEATURES.md](./CUSTOMIZATION_FEATURES.md) - Quick reference
- Settings > Customization - Interactive UI

### For Developers
- [CUSTOMIZATION_IMPLEMENTATION_SUMMARY.md](./CUSTOMIZATION_IMPLEMENTATION_SUMMARY.md) - Technical overview
- [src/lib/types/user-preferences.ts](./src/lib/types/user-preferences.ts) - Type definitions
- [src/styles/theme-variants.css](./src/styles/theme-variants.css) - CSS implementation

---

## ✅ Integration Complete!

Once you've completed steps 1-5, the customization system is fully integrated and ready to use!

**Key Points:**
- ✅ Zero configuration needed (defaults work out of the box)
- ✅ Automatic persistence (localStorage)
- ✅ Instant updates (React Query)
- ✅ Type-safe (TypeScript)
- ✅ Accessible (WCAG compliant)
- ✅ Performant (CSS variables)

**Next Steps:**
1. Test thoroughly
2. Gather user feedback
3. Iterate based on usage
4. Enjoy happy, empowered users! 🎉

---

**Questions?** Check the documentation or review the implementation code.

**Ready to customize!** 🚀

