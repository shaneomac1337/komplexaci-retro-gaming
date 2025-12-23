# CSS Design System - Quick Reference

## File Structure

```
src/styles/
├── globals.css          # Core tokens, reset, base styles
├── animations.css       # Keyframes and animation utilities
├── utilities.css        # Layout and styling utilities
└── themes/
    └── cyberpunk.css    # Component styles and theme
```

## Common Patterns

### Page Layout

```html
<div class="container py-16">
  <h1 class="text-4xl font-heading neon-text text-center mb-8">
    Page Title
  </h1>
  <!-- Content -->
</div>
```

### Grid of Cards

```html
<div class="grid grid-auto-fill gap-6">
  <div class="card-game"><!-- Game card --></div>
  <div class="card-game"><!-- Game card --></div>
</div>
```

### Flex Row with Space Between

```html
<div class="flex items-center justify-between">
  <h2>Title</h2>
  <button class="btn-primary">Action</button>
</div>
```

### Centered Content

```html
<div class="flex items-center justify-center min-h-screen">
  <div class="glass-card max-w-md">
    <!-- Centered content -->
  </div>
</div>
```

## Color Usage

### Text Colors
- `text-primary` - White (#ffffff)
- `text-secondary` - Gray (#a0a0a0)
- `text-muted` - Muted gray (#6b6b6b)
- `text-cyan` - Cyan (#00ffff)
- `text-magenta` - Magenta (#ff00ff)

### Background Colors
- `bg-primary` - Deep black (#0a0a0f)
- `bg-secondary` - Dark navy (#1a1a2e)
- `bg-tertiary` - Midnight blue (#16213e)

### Neon Effects
- `neon-text` - Glowing cyan text
- `neon-glow-cyan` - Cyan box glow
- `neon-border-cyan` - Cyan border with glow

## Common Components

### Button Variations
```html
<button class="btn-primary">Primary</button>
<button class="btn-secondary">Secondary</button>
<button class="btn-ghost">Ghost</button>
<button class="btn-outline">Outline</button>
<button class="btn-primary btn-lg">Large</button>
<button class="btn-primary btn-sm">Small</button>
```

### Card Variations
```html
<div class="glass-card">Basic glass card</div>
<div class="card-interactive">Hover glow effect</div>
<div class="card-game">Game display card</div>
```

### Badge Examples
```html
<span class="badge badge-cyan">New</span>
<span class="badge badge-ps1">PS1</span>
<span class="badge badge-outline">Filter</span>
```

## Spacing

### Margin/Padding Scale
- `m-0, p-0` = 0px
- `m-1, p-1` = 4px
- `m-2, p-2` = 8px
- `m-3, p-3` = 12px
- `m-4, p-4` = 16px
- `m-6, p-6` = 24px
- `m-8, p-8` = 32px

### Common Spacing Patterns
```html
<!-- Section spacing -->
<section class="py-16">...</section>

<!-- Card padding -->
<div class="p-6">...</div>

<!-- Content margins -->
<div class="mb-4">...</div>
<div class="mt-8">...</div>

<!-- Horizontal centering -->
<div class="mx-auto">...</div>
```

## Typography

### Heading Sizes
```html
<h1 class="text-4xl">Large heading</h1>
<h2 class="text-3xl">Section heading</h2>
<h3 class="text-2xl">Subsection heading</h3>
```

### Text Styling
```html
<p class="text-lg">Large paragraph</p>
<p class="text-sm text-muted">Small muted text</p>
<code class="font-mono">Code text</code>
```

## Animations

### Entrance Animations
```html
<div class="animate-fade-in">Fades in</div>
<div class="animate-slide-in-right">Slides from right</div>
<div class="animate-zoom-in delay-200">Zooms in with delay</div>
```

### Continuous Animations
```html
<div class="animate-pulse">Pulsing glow</div>
<div class="animate-float">Floating motion</div>
<div class="animate-neon-flicker">Flickering neon</div>
```

### Hover Effects
```html
<div class="hover-glow">Glows on hover</div>
<div class="hover-float">Lifts on hover</div>
<div class="hover-scale">Scales on hover</div>
```

## Responsive Design

### Breakpoint Prefixes
- `sm:` = 480px+
- `md:` = 768px+
- `lg:` = 1024px+
- `xl:` = 1280px+

### Common Responsive Patterns
```html
<!-- Responsive columns -->
<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">...</div>

<!-- Responsive text -->
<h1 class="text-2xl md:text-4xl lg:text-5xl">...</h1>

<!-- Hide/show at breakpoints -->
<div class="hidden md:block">Desktop only</div>

<!-- Responsive spacing -->
<div class="p-4 md:p-8 lg:p-12">...</div>
```

## Flexbox Cheatsheet

```html
<!-- Row layout -->
<div class="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Column layout -->
<div class="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Centered content -->
<div class="flex items-center justify-center">
  <div>Centered</div>
</div>

<!-- Space between -->
<div class="flex items-center justify-between">
  <div>Left</div>
  <div>Right</div>
</div>

<!-- Wrap items -->
<div class="flex flex-wrap gap-2">
  <span>Tag 1</span>
  <span>Tag 2</span>
</div>
```

## Grid Cheatsheet

```html
<!-- Fixed columns -->
<div class="grid grid-cols-3 gap-4">
  <div>Col 1</div>
  <div>Col 2</div>
  <div>Col 3</div>
</div>

<!-- Auto-fill responsive -->
<div class="grid grid-auto-fill gap-6">
  <!-- Items automatically fill available space -->
</div>

<!-- Responsive columns -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <!-- 1 col mobile, 2 tablet, 4 desktop -->
</div>

<!-- Span columns -->
<div class="grid grid-cols-3">
  <div class="col-span-2">Wide column</div>
  <div>Narrow column</div>
</div>
```

## Form Elements

```html
<!-- Text input -->
<input type="text" class="input" placeholder="Enter text...">

<!-- Search input -->
<input type="search" class="input-search" placeholder="Search...">

<!-- Input with icon -->
<div class="input-group">
  <span class="input-icon">🔍</span>
  <input type="text" class="input" placeholder="Search...">
</div>

<!-- Textarea -->
<textarea class="input" rows="4"></textarea>

<!-- Select -->
<select class="input">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

## Accessibility Helpers

```html
<!-- Screen reader only -->
<span class="sr-only">Hidden from view, visible to screen readers</span>

<!-- Skip link -->
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

## CSS Variable Access

### In CSS
```css
.my-component {
  color: var(--color-neon-cyan);
  padding: var(--spacing-4);
  font-family: var(--font-heading);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-neon-cyan);
  transition: all var(--transition-base);
}
```

### In Inline Styles (React)
```jsx
<div style={{
  backgroundColor: 'var(--color-bg-secondary)',
  padding: 'var(--spacing-6)',
  borderRadius: 'var(--radius-lg)'
}}>
  Content
</div>
```

## Performance Tips

1. **Use utility classes** - Faster than inline styles
2. **Combine utilities** - `flex items-center gap-4` instead of custom CSS
3. **Leverage CSS variables** - Theme changes are instant
4. **Respect reduced motion** - Animations automatically disabled for users who prefer reduced motion
5. **Use semantic HTML** - Better for accessibility and SEO

## Common Mistakes to Avoid

1. ❌ Don't use hardcoded colors - Use CSS variables
2. ❌ Don't use arbitrary spacing - Use spacing scale
3. ❌ Don't remove focus styles - Use `.focus-visible`
4. ❌ Don't nest too many utility classes - Consider creating a component class
5. ❌ Don't use `!important` - Specificity should handle it

## Debug Helpers

```html
<!-- Temporarily add visible borders to debug layout -->
<div style="border: 1px solid red;">
  <div style="border: 1px solid blue;">...</div>
</div>

<!-- Use browser DevTools to inspect CSS variables -->
<!-- Open DevTools → Elements → Computed → Filter for "--" -->
```
