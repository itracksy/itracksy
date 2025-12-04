# itracksy Design System

Quick reference guide for developers implementing the itracksy brand guidelines.

## 🎨 Using Brand Colors

### Tailwind Classes

```tsx
// Primary Purple
<button className="bg-primary text-primary-foreground">Primary Button</button>
<button className="bg-brand-purple text-white">Brand Purple</button>

// Secondary Pink
<button className="bg-secondary text-secondary-foreground">Secondary Button</button>
<div className="bg-brand-pink">Pink Background</div>

// Accent Cyan
<button className="bg-accent text-accent-foreground">Accent Button</button>
<div className="text-brand-cyan">Cyan Text</div>

// Success Green
<div className="bg-success text-success-foreground">Success Message</div>
<div className="text-brand-green">Green Text</div>

// Brand Blue
<div className="bg-brand-blue text-white">Blue Background</div>
```

### CSS Variables

```css
.custom-element {
  background: var(--color-primary-purple);
  color: var(--color-text-inverse);
}

.gradient-button {
  background: var(--gradient-primary);
}
```

## 🎨 Gradients

```tsx
// Primary Gradient (Purple to Pink)
<div className="bg-gradient-primary">Gradient Background</div>

// Secondary Gradient (Cyan to Blue)
<div className="bg-gradient-secondary">Gradient Background</div>

// Success Gradient (Green to Cyan)
<div className="bg-gradient-success">Gradient Background</div>
```

## 🎯 Common Patterns

### Primary Button
```tsx
<button className="bg-gradient-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
  Primary Action
</button>
```

### Secondary Button
```tsx
<button className="bg-white text-primary border-2 border-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
  Secondary Action
</button>
```

### Card
```tsx
<div className="bg-card border border-border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
  Card Content
</div>
```

### Success Message
```tsx
<div className="bg-success/10 border-l-4 border-success text-success-foreground p-4 rounded-md">
  <p className="font-semibold">Success!</p>
  <p>Your changes have been saved.</p>
</div>
```

### Error Message
```tsx
<div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 rounded-md">
  <p className="font-semibold">Error</p>
  <p>Something went wrong.</p>
</div>
```

## 📏 Spacing

Use Tailwind's spacing scale (matches our design tokens):

- `p-1` / `m-1` = 4px (--spacing-xs)
- `p-2` / `m-2` = 8px (--spacing-sm)
- `p-4` / `m-4` = 16px (--spacing-md)
- `p-6` / `m-6` = 24px (--spacing-lg)
- `p-8` / `m-8` = 32px (--spacing-xl)
- `p-12` / `m-12` = 48px (--spacing-2xl)
- `p-16` / `m-16` = 64px (--spacing-3xl)

## 🔤 Typography

```tsx
// Headings
<h1 className="text-5xl font-bold text-foreground">Display</h1>
<h2 className="text-4xl font-bold text-foreground">Heading 1</h2>
<h3 className="text-3xl font-semibold text-foreground">Heading 2</h3>
<h4 className="text-2xl font-semibold text-foreground">Heading 3</h4>

// Body Text
<p className="text-lg text-foreground">Large body text</p>
<p className="text-base text-foreground">Regular body text</p>
<p className="text-sm text-muted-foreground">Small text</p>
<p className="text-xs text-muted-foreground">Caption text</p>

// Monospace (for time displays)
<span className="font-mono text-2xl">12:34:56</span>
```

## 🎨 Dark Mode

All colors automatically adapt to dark mode. No extra classes needed:

```tsx
// This works in both light and dark mode
<div className="bg-background text-foreground">
  Content adapts automatically
</div>
```

## 🎯 Semantic Colors

```tsx
// Success
<div className="text-success">Success message</div>

// Error
<div className="text-destructive">Error message</div>

// Warning
<div className="text-warning">Warning message</div>

// Info
<div className="text-info">Info message</div>
```

## 🔄 Transitions

```tsx
// Standard transitions
<button className="transition-colors duration-200">Hover me</button>
<div className="transition-transform duration-300 hover:scale-105">Scale on hover</div>
<div className="transition-opacity duration-200 hover:opacity-80">Fade on hover</div>
```

## 📋 Complete Color Reference

### Brand Colors
- **Purple**: `bg-brand-purple` `text-brand-purple` (#8B5CF6)
- **Pink**: `bg-brand-pink` `text-brand-pink` (#EC4899)
- **Cyan**: `bg-brand-cyan` `text-brand-cyan` (#06B6D4)
- **Blue**: `bg-brand-blue` `text-brand-blue` (#3B82F6)
- **Green**: `bg-brand-green` `text-brand-green` (#10B981)

### Semantic Colors
- **Primary**: `bg-primary` (Purple)
- **Secondary**: `bg-secondary` (Pink)
- **Accent**: `bg-accent` (Cyan)
- **Success**: `bg-success` (Green)
- **Destructive**: `bg-destructive` (Red)
- **Warning**: `bg-warning` (Amber)
- **Info**: `bg-info` (Blue)

## ✅ Best Practices

1. **Use semantic color names** over specific color values when possible
2. **Maintain contrast ratios** for accessibility (minimum 4.5:1 for text)
3. **Use gradients sparingly** for hero sections and featured content
4. **Test in both light and dark modes**
5. **Follow the spacing scale** consistently
6. **Use brand purple for primary actions**
7. **Use brand green for success states**

## 🚫 Don'ts

❌ Don't mix old color schemes with new brand colors
❌ Don't use arbitrary color values
❌ Don't override brand colors
❌ Don't use too many gradients on one page
❌ Don't ignore dark mode styling

## 📚 Resources

- Full guidelines: [BRAND_GUIDELINES.md](../../BRAND_GUIDELINES.md)
- Design tokens: [design-tokens.css](./design-tokens.css)
- Global styles: [global.css](./global.css)




