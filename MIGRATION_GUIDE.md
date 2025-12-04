# Brand Guidelines Migration Guide

This guide helps you update existing components to use the new itracksy brand colors.

## 🔄 Quick Migration Reference

### Old Colors → New Brand Colors

| Old Color | Old Value | New Color | New Value | Usage |
|-----------|-----------|-----------|-----------|-------|
| `tracksy.blue` | `#2B4474` | `brand.purple` | `#8B5CF6` | Primary actions, branding |
| `tracksy.gold` | `#E5A853` | `brand.pink` | `#EC4899` | Secondary actions, accents |
| - | - | `brand.cyan` | `#06B6D4` | Links, information |
| - | - | `brand.blue` | `#3B82F6` | Info states |
| - | - | `brand.green` | `#10B981` | Success states |

### Tailwind Class Updates

```diff
// Primary buttons
- className="bg-[#E5A853] text-white"
+ className="bg-gradient-primary text-white"

// Secondary buttons
- className="bg-[#2B4474] text-white"
+ className="bg-secondary text-secondary-foreground"

// Text colors
- className="text-[#E5A853]"
+ className="text-primary"

- className="text-[#2B4474]"
+ className="text-secondary"
```

## 📝 Component-by-Component Migration

### Buttons

**Before:**
```tsx
<button className="bg-[#E5A853] text-white px-6 py-3 rounded-md">
  Click me
</button>
```

**After:**
```tsx
<button className="bg-gradient-primary text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
  Click me
</button>
```

### Links

**Before:**
```tsx
<a href="#" className="text-[#2B4474] hover:underline">
  Learn more
</a>
```

**After:**
```tsx
<a href="#" className="text-brand-cyan hover:text-brand-blue transition-colors">
  Learn more
</a>
```

### Cards

**Before:**
```tsx
<div className="bg-white border border-gray-200 rounded-md p-6">
  Content
</div>
```

**After:**
```tsx
<div className="bg-card border border-border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
  Content
</div>
```

### Success Messages

**Before:**
```tsx
<div className="bg-green-100 text-green-800 p-4 rounded-md">
  Success message
</div>
```

**After:**
```tsx
<div className="bg-success/10 border-l-4 border-success p-4 rounded-md">
  <p className="font-semibold text-success">Success</p>
  <p className="text-sm text-success/80">Success message</p>
</div>
```

### Error Messages

**Before:**
```tsx
<div className="bg-red-100 text-red-800 p-4 rounded-md">
  Error message
</div>
```

**After:**
```tsx
<div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-md">
  <p className="font-semibold text-destructive">Error</p>
  <p className="text-sm text-destructive/80">Error message</p>
</div>
```

## 🎨 CSS Variable Updates

### Before (Direct Colors)
```css
.custom-button {
  background-color: #E5A853;
  color: white;
}
```

### After (Design Tokens)
```css
.custom-button {
  background: var(--gradient-primary);
  color: var(--color-text-inverse);
}
```

## 🔍 Finding Components to Update

### Search for Old Colors

Run these searches in your codebase:

```bash
# Find old blue color
grep -r "#2B4474" src/

# Find old gold color
grep -r "#E5A853" src/

# Find tracksy.blue references
grep -r "tracksy.blue" src/

# Find tracksy.gold references
grep -r "tracksy.gold" src/
```

## ✅ Testing Checklist

After migrating a component:

- [ ] Component renders correctly in light mode
- [ ] Component renders correctly in dark mode
- [ ] Colors match the brand guidelines
- [ ] Hover states work properly
- [ ] Focus states are visible
- [ ] Text contrast meets WCAG AA standards (4.5:1)
- [ ] Animations/transitions are smooth
- [ ] No console errors or warnings

## 🎯 Priority Migration Order

1. **High Priority**
   - [ ] Primary navigation
   - [ ] Main action buttons
   - [ ] Logo and branding elements
   - [ ] Hero sections
   - [ ] Call-to-action components

2. **Medium Priority**
   - [ ] Cards and containers
   - [ ] Forms and inputs
   - [ ] Secondary buttons
   - [ ] Alert/notification components
   - [ ] Data visualizations

3. **Low Priority**
   - [ ] Footer elements
   - [ ] Tertiary UI elements
   - [ ] Admin interfaces
   - [ ] Legacy components

## 💡 Tips & Best Practices

### 1. Use Semantic Color Names
```tsx
// ✅ Good - semantic and maintainable
<button className="bg-primary text-primary-foreground">

// ❌ Avoid - hard to maintain
<button className="bg-brand-purple text-white">
```

### 2. Leverage Gradients for Impact
```tsx
// ✅ Use gradients for hero sections and primary CTAs
<div className="bg-gradient-primary">Featured Content</div>

// ❌ Don't overuse gradients everywhere
<div className="bg-gradient-primary">
  <button className="bg-gradient-primary">...</button>
</div>
```

### 3. Maintain Dark Mode Support
```tsx
// ✅ Colors adapt automatically
<div className="bg-background text-foreground">

// ❌ Hardcoded colors break dark mode
<div className="bg-white text-black">
```

### 4. Use Opacity for Variations
```tsx
// ✅ Create subtle backgrounds with opacity
<div className="bg-primary/10 border-primary">

// ❌ Don't create new color variants
<div className="bg-primary-light border-primary">
```

## 🔧 Automated Migration Script

You can use this script to help automate some replacements:

```bash
#!/bin/bash

# Replace old tracksy.blue references
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/tracksy\.blue/brand.purple/g'

# Replace old tracksy.gold references
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/tracksy\.gold/brand.pink/g'

# Replace hex colors
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/#E5A853/bg-gradient-primary/g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/#2B4474/bg-secondary/g'

echo "✅ Migration complete! Please review changes carefully."
```

⚠️ **Warning:** Always review automated changes carefully and test thoroughly!

## 📚 Additional Resources

- [Brand Guidelines](./BRAND_GUIDELINES.md) - Complete brand documentation
- [Design Tokens](./src/styles/design-tokens.css) - CSS variables reference
- [Developer README](./src/styles/README.md) - Quick implementation guide
- [Color Palette Component](./src/components/ui/color-palette.tsx) - Visual reference

## 🆘 Need Help?

If you're unsure about how to migrate a specific component:

1. Check the [Developer README](./src/styles/README.md) for common patterns
2. Look at the [Color Palette Component](./src/components/ui/color-palette.tsx) for examples
3. Review similar components that have already been migrated
4. Consult the design team for clarification

## 📝 Notes

- **Backwards Compatibility**: The old `tracksy.blue` and `tracksy.gold` colors have been updated to point to the new brand colors for backwards compatibility
- **Gradual Migration**: You can migrate components gradually - the old and new colors can coexist during transition
- **Testing**: Always test in both light and dark modes after migration
- **Performance**: The design tokens use CSS variables which are performant and support runtime theme switching

---

**Last Updated:** December 4, 2024
**Version:** 1.0.0


