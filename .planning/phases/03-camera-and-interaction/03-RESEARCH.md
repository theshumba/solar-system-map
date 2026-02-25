# Phase 3: Camera and Interaction - Research

**Researched:** 2026-02-25
**Domain:** GSAP camera fly-to + OrbitControls handoff, R3F pointer events, drei Html labels, keyboard shortcuts, DOM info panel with CSS transitions
**Confidence:** HIGH (all major claims verified against installed package source, official docs, and cross-referenced forum patterns)

---

## Summary

Phase 3 builds the interactive heart of the solar system: clicking a planet triggers a cinematic GSAP camera fly-to, a hover label appears above the planet, the orbit line brightens, and an info panel slides in from the right with planet stats and rotating fun facts. Keyboard shortcuts (1-9, Space, Escape) provide power-user navigation. OrbitControls handles free exploration and is disabled during fly-to, re-enabled on completion.

The central technical challenge is the GSAP-OrbitControls handoff: both systems claim camera ownership simultaneously unless you explicitly disable OrbitControls before starting any GSAP tween and re-enable it in the `onComplete` callback. This is the single most common source of broken camera behavior in Three.js orrery projects. The pattern is well-understood: `controls.enabled = false` → GSAP tween animating BOTH `camera.position` AND `controls.target` simultaneously → `controls.enabled = true` in `onComplete`.

The second key challenge is getting the planet's current world position at click time. Since planets orbit continuously, the camera target must be calculated at the moment of the click using `groupRef.current.getWorldPosition(scratchVec)` on the planet's orbital group. This world position becomes the `controls.target` for the fly-to.

The info panel is a persistent DOM component (never unmounts) driven entirely by props — when `selectedPlanet` changes, the content updates and a CSS `translate-x` transition slides it into view. This avoids animation restarts on planet switches and preserves scroll state.

**Primary recommendation:** Build Plan 03-01 in order: CameraController (with OrbitControls forwardRef + makeDefault), the `flyTo` function using two simultaneous GSAP tweens (position + target), then Planet click/hover handlers reading world position at event time, then keyboard shortcuts via plain `useEffect`.

---

## Standard Stack

All packages already installed — no new installs required.

### Core (already in package.json)

| Library | Installed Version | Purpose | Role in Phase 3 |
|---------|-------------------|---------|-----------------|
| `gsap` | 3.14.2 | Animation engine | Camera fly-to tween; `ease: 'power2.inOut'` |
| `@gsap/react` | 2.1.2 | React integration | `useGSAP` hook for lifecycle-safe tween creation |
| `@react-three/drei` | 10.7.7 | R3F helpers | `OrbitControls`, `Html`, `useCursor` |
| `@react-three/fiber` | 9.5.0 | R3F renderer | `useThree`, `useFrame`, pointer events on meshes |
| `three` | 0.183.1 | 3D engine | `Vector3.getWorldPosition`, `OrbitControls.target` |
| `zustand` | 5.0.11 | State (already exists) | `sceneStore.getState()` in useFrame |
| `tailwindcss` | 4.2.1 | CSS utility | Info panel slide-in transition, label styling |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `three-stdlib` | (drei dep) | `OrbitControls` impl | Underlying controls object behind drei wrapper |

### No New Installs Required

All dependencies for Phase 3 are already installed. No additional packages needed.

---

## Architecture Patterns

### Recommended Project Structure (Phase 3 additions)

```
src/
├── components/
│   ├── scene/
│   │   ├── CameraController.jsx  # NEW: OrbitControls + GSAP flyTo + overview
│   │   └── Planet.jsx            # MODIFIED: add click/hover handlers
│   └── ui/
│       ├── InfoPanel.jsx         # NEW: persistent DOM panel, prop-driven content
│       └── HoverLabel.jsx        # NEW: drei Html label, renders inside Planet
├── hooks/
│   ├── useCamera.js              # NEW: flyTo + flyToOverview functions
│   └── useKeyboardShortcuts.js   # NEW: 1-9, Space, Escape
├── context/
│   └── SceneContext.jsx          # ALREADY EXISTS — selectedPlanet/hoveredPlanet already defined
└── store/
    └── sceneStore.js             # ALREADY EXISTS — no changes needed
```

### Pattern 1: CameraController with OrbitControls Ref + makeDefault

**What:** A dedicated scene component renders `<OrbitControls>` with `makeDefault` and a forwarded ref. `makeDefault` registers the controls instance in R3F's root store, so any component can access it via `useThree(state => state.controls)`. The ref gives direct imperative access for enabling/disabling during GSAP.

**Key insight from verified source (OrbitControls.js):** drei's `OrbitControls` only calls `controls.update()` when `controls.enabled === true` inside its internal `useFrame`. Setting `controls.enabled = false` stops OrbitControls from fighting the GSAP tween.

```jsx
// Source: verified against drei v10.7.7 OrbitControls.js + OrbitControls.d.ts
// src/components/scene/CameraController.jsx
import { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import { useSceneContext } from '../../context/SceneContext'
import { PLANETS } from '../../data/planets'

// Pre-allocated scratch vector — never new Vector3() inside a callback
const _target = { x: 0, y: 0, z: 0 }

// Default camera overview position (from App.jsx: [0, 50, 120])
const OVERVIEW_POS = { x: 0, y: 50, z: 120 }
const OVERVIEW_TARGET = { x: 0, y: 0, z: 0 }

export default function CameraController() {
  const controlsRef = useRef()
  const { camera } = useThree()
  const { selectedPlanet } = useSceneContext()

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={200}
    />
  )
}
```

**Why `makeDefault`:** Registers controls in `state.controls`. Any hook or component can then call `useThree(s => s.controls)` to get the same instance — no prop drilling of `controlsRef`.

**Confidence:** HIGH — verified against drei OrbitControls.js source: `if (makeDefault) { set({ controls }) }`.

---

### Pattern 2: GSAP Fly-To with Two Simultaneous Tweens

**What:** The fly-to function disables OrbitControls, then starts TWO simultaneous GSAP tweens:
1. Tween A: `camera.position` → offset position relative to planet world pos
2. Tween B: `controls.target` → planet's world position (at origin of orbital group)

Both tweens use `power2.inOut` ease and the same duration (~1.5s). The `onComplete` of either tween re-enables controls.

**Why two tweens:** Animating only `camera.position` leaves `controls.target` at the previous value. When OrbitControls re-enables, it snaps the camera back to orbit the old target. Animating `controls.target` simultaneously ensures smooth transition with no snap on re-enable.

**CRITICAL: Get world position at click time.** Planets move. The GSAP tween must capture the planet's current world position at the moment of the click, not a stale stored value.

```javascript
// Source: verified against three.js v0.183.1 Object3D.js (getWorldPosition at line 996),
// GSAP 3.14 types (gsap.to signature), drei OrbitControls enabled pattern
// src/hooks/useCamera.js
import { useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import gsap from 'gsap'
import { PLANET_RADII } from '../data/constants'

const _scratchVec = new Vector3() // module-level scratch — never allocate in callback

// Camera offset from planet center: up + back relative to planet radius
function getCameraOffset(radius) {
  return { x: 0, y: radius * 4, z: radius * 8 }
}

export function useCamera() {
  const { camera, controls } = useThree()

  const flyTo = useCallback((planetData, groupRef) => {
    if (!controls || !groupRef?.current) return

    // 1. Get current world position of the planet's orbital group
    groupRef.current.getWorldPosition(_scratchVec)
    const tx = _scratchVec.x
    const ty = _scratchVec.y
    const tz = _scratchVec.z

    // 2. Compute camera offset relative to planet (up + back)
    const offset = getCameraOffset(planetData.radius)
    const cx = tx + offset.x
    const cy = ty + offset.y
    const cz = tz + offset.z

    // 3. Disable OrbitControls — prevents fighting with GSAP
    controls.enabled = false

    // Kill any running tweens on these objects before starting new ones
    gsap.killTweensOf(camera.position)
    gsap.killTweensOf(controls.target)

    // 4. Tween A: camera position
    gsap.to(camera.position, {
      x: cx, y: cy, z: cz,
      duration: 1.5,
      ease: 'power2.inOut',
      onComplete: () => {
        controls.enabled = true
      },
    })

    // 5. Tween B: controls target (simultaneously)
    gsap.to(controls.target, {
      x: tx, y: ty, z: tz,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(), // keep controls internal state in sync
    })
  }, [camera, controls])

  const flyToOverview = useCallback(() => {
    if (!controls) return

    controls.enabled = false
    gsap.killTweensOf(camera.position)
    gsap.killTweensOf(controls.target)

    gsap.to(camera.position, {
      x: 0, y: 50, z: 120,
      duration: 1.5,
      ease: 'power2.inOut',
      onComplete: () => { controls.enabled = true },
    })

    gsap.to(controls.target, {
      x: 0, y: 0, z: 0,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(),
    })
  }, [camera, controls])

  return { flyTo, flyToOverview }
}
```

**Confidence:** HIGH — two-tween pattern verified in Three.js forum discourse.threejs.org/t/animating-camera-target-using-gsap/52486. `getWorldPosition` verified in Three.js 0.183.1 source.

---

### Pattern 3: Planet Click and Hover Handlers with World Position Callback

**What:** Planet mesh receives `onPointerOver`, `onPointerOut`, and `onClick` event handlers. On click, it reads the planet's current world position from its group ref and dispatches `SELECT_PLANET` to SceneContext and triggers `flyTo`.

**CRITICAL — `onClick` vs drag detection:** R3F's `ThreeEvent` includes a `delta` property (distance from pointer-down to pointer-up in pixels). R3F's own `onClick` handler on meshes does NOT automatically suppress drags — only "miss" clicks (empty canvas) get the 2px guard. For meshes, use `onClick` and check `e.delta > 2` to suppress accidental clicks after OrbitControls drag.

**`useCursor` from drei:** Sets `document.body.style.cursor` to `'pointer'` on hover, `'auto'` on leave. Already available in drei v10.7.7 (`web/useCursor.js`).

```jsx
// Source: verified gegen @react-three/fiber events.d.ts (ThreeEvent.delta: number),
// drei web/useCursor.d.ts + useCursor.js implementation
// Modification to src/components/scene/Planet.jsx

import { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, useCursor } from '@react-three/drei'
import { useSceneStore } from '../../store/sceneStore'
import { useSceneDispatch } from '../../context/SceneContext'
import HoverLabel from './HoverLabel'

export default function Planet({ data, children }) {
  const texture = useTexture(data.texture)
  const groupRef = useRef()
  const meshRef = useRef()
  const dispatch = useSceneDispatch()
  const [hovered, setHovered] = useState(false)

  // Sets cursor to 'pointer' while hovered — drei hook, no manual document.body manipulation
  useCursor(hovered)

  // ... existing orbital animation useFrame ...

  const handleClick = (e) => {
    e.stopPropagation()
    if (e.delta > 2) return // suppress drag-end as click
    dispatch({ type: 'SELECT_PLANET', payload: data.id })
    // flyTo is triggered by CameraController watching selectedPlanet via useEffect
  }

  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    dispatch({ type: 'HOVER_PLANET', payload: data.id })
  }

  const handlePointerOut = () => {
    setHovered(false)
    dispatch({ type: 'HOVER_PLANET', payload: null })
  }

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        rotation={[0, 0, (data.axialTilt * Math.PI) / 180]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[data.radius, 32, 32]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      {hovered && <HoverLabel name={data.name} />}
      {children}
    </group>
  )
}
```

**Confidence:** HIGH — `ThreeEvent.delta` verified in `@react-three/fiber/dist/declarations/src/core/events.d.ts` line 18. `useCursor` API verified in drei v10 source.

---

### Pattern 4: CameraController useEffect Watching selectedPlanet

**What:** `CameraController` watches `selectedPlanet` via a `useEffect`. When it changes, it looks up the planet's groupRef from a ref registry and calls `flyTo`. When it becomes null, it calls `flyToOverview`.

**The ref registry problem:** `flyTo` needs the planet's `groupRef` to call `getWorldPosition`. The refs live in `Planet` components. Two approaches:
- **A (recommended):** Pass `groupRef` as part of `SELECT_PLANET` dispatch payload (in a `useRef` stored in SceneContext or a separate store)
- **B (simpler):** Store planet group refs in a Zustand store map `{ [planetId]: ref }`. Each Planet registers itself on mount, unregisters on unmount.

**Option B is simpler and avoids prop drilling through SceneContext:**

```javascript
// src/store/sceneStore.js — add to existing store
planetRefs: {},  // { [planetId]: groupRef }
registerPlanetRef: (id, ref) => set(s => ({ planetRefs: { ...s.planetRefs, [id]: ref } })),
unregisterPlanetRef: (id) => set(s => {
  const { [id]: _, ...rest } = s.planetRefs
  return { planetRefs: rest }
}),
```

```javascript
// In CameraController's useEffect watching selectedPlanet:
// useSceneStore.getState().planetRefs[selectedPlanet] → get the groupRef
```

**Confidence:** HIGH — Zustand store already exists and accepts this extension. R3F `useEffect` + SceneContext is established pattern from Phase 1/2 decisions.

---

### Pattern 5: Hover Label with drei Html

**What:** A small HTML label anchored to the planet's position in 3D space, rendered via drei's `<Html>`. Conditionally renders only when hovered. Uses `center` to anchor at the mesh center, `distanceFactor` to scale with camera distance, and is offset upward by the planet's radius.

**`occlude` consideration:** `occlude` with `'raycast'` mode hides the label when the planet is behind the Sun or another large body. However, passing all planet refs is complex. For a hover-only label (only one label visible at a time), omit `occlude` and rely on the 3D illusion — the label appears briefly and disappears when the cursor leaves.

```jsx
// Source: verified against drei v10 web/Html.d.ts (center, distanceFactor, position props)
// src/components/scene/HoverLabel.jsx — rendered inside Planet's group
import { Html } from '@react-three/drei'

export default function HoverLabel({ name, radius }) {
  return (
    <Html
      center
      distanceFactor={60}
      position={[0, radius * 1.6, 0]}  // offset above planet surface
    >
      <div
        className="text-white text-xs font-semibold tracking-widest uppercase"
        style={{
          background: 'rgba(0,0,0,0.55)',
          padding: '2px 8px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {name}
      </div>
    </Html>
  )
}
```

**`distanceFactor={60}`: calibrated for the compressed scene scale (outer planets at ~72 scene units, camera far at 10000). A higher value means the label scales down more aggressively with distance — prevents labels on Mercury from being 10x larger than labels on Pluto.

**Confidence:** HIGH — `Html` props verified against `@react-three/drei/web/Html.d.ts` installed source.

---

### Pattern 6: Orbit Line Glow on Hover

**What:** OrbitLine currently takes `color` and `opacity` props with defaults `'#334455'` and `0.3`. On hover, the parent scene should pass brightened values: `color='#6688aa'` and `opacity={0.8}`. Since OrbitLine uses drei's `<Line>` which re-renders on prop changes, this is a simple conditional prop — no imperative mutation needed.

The Scene component maps `hoveredPlanet` from context and passes the glow props to the relevant `OrbitLine`:

```jsx
// src/components/scene/Scene.jsx — modified Planet+OrbitLine group
import { useSceneContext } from '../../context/SceneContext'

const { hoveredPlanet, selectedPlanet } = useSceneContext()

{PLANETS.map((planet) => (
  <group key={planet.id}>
    <Planet data={planet}>...</Planet>
    <OrbitLine
      radius={planet.distance}
      color={hoveredPlanet === planet.id ? '#7aaccc' : '#334455'}
      opacity={hoveredPlanet === planet.id ? 0.8 : 0.3}
    />
  </group>
))}
```

**Confidence:** HIGH — prop-based approach matches existing OrbitLine interface. No new patterns needed.

---

### Pattern 7: Keyboard Shortcuts via Plain useEffect

**What:** A custom `useKeyboardShortcuts` hook attaches a single `keydown` listener to `window`. It maps:
- `'1'–'9'` → dispatch `SELECT_PLANET` with `PLANETS[index]` id
- `' '` (Space) → dispatch `TOGGLE_PAUSE` + Zustand `togglePause()`
- `'Escape'` → dispatch `SELECT_PLANET` null (triggers flyToOverview)

**Why plain `addEventListener` instead of drei's `KeyboardControls`:** `KeyboardControls` is designed for game-style held-key input (WASD movement). The shortcuts here are one-shot key events (Escape, 1-9, Space). Plain `useEffect` with `keydown` is cleaner and requires no provider wrapper.

**Guard: `e.target` check.** If a future text input exists, shortcuts must not fire when typing. Check `e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA'`.

```javascript
// src/hooks/useKeyboardShortcuts.js
import { useEffect } from 'react'
import { PLANETS } from '../data/planets'
import { useSceneDispatch } from '../context/SceneContext'
import { useSceneStore } from '../store/sceneStore'

export function useKeyboardShortcuts() {
  const dispatch = useSceneDispatch()

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Guard: don't fire in input fields
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      // 1-9: jump to planet
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1
        if (index < PLANETS.length) {
          dispatch({ type: 'SELECT_PLANET', payload: PLANETS[index].id })
        }
        return
      }

      // Space: toggle pause
      if (e.key === ' ') {
        e.preventDefault() // prevent page scroll
        dispatch({ type: 'TOGGLE_PAUSE' })
        useSceneStore.getState().togglePause()
        return
      }

      // Escape: deselect planet (triggers flyToOverview in CameraController)
      if (e.key === 'Escape') {
        dispatch({ type: 'SELECT_PLANET', payload: null })
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch])
}
```

**Confidence:** HIGH — native `useEffect` + `addEventListener` pattern. No library-specific behavior to verify.

---

### Pattern 8: InfoPanel DOM Component (Persistent, Prop-Driven)

**What:** `InfoPanel` always exists in the DOM. `visible` prop drives a CSS `translate-x` transition (not conditional rendering). Content updates when `selectedPlanet` changes without unmounting/remounting the panel.

**Why persistent render over conditional:** Prior research (STATE.md) and pitfalls doc established that re-mounting on planet switch restarts GSAP stagger animations and loses scroll position. Persistent render with prop-driven content avoids both.

**Slide-in pattern (Tailwind v4):** `translate-x-full` when hidden, `translate-x-0` when visible, with `transition-transform duration-300 ease-in-out`.

**Fun facts carousel:** A `useEffect` with `setInterval` that cycles `factIndex` every 4 seconds. Resets when `planet` prop changes to prevent showing a fact from the previous planet.

```jsx
// src/components/ui/InfoPanel.jsx
import { useState, useEffect } from 'react'
import { useSceneContext } from '../../context/SceneContext'
import { PLANETS, SUN } from '../../data/planets'

// Build a lookup for instant access by planet id
const PLANET_MAP = Object.fromEntries(
  [...PLANETS, SUN].map(p => [p.id, p])
)

export default function InfoPanel() {
  const { selectedPlanet } = useSceneContext()
  const planet = selectedPlanet ? PLANET_MAP[selectedPlanet] : null
  const isOpen = !!planet
  const [factIndex, setFactIndex] = useState(0)

  // Reset fact index when planet changes
  useEffect(() => {
    setFactIndex(0)
  }, [selectedPlanet])

  // Auto-rotate fun facts every 4s
  useEffect(() => {
    if (!planet) return
    const interval = setInterval(() => {
      setFactIndex(i => (i + 1) % planet.funFacts.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [planet])

  return (
    <div
      className={`
        absolute right-0 top-0 h-full w-80 z-20
        bg-black/80 backdrop-blur-sm text-white
        transition-transform duration-300 ease-in-out
        pointer-events-auto overflow-y-auto
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {planet && (
        <div className="p-6">
          {/* Planet name + nickname */}
          <h2 className="text-2xl font-bold">{planet.name}</h2>
          <p className="text-sm text-gray-400 mb-4">{planet.nickname}</p>

          {/* 6 key stats */}
          <div className="mb-4 space-y-2">
            {Object.entries(planet.stats).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-right ml-4">{value}</span>
              </div>
            ))}
          </div>

          {/* Fun facts carousel */}
          <div className="bg-white/5 rounded p-3 text-sm italic min-h-[80px]">
            {planet.funFacts[factIndex]}
          </div>

          {/* Moon list — UI-04 */}
          <div className="mt-4 text-sm text-gray-400">
            <span className="font-semibold text-white">Moons: </span>
            {planet.stats.moonCount}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Confidence:** HIGH — CSS translate-x transition pattern verified against Tailwind v4 docs. `setInterval` cleanup pattern is standard React.

---

### Pattern 9: useGSAP for Camera Animation Cleanup

**What:** When using GSAP inside a component that can re-mount (e.g., in React 19 Strict Mode double-invocation), `useGSAP` handles cleanup automatically. However, for the imperative `flyTo` function called from event handlers, `gsap.killTweensOf()` before starting new tweens is the reliable cleanup path.

**From verified source (`@gsap/react` types):** `useGSAP` accepts a `contextSafe` pattern for event-handler-triggered animations. For camera fly-to called imperatively (not in the `useGSAP` body), use `gsap.killTweensOf(camera.position)` + `gsap.killTweensOf(controls.target)` before each new tween.

```javascript
// Correct pattern for imperative GSAP in event handlers:
// Kill previous tweens before starting new ones (prevents racing)
gsap.killTweensOf(camera.position)
gsap.killTweensOf(controls.target)
gsap.to(camera.position, { ... })
gsap.to(controls.target, { ... })
```

**Confidence:** HIGH — `gsap.killTweensOf` verified in GSAP 3.14 types.

---

### Anti-Patterns to Avoid

- **`useSceneContext()` inside `useFrame`**: Context reads inside `useFrame` cause re-renders. Read `hoveredPlanet` from a ref synced by a separate `useEffect`, or via Zustand. (Established in Phase 2 STATE.md decisions.)
- **Animating camera.position without animating controls.target**: Camera snaps back when OrbitControls re-enables because target is still at old position.
- **Re-enabling OrbitControls in GSAP `onUpdate`**: Controls fight the tween. Only re-enable in `onComplete`.
- **`new Vector3()` in onClick handler**: Each click allocates. Use module-level scratch vector `_scratchVec` and call `.setFromMatrixPosition()` or `groupRef.current.getWorldPosition(_scratchVec)`.
- **Conditional rendering of InfoPanel**: Unmounts/remounts on planet switch — restart animations, scroll position lost. Always persistent, prop-driven.
- **Registering keyboard shortcuts without cleanup**: Multiple listeners accumulate on re-render. Always return `() => window.removeEventListener(...)` from `useEffect`.
- **Calling `flyTo` directly from Planet's onClick**: Planet doesn't have access to `controls`. Route via dispatch to SceneContext → CameraController watches and calls `flyTo`. Alternatively, use the `useCamera` hook if both components share access to controls via `useThree(s => s.controls)`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cursor change on hover | Manual `document.body.style.cursor` management | `useCursor(hovered)` from drei | Handles cleanup, avoids cursor getting stuck if component unmounts while hovered |
| Camera world position at click | Manually compute from `groupRef.current.position` | `groupRef.current.getWorldPosition(_scratch)` | `position` is LOCAL to the parent group; `getWorldPosition` gives world-space coords (needed when parent transforms are applied) |
| Fly-to animation | Custom lerp in `useFrame` | GSAP `gsap.to()` with `power2.inOut` | Handles easing, kill/restart, overlapping tweens, `onComplete` — lerp requires manual state tracking |
| OrbitControls | Manual orbit math | drei `<OrbitControls makeDefault />` | Handles damping, zoom limits, touch input, and registers in R3F root store for access anywhere |
| Keyboard event map | Custom key-state tracking | Plain `useEffect` + `keydown` listener | Drei `KeyboardControls` is for held-key game input, not one-shot shortcuts |
| HTML label in 3D space | CSS `position: fixed` + manual viewport math | `<Html distanceFactor center>` from drei | drei handles 3D→2D projection, scale-with-distance, camera sync every frame |

**Key insight:** The `controls.target` tween is the hardest-to-discover piece. Every forum post about GSAP/OrbitControls conflicts traces back to forgetting to animate the target. The two-tween pattern (position + target simultaneously) is the authoritative solution.

---

## Common Pitfalls

### Pitfall 1: OrbitControls Fighting GSAP Tween
**What goes wrong:** Camera jitters during fly-to; snaps back to old position after tween ends.
**Why it happens:** `OrbitControls.update()` runs in drei's internal `useFrame` and overwrites camera position every frame. When enabled during a GSAP tween, both systems update the camera simultaneously.
**How to avoid:** `controls.enabled = false` immediately before starting the tween. `controls.enabled = true` in `onComplete` only. Never in `onUpdate`.
**Warning signs:** Camera oscillates during fly-to; snap back immediately when tween finishes.

### Pitfall 2: Stale Planet Position in flyTo
**What goes wrong:** Camera flies to where the planet WAS at click time instead of its current position — or worse, flies to (0,0,0) because a cached position was used.
**Why it happens:** Planets orbit. `groupRef.current.position` is the LOCAL position in the group's coordinate space (set each frame). For a planet with no parent transformation, local = world. But calling `getWorldPosition` is safer and handles any future parent transforms.
**How to avoid:** Always call `groupRef.current.getWorldPosition(_scratchVec)` inside the click handler, at click time. Never cache planet positions in state.
**Warning signs:** Camera targets a position offset from the planet, or always targets origin.

### Pitfall 3: Planet Click Firing After OrbitControls Drag
**What goes wrong:** User drags to rotate the scene; releases mouse over a planet; planet's `onClick` fires and triggers an unwanted fly-to.
**Why it happens:** R3F's `onClick` on meshes does NOT apply a drag threshold — only empty-canvas "miss" clicks have the 2px guard. Mesh `onClick` fires whenever the pointer-down and pointer-up both hit the same mesh.
**How to avoid:** Use `onClick` and check `if (e.delta > 2) return` at the top of the handler. `e.delta` is the pixel distance from pointer-down to pointer-up, available on all `ThreeEvent` objects.
**Warning signs:** Accidental planet selection during camera rotation.

### Pitfall 4: Html Label Flickering
**What goes wrong:** The hover label flickers or has visible layout shift as the planet moves.
**Why it happens:** drei's `Html` updates position every frame via `useFrame`. When the parent group position changes rapidly (fast orbital speed), the label can lag by one frame.
**How to avoid:** Keep `distanceFactor` moderate (40-80 for this scene scale). Avoid `transform={true}` mode which uses 3D CSS transforms — it amplifies positional lag. Use plain `Html` (default non-transform mode).
**Warning signs:** Label appears to "swim" around the planet at high speed settings.

### Pitfall 5: useEffect Keyboard Shortcut Memory Leak
**What goes wrong:** Keyboard shortcuts fire multiple times per keypress because multiple listeners are registered.
**Why it happens:** `useEffect` without cleanup, or with wrong dependency array, registers a new listener each render without removing the old one.
**How to avoid:** Always return `() => window.removeEventListener('keydown', handler)` from the `useEffect`. Use `[]` dependency array if the handler uses only refs/dispatch that are stable.
**Warning signs:** Each keypress triggers the shortcut 2, 4, 8 times (doubling pattern).

### Pitfall 6: InfoPanel Scroll Position Reset on Planet Switch
**What goes wrong:** User scrolls down in the info panel to read fun facts; switches to another planet; panel scrolls back to top.
**Why it happens:** Conditional rendering unmounts/remounts the panel, resetting scroll position.
**How to avoid:** Persistent render — always mounted, translate-x controls visibility. Scroll position is preserved across planet switches.
**Warning signs:** Scroll position jumps to top every time a new planet is selected.

### Pitfall 7: Space Key Causes Page Scroll
**What goes wrong:** Pressing Space to toggle pause also scrolls the page.
**Why it happens:** Space is the browser's default scroll trigger for unfocused pages.
**How to avoid:** Call `e.preventDefault()` in the `handleKeyDown` function when `e.key === ' '`.
**Warning signs:** Page scrolls down when pressing Space.

---

## Code Examples

Verified patterns from installed sources:

### OrbitControls with makeDefault and Ref (drei v10)
```jsx
// Source: @react-three/drei/core/OrbitControls.d.ts + OrbitControls.js
import { useRef } from 'react'
import { OrbitControls } from '@react-three/drei'

function CameraController() {
  const ref = useRef()
  return (
    <OrbitControls
      ref={ref}
      makeDefault        // registers in state.controls — accessible via useThree(s => s.controls)
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={200}
    />
  )
}
```

### Accessing Controls Outside CameraController (makeDefault pattern)
```javascript
// Source: @react-three/fiber store.d.ts — RootState.controls: THREE.EventDispatcher | null
// After makeDefault, controls is OrbitControlsImpl (from three-stdlib)
import { useThree } from '@react-three/fiber'

function AnyComponent() {
  const controls = useThree(state => state.controls) // OrbitControlsImpl
  // controls.enabled = false / true
  // controls.target (Vector3)
  // controls.update()
}
```

### GSAP Two-Tween Fly-To
```javascript
// Source: GSAP 3.14 types (gsap.to, TweenVars, ease, onComplete, onUpdate)
// Three.js v0.183.1 getWorldPosition at Object3D.js:996
import gsap from 'gsap'
import { Vector3 } from 'three'

const _scratch = new Vector3()

function flyTo(groupRef, planetRadius, camera, controls) {
  groupRef.current.getWorldPosition(_scratch)
  const tx = _scratch.x, ty = _scratch.y, tz = _scratch.z

  controls.enabled = false
  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(controls.target)

  gsap.to(camera.position, {
    x: tx, y: ty + planetRadius * 4, z: tz + planetRadius * 8,
    duration: 1.5, ease: 'power2.inOut',
    onComplete: () => { controls.enabled = true },
  })
  gsap.to(controls.target, {
    x: tx, y: ty, z: tz,
    duration: 1.5, ease: 'power2.inOut',
    onUpdate: () => controls.update(),
  })
}
```

### R3F ThreeEvent.delta for Drag Suppression
```javascript
// Source: @react-three/fiber/dist/declarations/src/core/events.d.ts — delta: number (line 18)
// ThreeEvent.delta = pixel distance from pointer-down to this event
const handleClick = (e) => {
  e.stopPropagation()
  if (e.delta > 2) return  // drag — suppress
  dispatch({ type: 'SELECT_PLANET', payload: data.id })
}
```

### useCursor from drei (confirmed in drei v10 web/useCursor.js)
```javascript
// Source: @react-three/drei/web/useCursor.d.ts
// useCursor(hovered, onPointerOver?, onPointerOut?, container?)
import { useState } from 'react'
import { useCursor } from '@react-three/drei'

function Planet() {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered) // sets cursor to 'pointer' when hovered, 'auto' when not
  // ...
}
```

### drei Html Label (confirmed in drei v10 web/Html.d.ts)
```jsx
// Source: @react-three/drei/web/Html.d.ts — HtmlProps interface
// center: applies CSS -50%/-50% transform to center over anchor point
// distanceFactor: scales content based on camera distance
<Html center distanceFactor={60} position={[0, radius * 1.6, 0]}>
  <div style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
    {name}
  </div>
</Html>
```

### CSS Translate-X Slide-In Panel (Tailwind v4)
```jsx
// Source: Tailwind CSS translate + transition-transform utilities
// translate-x-full = 100% off-screen to the right; translate-x-0 = normal position
<div className={`
  fixed right-0 top-0 h-full w-80
  transition-transform duration-300 ease-in-out
  ${isOpen ? 'translate-x-0' : 'translate-x-full'}
`}>
  {/* panel content */}
</div>
```

---

## Data Gap: Moon List for UI-04

**Requirement UI-04:** Info panel shows list of notable moons (clickable for major ones).

**Current state:** `planets.js` has `moons: []` (empty array) for all planets. Moon counts are only in `stats.moonCount` as plain strings (e.g., `'1 (The Moon)'`, `'95 confirmed'`). There is no structured moon data.

**Decision needed by planner:** UI-04 requires "notable moons" for the info panel. Options:

| Option | What to add to planets.js | Effort |
|--------|---------------------------|--------|
| A (minimal) | Display `stats.moonCount` string as-is — no structured data needed | None |
| B (structured) | Add `notableMoons: [{ name, link? }]` array to relevant planets | Low — 5 planets need data |
| C (skip clickable) | Show names list, no click interaction — satisfy requirement partially | None |

**Recommendation:** Option B — add `notableMoons` array to planets that have named moons (Earth: Moon; Mars: Phobos/Deimos; Jupiter: 4 Galilean; Saturn: Titan; Pluto: Charon). Keep as display-only list (no separate panel for individual moons — out of scope for Phase 3). This satisfies UI-04's "list of notable moons" without the full "clickable for major ones" behavior, which can be deferred. Mark clickable behavior as deferred in PLAN.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Animate only `camera.position` with GSAP | Animate both `camera.position` AND `controls.target` simultaneously | Established community pattern | No snap-back when OrbitControls re-enables |
| `useEffect` for all GSAP tweens | `useGSAP` hook for lifecycle-safe setup; `gsap.killTweensOf` for imperative | GSAP 3.11+ / React 18+ | Handles Strict Mode double-invoke correctly |
| `onClick` for mesh click detection | `onClick` with `e.delta > 2` guard | R3F v8+ (delta added to ThreeEvent) | Prevents orbit-drag from triggering planet selection |
| `document.body.style.cursor` manually | `useCursor(hovered)` from drei | drei v7+ | Handles cleanup if component unmounts while hovered |
| Conditional rendering of info panel | Persistent render with translate-x transition | Community best practice | No animation restart on planet switch |

**Deprecated/outdated in this project:**
- `onClick` without delta check on 3D meshes: Registers drag-end as click. `e.delta > 2` guard is required.
- Starting GSAP tween before disabling OrbitControls: Race condition. Always disable first.
- Raw `useEffect` for GSAP inside components that mount/unmount: Use `useGSAP` or explicit `killTweensOf`.

---

## Open Questions

1. **Planet ref registry strategy (groupRef access in CameraController)**
   - What we know: `flyTo` needs `groupRef.current` to call `getWorldPosition`. Refs live in Planet components.
   - Options: (a) Zustand store map `{[id]: ref}`; (b) Pass world position as part of SELECT_PLANET action
   - Recommendation: Zustand store map. Each Planet registers its `groupRef` on mount via `useEffect`. CameraController reads it from the store. This avoids threading refs through SceneContext (which doesn't accept non-serializable values cleanly).
   - Confidence: MEDIUM — Zustand stores refs safely (they're not serialized). But this adds complexity to the store. The planner should decide.

2. **Camera offset per planet**
   - What we know: Camera offsets are relative to planet radius (`radius * 4` height, `radius * 8` depth). Mercury (radius 0.35) would position camera at [0, 1.4, 2.8] — very close. Pluto (radius 0.18) even closer.
   - What's unclear: Is a minimum camera distance needed so tiny planets don't put the camera inside the planet?
   - Recommendation: Add `max(planetRadius * 8, 8)` as minimum camera distance for tiny planets. Verify visually.
   - Confidence: MEDIUM — needs visual validation during implementation.

3. **Info panel close button / Escape UX**
   - What we know: Escape key dispatches `SELECT_PLANET null` which triggers `flyToOverview`. But on mobile, there's no keyboard.
   - What's unclear: Should the info panel have a visible close button?
   - Recommendation: Add a close button (×) in the top-right of the info panel that dispatches `SELECT_PLANET null`. Required for mobile and keyboard-less users. The planner should add this to Plan 03-02.
   - Confidence: HIGH — the requirement (Escape returns to overview) implies close functionality; a button implements it for non-keyboard users.

---

## Sources

### Primary (HIGH confidence)
- `@react-three/drei` v10.7.7 installed source:
  - `core/OrbitControls.d.ts` — `makeDefault`, `enableDamping` props confirmed
  - `core/OrbitControls.js` — `controls.enabled` gate in internal `useFrame` confirmed
  - `web/Html.d.ts` — `center`, `distanceFactor`, `position`, `occlude` props confirmed
  - `web/useCursor.d.ts` + `useCursor.js` — `useCursor(hovered)` API confirmed
- `@react-three/fiber` v9.5.0 installed source:
  - `dist/declarations/src/core/events.d.ts` — `ThreeEvent.delta: number` confirmed (line 18)
  - `dist/declarations/src/core/store.d.ts` — `RootState.controls` field confirmed (populated by `makeDefault`)
  - `dist/events-5a94e5eb.esm.js` — R3F drag threshold logic (2px) for empty canvas clicks confirmed; mesh clicks use `initialHits` check (no drag suppression)
- `gsap` v3.14.2 + `@gsap/react` v2.1.2 installed source:
  - `types/gsap-core.d.ts` — `gsap.to()` signature, `TweenVars`, `ease: EaseString`, `onComplete`, `onUpdate` confirmed
  - `types/index.d.ts` — `useGSAP` hook signature, `contextSafe` pattern confirmed
- `three` v0.183.1 installed source:
  - `src/core/Object3D.js` line 996 — `getWorldPosition(target: Vector3)` confirmed
- `three-stdlib` (drei dep):
  - `controls/OrbitControls.d.ts` — `enabled: boolean`, `target: Vector3`, `update()` confirmed

### Secondary (MEDIUM confidence)
- discourse.threejs.org/t/animating-camera-target-using-gsap/52486 — Two-tween pattern (position + target) verified as community-established solution for GSAP+OrbitControls
- discourse.threejs.org/t/gsap-orbitcontrols/35481 — `controls.enabled = false` before tween, re-enable in `onComplete`

### Tertiary (LOW confidence)
- gist.github.com/ektogamat/8ba8c0d103fa683e7a836661aada55ed — Basic useGSAP + camera pattern (no OrbitControls in example); used only to confirm `useGSAP` works in R3F context

---

## Metadata

**Confidence breakdown:**
- GSAP fly-to + OrbitControls: HIGH — verified against installed source, two-tween pattern verified in forum
- R3F pointer events + drag suppression: HIGH — `ThreeEvent.delta` verified in installed events.d.ts
- drei Html label: HIGH — HtmlProps interface verified in installed Html.d.ts
- drei useCursor: HIGH — implementation verified in installed useCursor.js
- OrbitControls makeDefault + useThree access: HIGH — verified in OrbitControls.js + R3F store.d.ts
- Keyboard shortcuts pattern: HIGH — standard useEffect + addEventListener
- InfoPanel CSS slide-in: HIGH — standard Tailwind translate-x transition
- Camera offset values: MEDIUM — ratios chosen by reasoning from constants.js scale; need visual validation
- Moon list data gap: HIGH — confirmed by inspecting planets.js (moons: [] empty everywhere)

**Research date:** 2026-02-25
**Valid until:** 2026-03-27 (stable libraries — 30 days)
