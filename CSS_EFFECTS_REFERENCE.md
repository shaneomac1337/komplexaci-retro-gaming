# CSS Effects Quick Reference
## Ready-to-Use CSS Classes from effects.css

---

## CRT Monitor Effects

### `.crt-effect`
Creates authentic CRT monitor scanlines
```html
<div class="crt-effect">
  <!-- Your content with scanlines -->
</div>
```
**Use on:** Main containers, hero sections, game screens

---

### `.crt-glow`
Adds CRT screen glow effect
```html
<div class="crt-glow">
  <!-- Glowing content -->
</div>
```
**Use on:** Cards, modals, featured content

---

### `.crt-flicker`
Subtle CRT flicker animation
```html
<span class="crt-flicker">Flickering Text</span>
```
**Use on:** Text, headings, retro UI elements

---

### `.rgb-split`
Chromatic aberration effect
```html
<h1 class="rgb-split" data-text="TITLE">TITLE</h1>
```
**Note:** Requires `data-text` attribute
**Use on:** Hero titles, important headings

---

## Particle Effects

### `.particles-container`
Container for custom particles
```html
<div class="particles-container">
  <div class="particle"></div>
  <div class="particle magenta"></div>
  <div class="particle purple"></div>
</div>
```
**Use on:** Hero backgrounds, section overlays

---

### `.neon-dust`
Floating neon dust effect
```html
<div class="neon-dust"></div>
```
**Use on:** Background layers, ambient effects

---

## Depth & 3D Effects

### `.parallax-layer`
Enables parallax scrolling
```html
<div class="depth-container">
  <div class="parallax-layer" style="--depth: -100px; --scale: 1.1">
    Background
  </div>
  <div class="parallax-layer" style="--depth: 0px; --scale: 1">
    Content
  </div>
  <div class="parallax-layer" style="--depth: 100px; --scale: 0.9">
    Foreground
  </div>
</div>
```
**Use on:** Hero sections, landing pages

---

### `.tilt-hover`
3D tilt effect on mouse movement
```html
<div class="tilt-hover" style="--tilt-x: 5deg; --tilt-y: 5deg">
  Tiltable card
</div>
```
**Use on:** Cards, buttons, interactive elements

---

### `.depth-shadow`
Multi-layer depth shadows
```html
<div class="depth-shadow">Content with depth</div>
```
**Use on:** Cards, modals, elevated elements

---

### `.depth-shadow-glow`
Depth shadows with neon glow
```html
<div class="depth-shadow-glow">Glowing elevated content</div>
```
**Use on:** Featured cards, hero elements

---

## Holographic Effects

### `.holographic`
Holographic sheen animation
```html
<div class="holographic">
  Card with holographic overlay
</div>
```
**Use on:** Premium cards, special items

---

### `.iridescent`
Color-shifting iridescent effect
```html
<div class="iridescent">Rainbow shimmer</div>
```
**Use on:** Backgrounds, accent elements

---

## Energy & Light Effects

### `.energy-ring`
Pulsing energy ring
```html
<button class="energy-ring">
  Button with energy ring
</button>
```
**Use on:** Buttons, interactive elements

---

### `.light-beam`
Rotating light beam
```html
<div class="light-beam">
  Content with rotating beam
</div>
```
**Use on:** Hero sections, spotlights

---

### `.electric-arc`
Electric arc zap effect
```html
<div class="electric-arc">
  Element with electric zap
</div>
```
**Use on:** Headers, dividers, accent lines

---

## Loading & Transitions

### `.data-stream`
Data stream loading animation
```html
<div class="data-stream">
  Loading content
</div>
```
**Use on:** Loading states, processing indicators

---

### `.matrix-rain`
Matrix-style falling code
```html
<div class="matrix-rain"></div>
```
**Use on:** Background overlays, loading screens

---

### `.pixel-dissolve-enter` / `.pixel-dissolve-exit`
Pixelated transition effects
```html
<div class="pixel-dissolve-enter">
  Entering content
</div>
```
**Use on:** Page transitions, modal animations

---

## Interactive Micro-Interactions

### `.magnetic-hover`
Magnetic attraction effect
```html
<button class="magnetic-hover">
  Magnetic button
</button>
```
**Use on:** Buttons, links, interactive cards

---

### `.ripple`
Click ripple effect
```html
<button class="ripple">
  Click me for ripple
</button>
```
**Use on:** Buttons, clickable cards

---

### `.neon-underline`
Growing neon underline on hover
```html
<a href="#" class="neon-underline">
  Hover for underline
</a>
```
**Use on:** Links, navigation items

---

### `.glitch-button`
Glitch effect on hover
```html
<button class="glitch-button" data-text="PLAY">
  PLAY
</button>
```
**Note:** Requires `data-text` attribute
**Use on:** Action buttons, CTAs

---

## Background Animations

### `.gradient-mesh`
Animated gradient mesh background
```html
<div class="gradient-mesh"></div>
```
**Use on:** Section backgrounds, hero overlays

---

### `.noise-texture`
Film grain/noise overlay
```html
<div class="noise-texture">
  Content with grain
</div>
```
**Use on:** Sections, cards, retro elements

---

## Combining Effects

### Example 1: Ultimate Game Card
```html
<div class="tilt-hover depth-shadow-glow holographic">
  <div class="crt-effect">
    <img src="game.jpg" alt="Game" />
  </div>
  <div class="energy-ring">
    <button class="glitch-button ripple" data-text="PLAY">
      PLAY
    </button>
  </div>
</div>
```

---

### Example 2: Immersive Hero Section
```html
<section class="crt-effect">
  <div class="gradient-mesh"></div>
  <div class="particles-container">
    <div class="particle"></div>
    <div class="particle magenta"></div>
  </div>
  <div class="matrix-rain"></div>
  <h1 class="rgb-split crt-flicker" data-text="RETRO GAMING">
    RETRO GAMING
  </h1>
  <button class="energy-ring magnetic-hover ripple">
    Start Playing
  </button>
</section>
```

---

### Example 3: Loading Screen
```html
<div class="crt-effect noise-texture">
  <div class="matrix-rain"></div>
  <div class="data-stream">
    <div class="spinner"></div>
    <p class="crt-flicker">Loading...</p>
  </div>
</div>
```

---

## Customization with CSS Variables

Many effects support customization via CSS custom properties:

```css
.custom-effect {
  /* Adjust intensity */
  --intensity: 0.8;

  /* Adjust speed */
  --speed: 1.5;

  /* Adjust colors */
  --primary-color: rgba(0, 255, 255, 1);
  --secondary-color: rgba(255, 0, 255, 1);

  /* Adjust depth */
  --depth: -50px;
  --scale: 1.05;

  /* Adjust tilt */
  --tilt-x: 10deg;
  --tilt-y: 10deg;

  /* Adjust particle drift */
  --drift: 150px;
  --duration: 12s;
  --delay: 2s;
}
```

---

## Performance Tips

### ✓ DO
- Use effects sparingly (3-5 per view)
- Combine related effects
- Apply to container elements
- Test on target devices

### ✗ DON'T
- Stack 10+ effects on one element
- Apply heavy effects to lists
- Animate large images
- Ignore reduced motion

---

## Browser Compatibility

All effects include fallbacks:

```css
/* Progressive enhancement example */
.card {
  background: #1e293b; /* Fallback */
}

@supports (backdrop-filter: blur(10px)) {
  .card {
    background: rgba(30, 41, 59, 0.8);
    backdrop-filter: blur(10px);
  }
}
```

---

## Effect Intensity Control

Global intensity control:

```css
:root {
  --global-intensity: 1; /* 0-1 scale */
}

/* Reduce all effects to 50% */
:root {
  --global-intensity: 0.5;
}

/* Disable all effects */
:root {
  --global-intensity: 0;
}
```

---

## Common Patterns

### Pattern 1: Card with Full Effects
```html
<div class="tilt-hover depth-shadow-glow">
  <div class="holographic">
    <div class="crt-effect">
      <!-- Card content -->
    </div>
  </div>
</div>
```

---

### Pattern 2: Glowing Button
```html
<button class="energy-ring magnetic-hover ripple">
  <span class="neon-text">Action</span>
</button>
```

---

### Pattern 3: Hero Title
```html
<h1 class="rgb-split crt-flicker" data-text="TITLE">
  TITLE
</h1>
```

---

### Pattern 4: Loading State
```html
<div class="data-stream">
  <div class="spinner"></div>
</div>
```

---

### Pattern 5: Background Layer
```html
<div class="section">
  <div class="gradient-mesh"></div>
  <div class="matrix-rain"></div>
  <div class="noise-texture"></div>
  <!-- Content -->
</div>
```

---

## Troubleshooting

### Effect Not Visible?
1. Check z-index stacking
2. Verify parent has position: relative
3. Ensure enough contrast
4. Check browser support

### Performance Issues?
1. Reduce particle count
2. Lower intensity
3. Remove stacked effects
4. Check for other bottlenecks

### Animation Not Working?
1. Import effects.css
2. Check @keyframes definition
3. Verify no reduced-motion
4. Test in supported browser

---

## Next Steps

1. Browse `effects.css` for all available effects
2. Test effects in isolation
3. Combine effects strategically
4. Customize with CSS variables
5. Monitor performance
6. Respect user preferences

**Happy styling!** ✨
