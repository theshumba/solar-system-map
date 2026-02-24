# Phase 1: Foundation - Research

**Researched:** 2026-02-24
**Domain:** Vite 7 + React 19 + R3F v9 project scaffold; Canvas configuration; SceneContext; planets.js data schema; Tailwind CSS v4; Suspense + loading screen; drei Stars starfield; @react-three/postprocessing Bloom + Vignette
**Confidence:** HIGH

---

## Summary

Phase 1 establishes every piece of infrastructure that every subsequent phase depends on. There are no unknowns here — all libraries are well-documented, version-compatible, and the patterns are canonical. The research confirms the stack documented in `.planning/research/STACK.md` with no version surprises: React 19.2.4, R3F 9.5.0, drei 10.7.7, postprocessing 3.0.4, GSAP 3.14.2, zustand 5.0.11, Tailwind CSS 4.2.1 — all verified against the npm registry on 2026-02-24.

The two most important Phase 1 architectural decisions that must be locked in before writing any planet or interaction code are: (1) Bloom's `luminanceThreshold` must be set to >= 0.9 so only the Sun's emissive material triggers the glow effect — retroactively adjusting this after all scene materials exist is painful; (2) the Canvas must NOT have `shadows` enabled — shadow maps for a PointLight at solar system scale require up to 6 render passes per frame and are catastrophic on mobile. Both are one-line settings but their omission causes either "everything glows" or "mobile users get 10fps."

The Suspense + useProgress + LoadingScreen pattern is fully established. The LoadingScreen lives outside the Canvas in the DOM (positioned absolutely over it), reads `useProgress()` from drei, and transitions away once the R3F `isLoaded` state transitions. `<Preload all />` inside the Canvas ensures materials pre-compile. Texture preloading via `useTexture.preload(...)` must be called at module scope (outside React lifecycle) to ensure `useProgress` tracks texture loads correctly. The procedural starfield uses drei's `<Stars>` component, which is a shader-based point cloud requiring zero manual geometry setup.

**Primary recommendation:** Follow the exact scaffold sequence: npm create vite → install packages → configure vite.config.js with `@tailwindcss/vite` and `optimizeDeps.include: ['three']` → wire Tailwind CSS-first import → build Canvas/DOM split in App.jsx → wire SceneContext → define planets.js schema and constants.js scale compression → add Suspense + LoadingScreen + Preload → add Starfield → add PostProcessing with Bloom. Each step is independently testable before proceeding.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react + react-dom | 19.2.4 | UI layer | R3F v9 requires `react: ">=19 <19.3"`; this is the latest satisfying version |
| @react-three/fiber | 9.5.0 | React WebGL renderer | Declarative Three.js in JSX; `useFrame` animation loop; v9 is the React 19 release |
| three | 0.183.1 | 3D engine peer dep | R3F v9 requires `three: ">=0.156"`; 0.183.1 is latest satisfying |
| @react-three/drei | 10.7.7 | R3F helpers | Stars (starfield), useProgress, Preload, OrbitControls, Html, useTexture, Line |
| @react-three/postprocessing | 3.0.4 | Post-processing pipeline | EffectComposer, Bloom, Vignette; requires `@react-three/fiber: "^9.0.0"` |
| vite | 7.3.1 | Build tool | Fastest HMR for 3D; requires Node 20.19+ or 22.12+ |
| @vitejs/plugin-react | 5.1.4 | React Fast Refresh | Required for HMR; supports Vite 4-7 |
| tailwindcss + @tailwindcss/vite | 4.2.1 | 2D overlay styling | CSS-first, no tailwind.config.js needed, single line `@import "tailwindcss"` |
| gsap + @gsap/react | 3.14.2 + 2.1.2 | Camera animation | Built in Phase 1 as a dependency import only; used in Phase 3 |
| zustand | 5.0.11 | Client state | Selector-based subscriptions; needed for state read inside useFrame |

### Supporting (Phase 1 specific)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| r3f-perf | 7.2.3 | Dev performance HUD | `<Perf position="top-left" />` during development; remove from production build |
| leva | 0.10.1 | Dev GUI controls | Tweak bloom threshold, star count, canvas config without code changes in dev |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@tailwindcss/vite` plugin (CSS-first) | PostCSS plugin + tailwind.config.js | v4 CSS-first requires zero config files; PostCSS approach is the v3 pattern and is NOT recommended for v4 |
| `drei Stars` for starfield | Manual `THREE.Points` with `BufferGeometry` | drei Stars is a one-liner with a built-in animated twinkling shader; manual Points is needed only for custom density profiles |
| `@react-three/postprocessing` Bloom | `THREE.UnrealBloomPass` directly | Declarative `<Bloom>` inside `<EffectComposer>` is the correct R3F pattern; raw Three.js pass requires imperative composer setup outside React |
| `useProgress` + custom DOM screen | drei `<Loader>` component | Custom DOM LoadingScreen (with AU Brussel branding) requires `useProgress`; drei's built-in `<Loader>` is a plain spinner with no branding support |

**Installation (full Phase 1 install):**

```bash
# Create scaffold
npm create vite@latest solar-system-map -- --template react
cd solar-system-map

# Core 3D stack
npm install three@0.183.1 @react-three/fiber@9.5.0 @react-three/drei@10.7.7 @react-three/postprocessing@3.0.4

# Animation + state (install now, configure in later phases)
npm install gsap@3.14.2 @gsap/react@2.1.2 zustand@5.0.11

# Tailwind v4
npm install tailwindcss@4.2.1 @tailwindcss/vite

# Dev tools
npm install -D r3f-perf@7.2.3 leva@0.10.1
```

---

## Architecture Patterns

### Recommended Project Structure

```
solar-system-map/
├── public/
│   └── textures/          # Planet texture images served as static assets
├── src/
│   ├── components/
│   │   ├── scene/         # R3F / WebGL components (ONLY live inside <Canvas>)
│   │   │   ├── Starfield.jsx       # <Stars> from drei
│   │   │   ├── PostProcessing.jsx  # <EffectComposer> + <Bloom> + <Vignette>
│   │   │   └── SolarSystem.jsx     # Scene root (Phase 2+)
│   │   └── ui/            # DOM/HTML components (OUTSIDE <Canvas>, positioned over it)
│   │       └── LoadingScreen.jsx   # useProgress + progress bar + space fact
│   ├── context/
│   │   └── SceneContext.jsx        # selectedPlanet, speed, isPaused, isLoaded, etc.
│   ├── data/
│   │   ├── planets.js              # All planet/moon data (NASA values)
│   │   └── constants.js            # SCALE_FACTOR, ORBIT_SCALE, PLANET_SCALE, texture paths
│   ├── assets/                     # (empty in Phase 1; textures go in public/)
│   ├── index.css                   # @import "tailwindcss" (Tailwind v4 CSS-first)
│   ├── App.jsx                     # Root: Canvas + DOM overlay composition
│   └── main.jsx                    # Vite entry point
├── vite.config.js
└── package.json
```

### Pattern 1: Vite 7 Configuration for R3F + Tailwind v4

**What:** `vite.config.js` needs two additions beyond the default scaffold: (1) `@tailwindcss/vite` plugin for Tailwind v4 CSS-first integration, (2) `optimizeDeps.include: ['three']` to pre-bundle three.js and eliminate cold-start module resolution lag.

**When to use:** Every R3F + Tailwind v4 project.

**Example:**
```javascript
// Source: https://vite.dev/config/ + https://tailwindcss.com/docs/installation
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ['three'],
  },
})
```

### Pattern 2: Tailwind CSS v4 CSS-First Import

**What:** Tailwind v4 is configured entirely through CSS — no `tailwind.config.js`, no PostCSS config. A single `@import "tailwindcss"` in `index.css` activates the framework. Custom theme tokens go in the same CSS file using `@theme`.

**When to use:** All v4 projects. Do NOT use the v3 PostCSS approach.

**Example:**
```css
/* src/index.css */
@import "tailwindcss";

/* Custom theme (optional — add in Phase 4 for AU Brussel colors) */
/* @theme {
  --color-space-bg: #050510;
  --color-accent: #4fc3f7;
} */
```

### Pattern 3: Canvas/DOM Split with Context Above Both

**What:** The `<Canvas>` WebGL boundary divides the React tree into two worlds. `SceneContext` provider wraps both the Canvas and all DOM overlay elements so both worlds can subscribe to shared state. CSS `position: absolute` stacks DOM panels over the canvas.

**When to use:** Any R3F app with significant 2D UI alongside the 3D scene.

**Example:**
```jsx
// Source: https://r3f.docs.pmnd.rs/getting-started/your-first-scene + architecture pattern
// src/App.jsx
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { SceneProvider } from './context/SceneContext'
import LoadingScreen from './components/ui/LoadingScreen'
import SolarSystem from './components/scene/SolarSystem'
import PostProcessing from './components/scene/PostProcessing'

export default function App() {
  return (
    <SceneProvider>
      <div className="relative w-screen h-screen bg-black overflow-hidden">
        {/* 3D WORLD */}
        <Canvas
          className="absolute inset-0"
          dpr={[1, 2]}
          camera={{ position: [0, 30, 80], fov: 60, near: 0.1, far: 10000 }}
          gl={{ antialias: true, alpha: false }}
          style={{ touchAction: 'none' }}
        >
          <Suspense fallback={null}>
            <SolarSystem />
            <PostProcessing />
            <Preload all />
          </Suspense>
        </Canvas>

        {/* 2D WORLD — absolutely positioned over Canvas */}
        <LoadingScreen />
        {/* NavSidebar, InfoPanel, TimelineControl added in later phases */}
      </div>
    </SceneProvider>
  )
}
```

### Pattern 4: Canvas Configuration (dpr, no shadows, gl)

**What:** The three non-negotiable Canvas props for this project:
- `dpr={[1, 2]}` — caps device pixel ratio at 2 (prevents 4x fill rate on high-end Android)
- No `shadows` prop — shadow maps for a PointLight at solar system scale require 6 render passes per frame; never enabled in this project
- `style={{ touchAction: 'none' }}` — hands touch events to Three.js/OrbitControls; prevents browser scroll conflicts

**Example:**
```jsx
// Source: https://r3f.docs.pmnd.rs/api/canvas
<Canvas
  dpr={[1, 2]}
  // shadows is NOT set — default is false, no shadow maps
  gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
  camera={{ position: [0, 30, 80], fov: 60, near: 0.1, far: 10000 }}
  style={{ touchAction: 'none' }}
>
```

### Pattern 5: SceneContext with useReducer

**What:** A single React context above both the Canvas and DOM layers. Uses `useContext` + `useReducer` for structured state transitions. State shape covers: `selectedPlanet`, `hoveredPlanet`, `speed`, `isPaused`, `cameraMode`, `isLoaded`.

**Key distinction:** SceneContext uses React Context (not zustand) because the values it holds change on discrete user interactions (clicks, keyboard events), not on every animation frame. If you need to read state *inside* `useFrame`, use zustand. SceneContext is safe for `useContext` consumers.

**Example:**
```jsx
// src/context/SceneContext.jsx
import { createContext, useContext, useReducer } from 'react'

const initialState = {
  selectedPlanet: null,   // string | null — planet id
  hoveredPlanet: null,    // string | null — planet id
  speed: 1,               // number — orbit speed multiplier (0-100)
  isPaused: false,        // boolean
  cameraMode: 'overview', // 'overview' | 'focused'
  isLoaded: false,        // boolean — Suspense + textures loaded
}

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_PLANET': return { ...state, selectedPlanet: action.id, cameraMode: action.id ? 'focused' : 'overview' }
    case 'HOVER_PLANET':  return { ...state, hoveredPlanet: action.id }
    case 'SET_SPEED':     return { ...state, speed: action.value }
    case 'TOGGLE_PAUSE':  return { ...state, isPaused: !state.isPaused }
    case 'SET_LOADED':    return { ...state, isLoaded: action.value }
    default: return state
  }
}

const SceneContext = createContext(null)
const DispatchContext = createContext(null)

export function SceneProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <SceneContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </SceneContext.Provider>
  )
}

export function useSceneContext() { return useContext(SceneContext) }
export function useSceneDispatch() { return useContext(DispatchContext) }
```

### Pattern 6: planets.js Data Schema

**What:** All planet data in a single static module. The schema must be defined in Phase 1 so every subsequent component (scene, sidebar, info panel) imports from the same source. Data uses real NASA values for scientific accuracy but the `distance` field uses the compressed scale defined in `constants.js`.

**Required fields per planet:**

```javascript
// src/data/planets.js
export const PLANETS = [
  {
    id: 'mercury',           // string — unique identifier, used in context
    name: 'Mercury',         // string — display name
    nickname: 'The Swift Planet', // string — tagline for info panel
    radius: 0.38,            // number — display radius in scene units (from constants.js PLANET_SCALE)
    distance: 4,             // number — orbital radius in scene units (from constants.js ORBIT_SCALE)
    orbitalPeriod: 0.24,     // number — years (Earth = 1.0); used for orbital animation speed
    rotationPeriod: 58.6,    // number — Earth days; used for self-rotation speed
    axialTilt: 0.03,         // number — degrees; applied as group rotation offset
    texture: '/textures/mercury.jpg', // string — path in /public/textures/
    color: '#b5b5b5',        // string — fallback color before texture loads
    emissive: false,         // boolean — only Sun is true
    moons: [],               // array — moon objects (Phase 2); empty in Phase 1
    stats: {                 // object — info panel data (Phase 3)
      distanceFromSun: '57.9M km',
      diameter: '4,879 km',
      orbitalPeriod: '88 days',
      dayLength: '1,408 hours',
      moonCount: 0,
      avgTemperature: '167°C',
    },
    funFacts: [              // array of strings — rotating facts for info panel
      'Mercury has no atmosphere to retain heat.',
      'A year on Mercury lasts just 88 Earth days.',
    ],
    composition: [           // array — atmospheric/surface composition (Phase 4 bar chart)
      { name: 'Oxygen', percent: 42 },
      { name: 'Sodium', percent: 29 },
      { name: 'Hydrogen', percent: 22 },
    ],
  },
  // ... all 8 planets + Pluto + Sun
]

// Convenience: also export the Sun separately or as id 'sun' in the array
export const SUN = {
  id: 'sun',
  name: 'The Sun',
  radius: 5,             // scene units
  distance: 0,
  emissive: true,
  emissiveColor: '#FDB813',
  emissiveIntensity: 2.0,
  // ... stats, funFacts, composition
}
```

### Pattern 7: constants.js with Logarithmic Scale Compression

**What:** Real orbital distances (Neptune at 30 AU) make outer planets invisible at any useful camera view. `constants.js` defines the compression formula and all derived scale constants. Every planet's `distance` and `radius` in `planets.js` references these constants.

**The critical rule:** Document the compression here. The comment "DO NOT change to real AU" must be explicit so future phases don't "fix" the scale back to astronomical units.

**Example:**
```javascript
// src/data/constants.js

// DO NOT USE REAL AU DISTANCES — outer planets would be invisible at any useful viewport
// Logarithmic compression: displayDistance = ORBIT_SCALE * Math.log1p(realAU * LOG_FACTOR)
// This keeps all planets visible while preserving relative order and rough proportion

export const ORBIT_SCALE = 8      // base multiplier for all orbital radii
export const LOG_FACTOR = 2       // logarithm base compression factor
export const PLANET_SCALE = 0.5   // planet radius scale (relative to scene units)
export const SUN_RADIUS = 5       // Sun radius in scene units (visually prominent)

// Pre-computed display distances (scene units) for each planet
// Derived from: ORBIT_SCALE * Math.log1p(realAU * LOG_FACTOR)
export const ORBITAL_DISTANCES = {
  mercury: 6,
  venus: 9,
  earth: 12,
  mars: 16,
  jupiter: 30,
  saturn: 42,
  uranus: 54,
  neptune: 64,
  pluto: 72,
}

// Pre-computed display radii (scene units) for each planet
// Roughly proportional to real planet radii but all visible at scene scale
export const PLANET_RADII = {
  sun: 5,
  mercury: 0.35,
  venus: 0.87,
  earth: 0.92,
  mars: 0.49,
  jupiter: 3.2,
  saturn: 2.7,
  uranus: 1.5,
  neptune: 1.45,
  pluto: 0.18,
}

// Texture paths (public/ directory — served as static assets by Vite)
export const TEXTURE_PATHS = {
  sun: '/textures/sun.jpg',
  mercury: '/textures/mercury.jpg',
  venus: '/textures/venus.jpg',
  earth: '/textures/earth.jpg',
  earthClouds: '/textures/earth-clouds.png',
  mars: '/textures/mars.jpg',
  jupiter: '/textures/jupiter.jpg',
  saturn: '/textures/saturn.jpg',
  saturnRing: '/textures/saturn-ring.png',
  uranus: '/textures/uranus.jpg',
  neptune: '/textures/neptune.jpg',
  pluto: '/textures/pluto.jpg',
}

// Camera far plane — must cover full scene without Z-fighting
export const CAMERA_FAR = 10000

// Default orbital speed multiplier (not 1x — orbits visually move at 30x real-time by default)
export const DEFAULT_SPEED = 30
```

### Pattern 8: Suspense + LoadingScreen + useProgress

**What:** The LoadingScreen is a DOM component outside the Canvas. It reads `useProgress()` from drei to track asset loading progress. The Suspense boundary wraps the 3D content inside Canvas. `<Preload all />` inside Suspense triggers pre-compilation of all scene materials.

**Critical note:** `useProgress` tracks ALL assets loaded via `useLoader`/`useTexture`. For progress to update correctly during texture loading, textures must be loaded via `useTexture` inside a Suspense boundary — NOT at module level with raw `TextureLoader`.

**Example:**
```jsx
// src/components/ui/LoadingScreen.jsx
import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { useSceneContext, useSceneDispatch } from '../../context/SceneContext'

const SPACE_FACTS = [
  'Light from the Sun takes 8 minutes to reach Earth.',
  'Jupiter is so massive it could contain all other planets.',
  'A day on Venus is longer than a year on Venus.',
  'The Great Red Spot on Jupiter has been storming for 350+ years.',
  'Pluto was reclassified as a dwarf planet in 2006.',
]

export default function LoadingScreen() {
  const { isLoaded } = useSceneContext()
  const dispatch = useSceneDispatch()
  const { progress, active } = useProgress()
  const [factIndex] = useState(() => Math.floor(Math.random() * SPACE_FACTS.length))

  // Notify context when loading is complete
  useEffect(() => {
    if (!active && progress === 100) {
      dispatch({ type: 'SET_LOADED', value: true })
    }
  }, [active, progress, dispatch])

  if (isLoaded) return null

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
      {/* AU Brussel branding */}
      <div className="text-white text-2xl font-bold mb-2 tracking-widest uppercase">
        AU Brussel
      </div>
      <div className="text-gray-400 text-sm mb-12 tracking-wide">
        Interactive Solar System
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-blue-400 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-gray-500 text-xs mb-8">{Math.round(progress)}% loaded</div>

      {/* Space fact */}
      <div className="max-w-sm text-center text-gray-400 text-sm italic px-4">
        "{SPACE_FACTS[factIndex]}"
      </div>
    </div>
  )
}
```

```jsx
// Inside <Canvas> in App.jsx:
import { Preload } from '@react-three/drei'
import { Suspense } from 'react'

<Canvas dpr={[1, 2]} ...>
  <Suspense fallback={null}>
    <SolarSystem />
    <PostProcessing />
    <Preload all />
  </Suspense>
</Canvas>
```

### Pattern 9: drei Stars Starfield

**What:** `<Stars>` from drei is a shader-based animated point cloud. No manual geometry or material setup required. Place it inside Canvas but OUTSIDE the Suspense boundary (no async loading needed — it's procedural).

**Key props:**
- `radius` — sphere radius for star distribution (100-200 for solar system scale)
- `depth` — depth extent of star field (50-100)
- `count` — number of stars (5000-10000; more = denser; impacts GPU on mobile)
- `factor` — star size multiplier (2-6)
- `saturation` — color saturation (0 = white/grey stars, correct for space)
- `fade` — boolean; stars fade toward the camera horizon (true recommended)
- `speed` — twinkling animation speed (1 = default; 0.5 for subtle)

**Example:**
```jsx
// Source: https://drei.docs.pmnd.rs/staging/stars
// src/components/scene/Starfield.jsx
import { Stars } from '@react-three/drei'

export default function Starfield() {
  return (
    <Stars
      radius={200}
      depth={60}
      count={8000}
      factor={4}
      saturation={0}
      fade
      speed={0.5}
    />
  )
}
```

```jsx
// In App.jsx Canvas — Stars goes OUTSIDE Suspense (procedural, no loading)
<Canvas>
  <Starfield />  {/* outside Suspense */}
  <Suspense fallback={null}>
    <SolarSystem />
    <PostProcessing />
    <Preload all />
  </Suspense>
</Canvas>
```

### Pattern 10: PostProcessing — Bloom + Vignette

**What:** `<EffectComposer>` from `@react-three/postprocessing` wraps both `<Bloom>` and `<Vignette>`. Must be placed as a child inside `<Canvas>`, typically last in the scene tree (after all geometry components) to render over the complete scene.

**Critical Bloom configuration:**
- `luminanceThreshold={0.9}` — only pixels brighter than 90% luminance bloom; Sun's emissive material (`emissiveIntensity: 2.0`) exceeds this; planet materials (`emissiveIntensity: 0`) do not
- `luminanceSmoothing={0.025}` — narrow smoothing band to keep the threshold sharp
- `mipmapBlur` — enables higher-quality blur using mip chain; preferred in v3
- `intensity={1.5}` — bloom brightness multiplier
- `radius={0.85}` — bloom spread (higher = softer, wider glow)

**Example:**
```jsx
// Source: https://github.com/pmndrs/react-postprocessing + official docs
// src/components/scene/PostProcessing.jsx
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

export default function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.9}
        luminanceSmoothing={0.025}
        mipmapBlur
        intensity={1.5}
        radius={0.85}
      />
      <Vignette
        offset={0.3}
        darkness={0.6}
        eskil={false}
      />
    </EffectComposer>
  )
}
```

### Anti-Patterns to Avoid

- **Storing camera position in React state:** `setCamera({ x, y, z })` inside any state causes React reconciliation at 60fps during animations. Camera is a Three.js mutable ref — always.
- **Creating Three.js objects inside useFrame:** `new THREE.Vector3()` at 60fps triggers GC pauses every 2-4 seconds. Pre-allocate scratch objects at module scope.
- **Using `<Canvas shadows>`:** Shadow maps for a solar PointLight require up to 6 render passes per frame for a cube shadow map. Never enable shadows in this scene.
- **Calling `useTexture` inside useFrame:** `useTexture` is a React hook and cannot be called in a frame loop. Call it at component top level inside a Suspense-wrapped component.
- **Putting DOM UI (NavSidebar, InfoPanel) inside Canvas:** Using drei `<Html>` for full panels breaks tab order, scroll behavior, and accessibility. Use `<Html>` only for 3D-anchored labels (hover name tags).
- **Hardcoding planet distances in component files:** All distances must come from `constants.js`. If scale compression needs tuning, it is one-file change.
- **Raw `useEffect` for GSAP tweens:** Raw `useEffect` double-fires in React 19 Strict Mode. Always use `useGSAP` from `@gsap/react` (relevant when camera fly-to is built in Phase 3).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Procedural starfield | Custom Points geometry + shader | `drei Stars` | Built-in twinkling shader, handles attribute buffer, zero setup |
| Loading progress tracking | Manual asset counter | `drei useProgress` | Automatically hooks into R3F's Suspense-based loader cache |
| Post-processing pipeline | Raw Three.js `EffectComposer` + pass setup | `@react-three/postprocessing EffectComposer` | Declarative, integrates with R3F render loop, handles MSAA automatically |
| Material pre-compilation | Custom `gl.compile()` call | `drei Preload all` | Handles compile timing correctly relative to Suspense resolution |
| Tailwind CSS config | `tailwind.config.js` with content globs | Tailwind v4 `@import "tailwindcss"` CSS-first | Zero config; content auto-discovered; no PostCSS setup needed |
| Canvas responsive resize | Manual `ResizeObserver` | R3F Canvas (auto) | Canvas automatically fills parent; control size with CSS on parent element |

**Key insight:** Every custom solution here has edge cases that the library authors already solved. The procedural starfield shader handles vertex shader twinkling correctly; `useProgress` handles the suspend-react cache; `EffectComposer` handles the R3F render loop integration. None of these are worth reimplementing.

---

## Common Pitfalls

### Pitfall 1: Bloom Making Everything Glow (Wrong Threshold)

**What goes wrong:** Default `luminanceThreshold={0}` makes every pixel with any brightness bloom. Saturn's rings, orbit line glow materials, planet labels, and even ambient light reflections all pick up bloom artifacts.

**Why it happens:** Developers copy the default example from the postprocessing docs, which uses `luminanceThreshold={0}` for demonstration. This is wrong for a scene with multiple emissive materials.

**How to avoid:** Set `luminanceThreshold={0.9}`. The Sun's emissive material must have `emissiveIntensity >= 2.0` to exceed this threshold. All non-Sun materials must have `emissiveIntensity <= 0.3` (orbit line glow on hover is fine at 0.3). Verify in the browser: Saturn's rings and planet names must NOT glow.

**Warning signs:** Saturn's rings appear as glowing halos. Text labels have a blur halo. Any `color: "white"` material unexpectedly glows.

---

### Pitfall 2: useProgress Returns 0 for Textures

**What goes wrong:** The loading progress bar never updates beyond 0% even though textures are loading. The transition to the 3D scene either never happens or happens immediately (if using `active` incorrectly).

**Why it happens:** `useProgress` tracks assets loaded via drei's `useTexture` / R3F's `useLoader` hooks (which use suspend-react under the hood). If textures are loaded outside the React lifecycle (e.g., `new THREE.TextureLoader().load(...)` at module scope, or imported as ES modules), they bypass the tracking system.

**How to avoid:**
1. Load all textures via `useTexture(path)` inside a component that's a descendant of a Suspense boundary
2. For preloading (to start tracking early), call `useTexture.preload('/textures/earth.jpg')` at module scope — this registers the asset with the loader cache before the component mounts
3. Never construct `new THREE.TextureLoader()` inside a component or `useFrame`

**Warning signs:** `progress` stays at 0 then jumps to 100. `active` is false immediately even before scene renders.

---

### Pitfall 3: Canvas Fills Wrong Dimensions

**What goes wrong:** The Canvas renders at a wrong size — either too small (100x100px default), ignoring the viewport, or causing layout shift when Tailwind's reset is applied.

**Why it happens:** R3F Canvas fills its parent container. If the parent has no explicit size (Tailwind's reset sets `box-sizing: border-box` but doesn't set heights), the Canvas collapses. Also: Tailwind v4's base styles may reset `html, body { height: 100% }` depending on configuration.

**How to avoid:**
1. Set `w-screen h-screen` on the root `<div>` wrapping the Canvas
2. Ensure `html, body { margin: 0; padding: 0; height: 100%; }` in `index.css`
3. Add `className="absolute inset-0"` or `style={{ position: 'absolute', inset: 0 }}` to the Canvas element
4. Test by inspecting the Canvas element in DevTools — it should be exactly `window.innerWidth × window.innerHeight`

**Warning signs:** Canvas is 100x100px. 3D scene appears tiny in top-left corner. Layout has unexpected scrollbars.

---

### Pitfall 4: Stale Closures in useFrame for Context Values

**What goes wrong:** A value from SceneContext (e.g., `speed`) read inside `useFrame` captures the initial value at subscription time and never updates. Changing the speed slider has no effect on orbital animation.

**Why it happens:** `useFrame(callback)` registers the callback once. If `speed` is from `useContext` and is captured in the closure, it becomes stale after the first render.

**How to avoid:**
1. Use a `useRef` to sync the context value: `const speedRef = useRef(speed); useEffect(() => { speedRef.current = speed }, [speed])`
2. Read `speedRef.current` inside `useFrame` instead of `speed` directly
3. Alternatively (preferred): use zustand for state that `useFrame` reads — zustand's `useStore(selector)` provides a stable ref-like subscription

**Warning signs:** Changing speed slider does nothing to orbital animation. `console.log` inside `useFrame` shows the initial speed value despite slider changes.

---

### Pitfall 5: Suspense Fallback Inside Canvas Shows Nothing

**What goes wrong:** When `<Suspense fallback={<SomeR3FComponent />}>` is used inside Canvas and assets are loading, the fallback appears empty. Alternatively, using a DOM element as fallback crashes with R3F "elements outside canvas" error.

**Why it happens:** R3F Canvas fallback must be either `null` or a valid R3F component (not a DOM element). The custom AU Brussel LoadingScreen is a DOM element — it must live OUTSIDE the Canvas, reading `useProgress` from outside.

**How to avoid:**
1. Use `<Suspense fallback={null}>` inside Canvas — the canvas just renders nothing while loading
2. Put the DOM LoadingScreen outside the Canvas, reading `useProgress()` to show progress
3. Never pass DOM elements (`<div>`) as Suspense fallback inside Canvas

**Warning signs:** React error "Attempted to use an incompatible renderer" when using DOM fallback inside Canvas.

---

### Pitfall 6: Shadow Maps Enabled

**What goes wrong:** The Canvas prop `shadows` (or `shadows="soft"`) is accidentally left on from a code example or tutorial. A PointLight (Sun) with shadows generates a cubemap shadow calculation for every object in the scene — 6 depth passes per frame. Mobile devices immediately drop to <30fps.

**Why it happens:** Most basic R3F tutorials enable shadows to show off the feature. Developers copy the `<Canvas shadows>` line without realizing the cost.

**How to avoid:** Never set `shadows` on the Canvas for this project. The design explicitly specifies no shadow maps. Document this in a comment: `{/* shadows intentionally disabled — PointLight shadow maps are prohibitive at solar system scale */}`

**Warning signs:** 6× increase in GPU render passes visible in browser DevTools GPU tab. Mobile drops to <30fps immediately on scene load.

---

## Code Examples

Verified patterns from official sources:

### Full Canvas Setup (Phase 1 final state)
```jsx
// Source: https://r3f.docs.pmnd.rs/api/canvas
<Canvas
  dpr={[1, 2]}
  // shadows intentionally disabled — PointLight shadow maps prohibitive at solar system scale
  gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
  camera={{ position: [0, 30, 80], fov: 60, near: 0.1, far: 10000 }}
  style={{ touchAction: 'none' }}
>
  {/* Stars: outside Suspense — procedural, no loading */}
  <Starfield />

  <Suspense fallback={null}>
    <SolarSystem />
    <PostProcessing />
    <Preload all />
  </Suspense>
</Canvas>
```

### Bloom with Correct Threshold
```jsx
// Source: https://github.com/pmndrs/react-postprocessing
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

<EffectComposer>
  <Bloom
    luminanceThreshold={0.9}    // Only Sun (emissiveIntensity >= 2.0) glows
    luminanceSmoothing={0.025}  // Sharp threshold boundary
    mipmapBlur                  // Higher quality blur in v3
    intensity={1.5}
    radius={0.85}
  />
  <Vignette offset={0.3} darkness={0.6} />
</EffectComposer>
```

### Texture Preloading (call at module scope in planets.js or constants.js)
```javascript
// Source: https://r3f.docs.pmnd.rs/tutorials/loading-textures
import { useTexture } from '@react-three/drei'
import { TEXTURE_PATHS } from './constants'

// Call at module scope — registers assets with loader cache before components mount
// This ensures useProgress tracks texture loading correctly
Object.values(TEXTURE_PATHS).forEach(path => {
  useTexture.preload(path)
})
```

### useProgress for Loading Screen
```javascript
// Source: https://r3f.docs.pmnd.rs/tutorials/loading-models
import { useProgress } from '@react-three/drei'

function LoadingScreen() {
  const { progress, active } = useProgress()
  // progress: 0-100 number
  // active: true while any asset is loading
  // ...
}
```

### Stars Starfield
```jsx
// Source: https://drei.docs.pmnd.rs/staging/stars
import { Stars } from '@react-three/drei'

<Stars
  radius={200}    // star sphere radius
  depth={60}      // depth extent
  count={8000}    // number of stars
  factor={4}      // star size factor
  saturation={0}  // 0 = white/grey (correct for space)
  fade            // fade near horizon
  speed={0.5}     // twinkle speed
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` + PostCSS | CSS-first `@import "tailwindcss"` + `@tailwindcss/vite` | Tailwind v4.0 (2025) | No config file, auto content discovery, simpler setup |
| `@react-three/fiber@8` + React 18 | `@react-three/fiber@9` + React 19 | R3F v9 (2024-2025) | React 19 concurrent features; R3F v8 is React 18 only |
| Manual `postprocessing` `EffectComposer` setup | `@react-three/postprocessing` v3 declarative | v3.0 (2024) | Declarative React components; integrates with R3F render loop |
| `Bloom` with `luminanceThreshold={0}` default | Bloom with `luminanceThreshold={0.9}` + `mipmapBlur` | v3 + community best practice | Only selective surfaces glow; higher quality blur |
| `useEffect(() => { gsap.to(...) }, [])` | `useGSAP(() => { gsap.to(...) })` from `@gsap/react` | @gsap/react v2+ | Correct cleanup in React 19 Strict Mode; no double-fire |
| `dpr={window.devicePixelRatio}` | `dpr={[1, 2]}` range | Community best practice | Prevents 4x pixel ratio on high-end Android (3-4 DPR) |
| `drei Loader` component for loading screen | Custom DOM component with `useProgress` | drei has always supported both | `<Loader>` is a plain spinner; `useProgress` enables branded custom screens |

**Deprecated/outdated:**
- `tailwind.config.js` with content globs: deprecated in v4; replaced by CSS-first auto-discovery
- `@react-three/fiber@8`: not compatible with React 19; replaced by v9
- Raw `useEffect` for GSAP: replaced by `useGSAP` from `@gsap/react` for React 19 Strict Mode compatibility
- `<Canvas shadows>` for all scenes: never correct for solar system scenes with PointLight

---

## Open Questions

1. **Texture asset sourcing strategy**
   - What we know: Planet textures need to be in `/public/textures/`. The constants.js schema defines `TEXTURE_PATHS` pointing to `/textures/*.jpg`.
   - What's unclear: No textures exist in the project yet. Phase 2 will need real texture files. Where do they come from — NASA free textures, Solar System Scope CC textures, or procedural?
   - Recommendation: For Phase 1, create a placeholder system: 1x1 pixel solid-color fallback images named as the texture paths, so the Suspense + useProgress system is testable without real texture files. Real textures are sourced and optimized in Phase 2 planning.

2. **r3f-perf + drei v10 runtime compatibility**
   - What we know: `r3f-perf@7.2.3` declares `@react-three/drei >=9` as a peer dep. drei v10 satisfies this range.
   - What's unclear: Runtime compatibility with drei v10's internals has not been tested (was flagged as LOW confidence in STACK.md).
   - Recommendation: Install `r3f-perf` and test it in the scaffold. If it throws at runtime, drop it and use drei's built-in `<Stats>` component instead, or remove the perf HUD entirely (dev-only, not required for shipping).

3. **Canvas camera initial position for full solar system view**
   - What we know: Constants define Neptune at ~64 scene units from the Sun.
   - What's unclear: The exact camera position `[0, 30, 80]` used in examples above needs validation — will all planets (including Neptune at 64 units) be visible in the initial view?
   - Recommendation: Use `camera={{ position: [0, 50, 120], fov: 60 }}` as a conservative starting point and tune during Plan 01-01 implementation. The camera position is a one-line adjustment.

---

## Sources

### Primary (HIGH confidence)

- npm registry live query — all package versions and peer deps verified 2026-02-24
- `@react-three/fiber@9.5.0` peer deps: `react: ">=19 <19.3"`, `three: ">=0.156"` — verified live
- `@react-three/drei@10.7.7` peer deps: `react: "^19"`, `@react-three/fiber: "^9.0.0"` — verified live
- `@react-three/postprocessing@3.0.4` peer deps: `@react-three/fiber: "^9.0.0"` — verified live
- R3F Canvas API docs — https://r3f.docs.pmnd.rs/api/canvas — dpr, shadows, gl, camera props
- R3F loading textures — https://r3f.docs.pmnd.rs/tutorials/loading-textures — useTexture, Suspense pattern
- R3F loading models — https://r3f.docs.pmnd.rs/tutorials/loading-models — useProgress, Suspense fallback
- drei Stars component — https://drei.docs.pmnd.rs/staging/stars — all props verified
- drei Preload component — https://drei.docs.pmnd.rs/performances/preload — gl.compile, `all` prop
- Tailwind CSS v4 Vite installation — https://tailwindcss.com/docs/installation — CSS-first, @tailwindcss/vite plugin
- @react-three/postprocessing Bloom — https://github.com/pmndrs/react-postprocessing — EffectComposer, Bloom, Vignette API
- Vite 7 getting started — https://vite.dev/guide/ — npm create vite, Node.js requirements
- React scale with reducer and context — https://react.dev/learn/scaling-up-with-reducer-and-context — useReducer + Context pattern

### Secondary (MEDIUM confidence)

- `.planning/research/STACK.md` — verified npm versions, version compatibility table (2026-02-24)
- `.planning/research/ARCHITECTURE.md` — Canvas/DOM split, SceneContext shape, data flow patterns (2026-02-24)
- `.planning/research/PITFALLS.md` — critical pitfalls catalogue (2026-02-24)
- WebSearch: Tailwind v4 Vite React setup — multiple community sources confirming CSS-first @import pattern
- WebSearch: @react-three/postprocessing Bloom mipmapBlur — official docs + community examples confirming v3 API

### Tertiary (LOW confidence — flag for validation)

- `useProgress` returning 0 for textures: known issue documented in GitHub issues; workaround (useTexture.preload at module scope) is community-validated but not in official docs. Validate during Phase 1 implementation.
- `r3f-perf` + drei v10 runtime compatibility: STACK.md flagged LOW; verify by actually installing and running in Phase 1 scaffold.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions npm-verified 2026-02-24; peer deps confirmed
- Architecture: HIGH — Canvas/DOM split is canonical R3F, SceneContext is standard React pattern
- Pitfalls: HIGH — all pitfalls reference specific library behaviors documented in official sources
- Code examples: HIGH — all examples synthesized from official R3F + drei + postprocessing docs

**Research date:** 2026-02-24
**Valid until:** 2026-08-24 (stable ecosystem; Tailwind v4 and R3F v9 are recent majors unlikely to break in 6 months)
**R3F constraint watch:** Monitor `react: ">=19 <19.3"` in R3F v9 peer deps — do NOT upgrade React past 19.2.x until this range is updated
