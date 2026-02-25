# Phase 4: UI and Responsive — Research

**Researched:** 2026-02-25
**Domain:** React DOM UI, Tailwind CSS v4 responsive layout, CSS/SVG animation, touch event isolation, mobile bottom sheet
**Confidence:** HIGH (all major claims verified against official docs or authoritative sources)

---

## Summary

Phase 4 completes the 2D overlay layer: a navigation sidebar, timeline speed control, atmospheric composition bar chart, footer badge, and a fully responsive layout that shifts to a mobile-first hamburger + bottom sheet pattern. All components integrate with the existing two-context pattern (SceneContext for UI reactivity, Zustand for animation-loop reads) and must not disturb the 3D canvas.

The heaviest technical challenge is touch event isolation: HTML overlays positioned over the Canvas must consume their own touch events without rotating the 3D scene behind them. The proven approach is `touch-action: none` on the Canvas (already applied in App.jsx) combined with `onTouchStart={e => e.stopPropagation()}` (or the equivalent pointer-event handler) on each DOM panel. The Canvas's existing `pointer-events-none` root div pattern, with individual panels re-enabling `pointer-events-auto`, is already correct architecture for this.

The composition bar chart is a pure CSS width-transition approach using `transition-[width]` on bar fill divs driven by the `body.composition` array already present in planets.js for every body. No chart library is needed. The speed slider is a styled `<input type="range">` that dispatches to both SceneContext (`SET_SPEED`) and Zustand (`setSpeed`) on every `onChange` event, matching the existing dual-dispatch pattern used by keyboard shortcuts for `TOGGLE_PAUSE`.

**Primary recommendation:** Build all components in pure React + Tailwind v4. No new runtime libraries needed. The only net-new pattern is the CSS animated bar chart and the mobile bottom sheet (CSS translate-y transition, no third-party library required).

---

## Standard Stack

### Core (already installed — zero new deps required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | ^19.2.0 | Component model, useState, useEffect | Already present |
| Tailwind CSS v4 | ^4.2.1 | Utility-first styling, responsive breakpoints, transitions | Already present |
| Zustand v5 | ^5.0.11 | Animation-loop state (speed, isPaused) | Already present |
| SceneContext (custom) | — | UI-reactive state (selectedPlanet, speed, isPaused) | Already present |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `<input type="range">` | — | Speed slider | No external dep needed; styled with Tailwind arbitrary pseudo-selectors |
| CSS `transition-[width]` | Tailwind built-in | Bar chart fill animation | Animates bar widths on mount via useEffect width toggle |
| CSS `translate-y-full` / `translate-y-0` | Tailwind built-in | Bottom sheet slide-in on mobile | Same pattern as InfoPanel's translate-x slide |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled bar chart | Recharts / D3 | Recharts/D3 add 50-200 KB for a 5-bar chart that takes 30 lines of CSS — overkill |
| Hand-rolled bottom sheet | react-modal-sheet / react-spring-bottom-sheet | react-spring-bottom-sheet requires react-spring which is not in the project; hand-roll is 50 lines |
| CSS translate transition | GSAP for bottom sheet | GSAP is already present but adds complexity; CSS transitions are sufficient for a simple slide |
| Tailwind `md:` breakpoint | Custom @theme breakpoint | `md` (48rem / 768px) is exactly right for tablet/phone divide |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

New files to create in Phase 4:

```
src/
├── components/
│   └── ui/
│       ├── NavSidebar.jsx        # planet list + Sun, usePlanetSelect, hamburger toggle
│       ├── TimelineControl.jsx   # speed slider + play/pause button
│       ├── Footer.jsx            # "Created by AU Brussel" badge
│       └── InfoPanel.jsx         # EXISTING — add CompositionChart section
├── hooks/
│   └── usePlanetSelect.js        # thin hook: dispatches SELECT_PLANET to SceneContext
```

`CompositionChart` can be an internal sub-component of InfoPanel.jsx rather than its own file, since it is only ever rendered inside InfoPanel.

### Pattern 1: Speed Slider — Dual Dispatch

The slider must update both SceneContext (for UI reactivity — the slider thumb reflects current speed) and Zustand (for the useFrame animation loop to read synchronously). This is the same dual-dispatch contract already used by keyboard Space for TOGGLE_PAUSE.

```jsx
// Source: existing pattern from useKeyboardShortcuts.js
import { useSceneDispatch } from '../../context/SceneContext'
import { useSceneStore } from '../../store/sceneStore'

function TimelineControl() {
  const dispatch = useSceneDispatch()
  const speed = useSceneStore((s) => s.speed)
  const isPaused = useSceneStore((s) => s.isPaused)

  function handleSpeedChange(e) {
    const value = Number(e.target.value)
    // Dual dispatch: UI + animation loop
    dispatch({ type: 'SET_SPEED', payload: value })
    useSceneStore.getState().setSpeed(value)
  }

  function handlePauseToggle() {
    dispatch({ type: 'TOGGLE_PAUSE' })
    useSceneStore.getState().togglePause()
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto">
      <button onClick={handlePauseToggle}>{isPaused ? '▶' : '⏸'}</button>
      <input
        type="range" min={0} max={100} step={1}
        value={speed}
        onChange={handleSpeedChange}
        className="w-40 accent-blue-400"
      />
      <span>{speed}×</span>
    </div>
  )
}
```

**Note:** `accent-blue-400` is the simplest Tailwind v4-compatible way to tint native range inputs across Chrome, Firefox, and Safari without writing pseudo-element selectors.

### Pattern 2: NavSidebar — usePlanetSelect hook

NavSidebar reads planet list from the `PLANETS` array + `SUN` and dispatches SELECT_PLANET. Create a thin hook to centralize this logic so NavSidebar and any other trigger point (keyboard shortcuts, future search) share one dispatch call site.

```jsx
// src/hooks/usePlanetSelect.js
import { useSceneDispatch } from '../context/SceneContext'
import { useCallback } from 'react'

export function usePlanetSelect() {
  const dispatch = useSceneDispatch()
  return useCallback((id) => {
    dispatch({ type: 'SELECT_PLANET', payload: id })
  }, [dispatch])
}

// Usage in NavSidebar
function NavSidebar({ isOpen }) {
  const select = usePlanetSelect()
  const { selectedPlanet } = useSceneContext()
  // ...
  return (
    <nav className={`... ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      {[SUN, ...PLANETS].map((body) => (
        <button
          key={body.id}
          onClick={() => select(body.id)}
          className={selectedPlanet === body.id ? 'bg-white/15' : ''}
        >
          {body.name}
        </button>
      ))}
    </nav>
  )
}
```

### Pattern 3: Animated Composition Bar Chart (CSS width transition)

The `composition` array (already on all planet/SUN data objects) has shape `{ name: string, percent: number }[]`. Render one row per entry. Bar fill starts at `width: 0%` on mount, then transitions to `width: ${percent}%` via a single `useEffect` that flips a boolean `mounted` state after a short delay (one rAF tick is enough). This ensures the CSS transition fires after first paint.

```jsx
// CompositionChart — inline in InfoPanel.jsx
import { useState, useEffect } from 'react'

function CompositionChart({ composition }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    // Reset so re-animation fires when switching planets
    setAnimated(false)
    const id = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(id)
  }, [composition])

  return (
    <section>
      <h3 className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">
        Composition
      </h3>
      <div className="flex flex-col gap-2">
        {composition.map(({ name, percent }) => (
          <div key={name} className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[10px] text-white/50">
              <span>{name}</span>
              <span>{percent}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400/70 rounded-full transition-[width] duration-700 ease-out"
                style={{ width: animated ? `${percent}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

**Why `requestAnimationFrame` instead of `setTimeout(fn, 0)`:** rAF guarantees the DOM has painted the `0%` state before setting `animated=true`. A 0ms timeout can race with the browser's paint cycle and the transition never fires.

**Why `transition-[width]`:** Tailwind v4's default `transition` class does NOT include `width`. Must use arbitrary `transition-[width]` (or `transition-all`, which is heavier). Confirmed by official Tailwind docs.

### Pattern 4: Responsive Layout — Desktop sidebar + mobile hamburger/bottom sheet

Tailwind v4 default breakpoints (source: tailwindcss.com/docs/responsive-design):
- Mobile-first: unprefixed utilities apply at all sizes
- `md:` = 48rem (768px) and above — the correct divide for phone vs tablet/desktop

**Desktop (md and above):**
- NavSidebar: `fixed left-0 top-0 h-full w-56 translate-x-0` — always visible, pinned
- InfoPanel: `fixed right-0 top-0 h-full w-80 translate-x-full md:...` — slides from right (existing behavior, unchanged)

**Mobile (below md):**
- NavSidebar: `fixed left-0 top-0 h-full w-56 -translate-x-full md:translate-x-0` — hidden by default, shown when `isOpen=true`
- Hamburger button: `fixed top-4 left-4 z-30 md:hidden` — only visible on mobile
- InfoPanel: convert to bottom sheet by adding mobile-specific classes: `md:top-0 md:right-0 md:h-full md:w-80 md:translate-x-full` for desktop slide-in; for mobile: `fixed bottom-0 left-0 right-0 h-[60vh] translate-y-full md:translate-y-0` slide-up

The critical insight is that one component can do both layouts with a single class string split on `md:` prefix. No separate MobileInfoPanel component needed.

**Bottom sheet CSS pattern:**
```jsx
// InfoPanel adds mobile classes alongside existing desktop classes
<div
  className={[
    // Mobile: bottom sheet
    'fixed bottom-0 left-0 right-0 h-[60vh]',
    'md:top-0 md:right-0 md:bottom-auto md:left-auto md:h-full md:w-80',
    // Visibility state (both layouts)
    isVisible ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full',
    'transition-transform duration-300 ease-in-out',
    'bg-black/80 backdrop-blur-sm z-20 pointer-events-auto',
  ].join(' ')}
>
```

### Pattern 5: Touch Event Isolation

**The problem:** OrbitControls listens for pointer/touch events on the Canvas. HTML panels positioned over the Canvas (via absolute/fixed positioning) must not pass their drag events through to OrbitControls.

**The solution (two-layer defense):**

Layer 1 — CSS (already in place in App.jsx):
- Canvas has `style={{ touchAction: 'none' }}` — tells browser to hand all touch events to JS, not scroll
- Overlay root div has `pointer-events: none` — prevents accidental Canvas event interference
- Each panel re-enables `pointer-events: auto` on itself

Layer 2 — React event handlers on panels (NEW in Phase 4):
```jsx
// Add to NavSidebar, InfoPanel, TimelineControl root divs
<div
  className="pointer-events-auto ..."
  onTouchStart={e => e.stopPropagation()}
  onTouchMove={e => e.stopPropagation()}
  onPointerDown={e => e.stopPropagation()}
>
```

**Why stopPropagation on DOM elements stops Canvas events:** The Canvas's OrbitControls attaches listeners to `canvas.domElement` (the HTMLCanvasElement). DOM events bubble from the innermost element upward. By calling `stopPropagation()` on the panel div, the pointer/touch event never reaches the canvas element, so OrbitControls never sees it.

**iOS Safari note:** `touch-action: none` CSS has incomplete support on iOS Safari (verified: github.com/pmndrs/use-gesture/issues/486 and web.dev). Calling `e.stopPropagation()` in `onTouchStart` and `onTouchMove` is the reliable cross-browser fallback. The existing `touchAction: 'none'` on the Canvas is still correct and helps on Chrome/Firefox. Manual iOS Safari testing is required post-implementation to confirm panel drag does not rotate scene.

### Anti-Patterns to Avoid

- **Dispatching speed only to SceneContext or only to Zustand:** The animation loop reads `useSceneStore.getState()` synchronously — if only SceneContext is updated, useFrame sees stale speed.
- **Using a chart library (Recharts, D3, visx) for the composition bars:** 5 percentage bars are 30 lines of CSS. Chart libraries add 50-200KB and introduce peer dep complexity.
- **Separate MobileInfoPanel component:** Managing two separate components that render the same data doubles maintenance surface. Use responsive Tailwind classes on a single InfoPanel component.
- **Using `setTimeout(fn, 0)` for bar chart animation trigger:** Can race with browser paint, causing the CSS transition to start from `percent%` directly (no animation visible). Use `requestAnimationFrame` instead.
- **Relying on `transition` (default) for width:** Tailwind's default `transition` does NOT include `width`. Use `transition-[width]` (arbitrary) or `transition-all`.
- **Using `pointer-events-none` on panels:** Panel elements themselves must have `pointer-events-auto` — the parent overlay div is `pointer-events-none`, not the interactive panels.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Input range slider | Custom slider with mouse/touch drag | Native `<input type="range">` + `accent-*` Tailwind class | Browser-native, accessible, zero JS; `accent-blue-400` tints thumb/track in all modern browsers |
| Breakpoint detection | JS `window.matchMedia` listener | Tailwind `md:` prefix classes | CSS media queries handle this declaratively; no JS resize listener needed |
| Touch event prevention | Custom touchstart/pointermove capture phase handler | `onTouchStart/onTouchMove + stopPropagation` on panel div | Standard DOM event model; no need for capture phase or manual listener attachment |
| Bar chart | D3 / Recharts | CSS `transition-[width]` divs | 5 bars at known percents require no library; CSS handles interpolation |

**Key insight:** The entire UI is achievable with HTML/CSS/Tailwind. The phase adds 0 new npm packages.

---

## Common Pitfalls

### Pitfall 1: Speed Slider Out of Sync

**What goes wrong:** Slider `value` prop is read from one store (e.g., Zustand `speed`), but `onChange` only dispatches to SceneContext. The slider appears to lag or jump back.

**Why it happens:** The slider is a controlled component (`value={speed}`). If `speed` in Zustand and `speed` in SceneContext diverge, whichever one the slider reads will show the "wrong" position.

**How to avoid:** Always dual-dispatch: `dispatch({ type: 'SET_SPEED', payload: value })` AND `useSceneStore.getState().setSpeed(value)` in the same handler. Read the slider's displayed value from Zustand (`useSceneStore((s) => s.speed)`) since that's the animation source of truth.

**Warning signs:** Slider thumb snaps back on drag, or speed in 3D scene doesn't match displayed value.

### Pitfall 2: Bar Chart Width Transition Doesn't Fire

**What goes wrong:** Bars render at full width immediately (no animation), or always show 0%.

**Why it happens:** CSS transitions only fire when a property *changes* between paints. If `width` starts at `percent%` (already mounted at final value), there is nothing to transition. If using `setTimeout(fn, 0)`, it may fire before the browser paints the `0%` state.

**How to avoid:** Use `requestAnimationFrame` to toggle `animated` state. On planet switch, reset `animated` to `false` synchronously in `useEffect`, then `requestAnimationFrame(() => setAnimated(true))`. This guarantees a paint at `0%` before the transition to `percent%` begins.

**Warning signs:** Bars appear fully filled on first render with no sweep animation.

### Pitfall 3: NavSidebar Stays Open After Planet Selection on Mobile

**What goes wrong:** User taps a planet in the nav; the camera flies to it, but the sidebar remains open, covering the scene.

**Why it happens:** The `isOpen` state lives in App.jsx or NavSidebar — no one closes it on planet selection.

**How to avoid:** In `usePlanetSelect` (or in NavSidebar's click handler), call a `closeSidebar` callback after dispatching `SELECT_PLANET`. Or lift `isNavOpen` state to App.jsx and pass both the setter and the sidebar's open state down as props.

**Warning signs:** Mobile users can't see the 3D scene after clicking a planet.

### Pitfall 4: InfoPanel Fails to Switch to Bottom Sheet on Mobile

**What goes wrong:** InfoPanel slides in from the right on mobile (desktop behavior), overlapping content badly on small screens.

**Why it happens:** The InfoPanel only has right-slide transform classes. Mobile-specific override classes using `md:` prefix were not applied.

**How to avoid:** The single `className` string must include BOTH the mobile-first classes (bottom sheet: `fixed bottom-0 left-0 right-0 h-[60vh]`) AND the desktop overrides (`md:top-0 md:right-0 md:bottom-auto md:left-auto md:h-full md:w-80`). The transform for hide/show must also be responsive: `translate-y-full md:translate-y-0 md:translate-x-full` (hidden state).

**Warning signs:** Test in Chrome DevTools mobile viewport — if the panel slides from the right on a 375px viewport, the responsive classes are wrong.

### Pitfall 5: Touch Events Still Rotate Scene Through Panel

**What goes wrong:** Dragging a finger on the NavSidebar or InfoPanel also rotates the 3D scene behind it.

**Why it happens:** OrbitControls listens for `pointerdown` on the Canvas. If the HTML panel's touch events bubble up to the canvas, OrbitControls intercepts them. `pointer-events: none` on the overlay root doesn't help here because the interactive panels re-enable `pointer-events: auto` — and touch events bubble from the panel up through the DOM, eventually reaching the Canvas's event listeners.

**How to avoid:** Add `onTouchStart={e => e.stopPropagation()}` and `onTouchMove={e => e.stopPropagation()}` to every interactive panel root div (NavSidebar, InfoPanel, TimelineControl). For pointer events (Chrome desktop simulation), also add `onPointerDown={e => e.stopPropagation()}`.

**Warning signs:** Verified only by physical mobile device test or Chrome DevTools touch simulation — dragging a finger across the panel while watching the camera rotation.

### Pitfall 6: Hamburger Icon Outside `md:hidden` Scope

**What goes wrong:** The hamburger button appears on desktop, floating over the pinned sidebar.

**Why it happens:** The hamburger button wrapper lacks `md:hidden`.

**How to avoid:** `<button className="md:hidden fixed top-4 left-4 z-30 ...">` — the `md:hidden` class makes it vanish at 768px+.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Tailwind v4: transition-[width] for animated bars

```jsx
// Source: tailwindcss.com/docs/transition-property (arbitrary value syntax)
// "transition" default does NOT include width — must use transition-[width]
<div
  className="h-1.5 bg-blue-400/70 rounded-full transition-[width] duration-700 ease-out"
  style={{ width: animated ? `${percent}%` : '0%' }}
/>
```

### Tailwind v4: Responsive sidebar pattern

```jsx
// Source: tailwindcss.com/docs/responsive-design — mobile-first
// md = 48rem / 768px — sidebar pinned above this, hidden below
<nav
  className={[
    'fixed top-0 left-0 h-full w-56',
    'transition-transform duration-300',
    'md:translate-x-0',                // always visible on desktop
    isNavOpen ? 'translate-x-0' : '-translate-x-full', // mobile toggle
  ].join(' ')}
>
```

### Tailwind v4: max-* variant for range-only styles

```jsx
// Source: tailwindcss.com/docs/responsive-design (targeting breakpoint ranges)
// "md:max-lg:..." — only applies between md and lg
// For bottom sheet that ONLY shows on mobile:
<div className="md:hidden ..."> {/* mobile-only bottom sheet handle */}
```

### Touch isolation on DOM panels

```jsx
// Pattern verified by three.js/R3F community and MDN stopPropagation docs
<div
  className="pointer-events-auto ..."
  onTouchStart={e => e.stopPropagation()}
  onTouchMove={e => e.stopPropagation()}
  onPointerDown={e => e.stopPropagation()}
>
  {/* panel content */}
</div>
```

### Dual dispatch for speed slider (extending existing pattern)

```jsx
// Source: existing useKeyboardShortcuts.js — same dual-dispatch contract
function handleSpeedChange(e) {
  const value = Number(e.target.value)
  dispatch({ type: 'SET_SPEED', payload: value })      // SceneContext — UI
  useSceneStore.getState().setSpeed(value)              // Zustand — animation loop
}
```

### Range input accent tint (no pseudo-selectors needed)

```jsx
// Source: MDN accent-color, Tailwind accent-* utilities
// Works in Chrome 93+, Firefox 92+, Safari 15.4+ — all major current browsers
<input
  type="range" min={0} max={100} step={1}
  value={speed}
  onChange={handleSpeedChange}
  className="w-40 accent-blue-400 cursor-pointer"
/>
```

### CompositionChart full pattern

```jsx
function CompositionChart({ composition }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setAnimated(false)
    const id = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(id)
  }, [composition])

  if (!composition || composition.length === 0) return null

  return (
    <section>
      <h3 className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">
        Composition
      </h3>
      <div className="flex flex-col gap-2">
        {composition.map(({ name, percent }) => (
          <div key={name}>
            <div className="flex justify-between text-[10px] text-white/50 mb-0.5">
              <span>{name}</span><span>{percent}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400/70 rounded-full transition-[width] duration-700 ease-out"
                style={{ width: animated ? `${percent}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS `transition` for width | `transition-[width]` (Tailwind arbitrary) | Tailwind v3+ | Default `transition` never included `width`; arbitrary syntax is the canonical fix |
| `-webkit-slider-thumb` pseudo-element styling | `accent-color` CSS property / Tailwind `accent-*` | Chrome 93+, Safari 15.4+ (2021) | Single property tints thumb + track in all browsers; no cross-browser pseudo-element rules needed |
| JS `window.matchMedia` for breakpoints | Tailwind `md:` prefix classes | Tailwind v1+ | Pure CSS; zero JS resize event overhead |
| Separate mobile/desktop components | Single component with responsive classes | Tailwind v2+ | Reduces code; Tailwind's mobile-first model makes this idiomatic |
| `touchmove.preventDefault()` | `stopPropagation()` on panel div | ~2020 (iOS passive listener restrictions) | `preventDefault()` on passive listeners throws errors in modern browsers; `stopPropagation()` is safe |

**Deprecated/outdated:**
- `webkit-appearance: none` + full custom `:-webkit-slider-*` ruleset: Replaced by `accent-color`; still needed for full custom styling, but overkill for a tint
- `react-spring-bottom-sheet`: Requires react-spring peer dep, not installed. Use CSS translate-y instead.

---

## Open Questions

1. **iOS Safari touch-action coverage**
   - What we know: `touch-action: none` has partial iOS Safari support; `stopPropagation()` is the reliable fallback
   - What's unclear: Exact behavior on iOS 17+ when dragging NavSidebar while the Canvas is behind it — this requires physical device verification
   - Recommendation: Implement `onTouchStart/onTouchMove stopPropagation` on all panels. Flag for manual device test in the verification checklist.

2. **InfoPanel bottom sheet height on short phones**
   - What we know: `h-[60vh]` is used in the plan; some phones are 568px tall (iPhone SE)
   - What's unclear: Whether 60vh (340px on SE) is enough to show stats + composition without excessive scrolling
   - Recommendation: Use `h-[60vh] min-h-[320px]` and ensure `overflow-y-auto` on the panel body. The panel is already scrollable from Phase 3.

3. **NavSidebar z-index stacking with InfoPanel**
   - What we know: InfoPanel is `z-20`; NavSidebar will be `z-20` or `z-30`
   - What's unclear: On mobile with both sidebar open and InfoPanel visible (edge case), which overlaps which
   - Recommendation: Set NavSidebar to `z-30` so it can be dismissed; InfoPanel stays at `z-20`. Sidebar close on planet select (Pitfall 3) minimizes this conflict.

---

## Sources

### Primary (HIGH confidence)

- [tailwindcss.com/docs/responsive-design](https://tailwindcss.com/docs/responsive-design) — breakpoints, mobile-first, md: prefix, max-* variant
- [tailwindcss.com/docs/transition-property](https://tailwindcss.com/docs/transition-property) — `transition-[width]` arbitrary syntax, what default `transition` includes
- [r3f.docs.pmnd.rs/api/events](https://r3f.docs.pmnd.rs/api/events) — event propagation, stopPropagation dual effect in R3F
- Existing codebase: `useKeyboardShortcuts.js`, `SceneContext.jsx`, `sceneStore.js`, `App.jsx`, `InfoPanel.jsx` — established dual-dispatch, two-context, pointer-events patterns

### Secondary (MEDIUM confidence)

- [github.com/pmndrs/drei/issues/1233](https://github.com/pmndrs/drei/issues/1233) — OrbitControls touch-action: none issue, closed "not planned" Nov 2024; confirms stopPropagation as workaround
- [github.com/pmndrs/use-gesture/issues/486](https://github.com/pmndrs/use-gesture/issues/486) — iOS Safari touch-action limitations confirmed by pmndrs ecosystem
- WebSearch: multiple community sources confirm `requestAnimationFrame` over `setTimeout(fn, 0)` for CSS transition triggering on mount

### Tertiary (LOW confidence — requires verification)

- Specific iOS 17+ behavior with stopPropagation on panels over canvas: no authoritative 2025 source found; requires physical device testing

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; no new deps needed; verified
- Architecture patterns: HIGH — patterns derived directly from existing codebase + official Tailwind docs
- Pitfalls: HIGH — most derived from existing code constraints + verified community issues
- iOS touch behavior: MEDIUM-LOW — general approach verified, specific iOS 17 behavior unverified without device

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (Tailwind v4 and R3F v9 are stable; breakpoints and transition APIs do not change frequently)
