# Architecture Research

**Domain:** Interactive 3D solar system web app (React Three Fiber + GSAP + 2D UI overlay)
**Researched:** 2026-02-24
**Confidence:** HIGH — R3F patterns are well-established; GSAP camera integration is standard; architecture derived from official R3F docs and established community patterns

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.jsx                                  │
│              (Root: state, context providers, layout)            │
├──────────────────────────────┬──────────────────────────────────┤
│        3D LAYER (WebGL)      │       2D LAYER (DOM/HTML)         │
│   <Canvas> (R3F boundary)    │   Tailwind-styled React JSX       │
│                              │                                   │
│  ┌────────────────────────┐  │  ┌──────────┐  ┌─────────────┐  │
│  │     SolarSystem        │  │  │NavSidebar│  │  InfoPanel  │  │
│  │  (scene root/loop)     │  │  └──────────┘  └─────────────┘  │
│  │  ┌──────────────────┐  │  │  ┌───────────────────────────┐  │
│  │  │  Sun             │  │  │  │    TimelineControl        │  │
│  │  ├──────────────────┤  │  │  └───────────────────────────┘  │
│  │  │  Planet (×9)     │  │  │  ┌──────────┐  ┌────────────┐  │
│  │  │  └── Rings       │  │  │  │  TopBar  │  │   Footer   │  │
│  │  │  └── Moon (×n)   │  │  │  └──────────┘  └────────────┘  │
│  │  ├──────────────────┤  │  │  ┌───────────────────────────┐  │
│  │  │  AsteroidBelt    │  │  │  │     LoadingScreen         │  │
│  │  ├──────────────────┤  │  │  └───────────────────────────┘  │
│  │  │  Starfield       │  │  │                                   │
│  │  ├──────────────────┤  │  └──────────────────────────────────┤
│  │  │  OrbitLines      │  │                                      │
│  │  ├──────────────────┤  │         STATE LAYER                  │
│  │  │  PostProcessing  │  │  ┌───────────────────────────────┐  │
│  │  └──────────────────┘  │  │       SceneContext             │  │
│  └────────────────────────┘  │   selectedPlanet, speed,       │  │
│                               │   cameraState, isLoading       │  │
│   <Html> (drei — portal       │  └───────────────────────────┘  │
│    from 3D into DOM)          │                                   │
│   <HoverLabel>                │                                   │
└──────────────────────────────┴──────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Lives In |
|-----------|----------------|----------|
| `App.jsx` | Root layout: positions Canvas + DOM overlay, provides SceneContext | DOM |
| `<Canvas>` | R3F WebGL boundary; owns renderer, camera, raycaster | WebGL |
| `SolarSystem` | Scene root inside Canvas; drives `useFrame` animation loop for all orbits | WebGL |
| `Sun` | Emissive sphere, PointLight, pulsating animation | WebGL |
| `Planet` | Textured sphere, axial tilt, self-rotation, orbital position, click/hover handlers | WebGL |
| `Rings` | Torus geometry with texture; child of Saturn/Uranus | WebGL |
| `Moon` | Small sphere orbiting parent planet; child of Planet | WebGL |
| `AsteroidBelt` | InstancedMesh of ~2000 rocks between Mars/Jupiter | WebGL |
| `Starfield` | `<Points>` geometry with procedurally placed stars | WebGL |
| `OrbitLines` | `<Line>` (drei) elliptical paths per planet; highlights on hover | WebGL |
| `PostProcessing` | `@react-three/postprocessing` EffectComposer: Bloom + vignette | WebGL |
| `HoverLabel` | `<Html>` (drei) portal: planet name floats in 3D space | WebGL→DOM bridge |
| `CameraController` | Holds OrbitControls ref; exposes `flyTo(target, duration)` via GSAP | WebGL |
| `NavSidebar` | Left DOM panel: list of planets, triggers `selectPlanet()` on click | DOM |
| `InfoPanel` | Right DOM panel: slides in on selection; displays planet stats, charts | DOM |
| `TimelineControl` | Bottom DOM strip: speed slider (0–100x), play/pause | DOM |
| `TopBar` | Top DOM bar: app title, keyboard shortcut hints | DOM |
| `LoadingScreen` | DOM overlay during asset load; hides when `isLoaded === true` | DOM |
| `Footer` | Persistent "Created by AU Brussel" branding | DOM |
| `SceneContext` | React context: shared state between 3D scene and 2D UI | State |

---

## Recommended Project Structure

```
src/
├── components/
│   ├── scene/                  # All R3F / WebGL components (live inside <Canvas>)
│   │   ├── SolarSystem.jsx     # Scene root, animation loop coordinator
│   │   ├── Sun.jsx             # Emissive sun + point light
│   │   ├── Planet.jsx          # Reusable planet component (takes data prop)
│   │   ├── Rings.jsx           # Saturn/Uranus ring geometry
│   │   ├── Moon.jsx            # Moon orbiting a parent planet
│   │   ├── AsteroidBelt.jsx    # InstancedMesh asteroid field
│   │   ├── Starfield.jsx       # Points-based procedural stars
│   │   ├── OrbitLines.jsx      # Per-planet elliptical lines
│   │   ├── HoverLabel.jsx      # <Html> drei label over hovered planet
│   │   ├── CameraController.jsx # OrbitControls + GSAP flyTo logic
│   │   └── PostProcessing.jsx  # EffectComposer (Bloom, vignette)
│   └── ui/                     # All DOM/HTML components (live outside <Canvas>)
│       ├── NavSidebar.jsx      # Planet list navigation
│       ├── InfoPanel.jsx       # Planet detail slide-in panel
│       ├── TimelineControl.jsx # Speed slider and play/pause
│       ├── TopBar.jsx          # Header and shortcut hints
│       ├── LoadingScreen.jsx   # Loading overlay
│       └── Footer.jsx          # AU Brussel branding
├── context/
│   └── SceneContext.jsx        # selectedPlanet, speed, cameraMode, isLoaded
├── hooks/
│   ├── useCamera.js            # GSAP flyTo + return-to-overview logic
│   ├── usePlanetSelect.js      # selectPlanet dispatcher (updates context + fires camera)
│   ├── useOrbitalAnimation.js  # Per-frame orbital angle calculation
│   └── useKeyboardShortcuts.js # 1–9, Escape, Space bindings
├── data/
│   ├── planets.js              # Full planet/moon data (NASA values)
│   └── constants.js            # SCALE_FACTOR, DISTANCE_FACTOR, texture paths
├── assets/
│   └── textures/               # Planet texture images (NASA free)
├── App.jsx                     # Root: Canvas + DOM overlay composition
└── main.jsx                    # Vite entry point
```

### Structure Rationale

- **`components/scene/` vs `components/ui/`:** Hard boundary between WebGL world and DOM world. Scene components can only use R3F primitives; UI components are pure React/HTML with Tailwind. This prevents accidental three.js API calls in DOM components.
- **`context/`:** Single SceneContext is the only cross-boundary communication channel. The 3D scene reads `speed` and writes `selectedPlanet`; the 2D UI reads `selectedPlanet` and writes `speed`.
- **`hooks/`:** Camera logic, selection logic, and keyboard shortcuts are pure hooks — not tied to any one component. `useCamera` can be called from both a Planet click (3D) and NavSidebar click (DOM).
- **`data/`:** All planet data is static JS — no async fetching. Centralizing it here means `SolarSystem` can map over planets once to build both the scene and the sidebar list from the same array.

---

## Architectural Patterns

### Pattern 1: Canvas/DOM Split with Shared Context

**What:** The `<Canvas>` WebGL boundary divides the React tree into two worlds. Neither world can directly reach into the other's rendering APIs. Shared state (selection, speed) lives in a React context *above* the Canvas so both worlds can subscribe to it.

**When to use:** Any R3F app that has significant 2D UI alongside the 3D scene.

**Trade-offs:** Clean separation is worth the context overhead. The alternative (drilling props across the Canvas boundary) is far messier.

**Example:**
```jsx
// App.jsx — context wraps both worlds
export default function App() {
  return (
    <SceneProvider>
      <div className="relative w-screen h-screen">
        {/* 3D WORLD */}
        <Canvas className="absolute inset-0">
          <SolarSystem />
          <CameraController />
          <PostProcessing />
        </Canvas>

        {/* 2D WORLD — absolutely positioned over Canvas */}
        <NavSidebar />
        <InfoPanel />
        <TimelineControl />
        <TopBar />
        <Footer />
      </div>
    </SceneProvider>
  );
}
```

### Pattern 2: useFrame for the Orbital Animation Loop

**What:** R3F's `useFrame(callback)` hook runs `callback` on every render frame (60fps). Orbital position is computed each frame from a `clockRef` (elapsed time × speed multiplier). Each `Planet` subscribes to its own `useFrame` for self-rotation and orbital position — no global update loop needed.

**When to use:** Any per-frame animation in R3F. The R3F scheduler batches all `useFrame` calls into one RAF loop — never use `requestAnimationFrame` directly in R3F components.

**Trade-offs:** Distributing `useFrame` across many components is fine for ~20 bodies. For 10,000+ objects, consolidate into one `useFrame` in the parent. The asteroid belt uses `InstancedMesh` to avoid this concern for particles.

**Example:**
```jsx
// Planet.jsx
function Planet({ data }) {
  const meshRef = useRef();
  const { speed } = useSceneContext();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed * data.orbitalSpeed;
    // Orbital position
    meshRef.current.position.x = Math.cos(t) * data.distance;
    meshRef.current.position.z = Math.sin(t) * data.distance;
    // Self rotation
    meshRef.current.rotation.y += data.rotationSpeed * speed * 0.01;
  });

  return <mesh ref={meshRef} />;
}
```

### Pattern 3: GSAP Camera Fly-To via useCamera Hook

**What:** Camera animation is owned by a dedicated `CameraController` component that holds refs to Three.js camera and OrbitControls. A `useCamera` hook exposes `flyTo(planet)` and `flyToOverview()`. Both `Planet` (click handler in WebGL) and `NavSidebar` (click handler in DOM) call the same hook — because hooks work identically in both worlds as long as the same context is provided.

**When to use:** Anytime multiple UI entry points (3D click + sidebar click + keyboard shortcut) must trigger the same camera behavior.

**Trade-offs:** GSAP tweens the raw Three.js camera values rather than React state, which is correct — camera position is NOT React state (updating it via setState would cause unnecessary re-renders at 60fps). The camera ref is stored in a ref, not state.

**Example:**
```jsx
// hooks/useCamera.js
export function useCamera() {
  const { cameraRef, controlsRef } = useCameraContext();

  const flyTo = useCallback((planet) => {
    const target = new THREE.Vector3(planet.position.x, 0, planet.position.z);
    const camPos = target.clone().add(new THREE.Vector3(0, planet.radius * 3, planet.radius * 5));

    gsap.to(cameraRef.current.position, {
      x: camPos.x, y: camPos.y, z: camPos.z,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => controlsRef.current.target.lerp(target, 0.05),
    });
  }, [cameraRef, controlsRef]);

  return { flyTo };
}
```

### Pattern 4: Drei `<Html>` for 3D-Anchored Labels

**What:** `@react-three/drei`'s `<Html>` component portals a DOM element into a specific 3D position. Use this for hover labels (planet name appears in 3D space above the sphere) without managing CSS transforms manually.

**When to use:** Any text/DOM content that needs to track a 3D object.

**Trade-offs:** `<Html>` is less performant than `<Text>` (a pure mesh-based text). For hover-only labels (rarely visible, single body at a time), `<Html>` is fine and looks better. For always-visible labels on 20+ objects, switch to `<Text>` from drei.

**Example:**
```jsx
// HoverLabel.jsx (child of Planet)
function HoverLabel({ name, isHovered }) {
  if (!isHovered) return null;
  return (
    <Html center distanceFactor={10}>
      <div className="text-white text-sm font-bold bg-black/60 px-2 py-1 rounded">
        {name}
      </div>
    </Html>
  );
}
```

---

## Data Flow

### Planet Selection Flow

```
User clicks planet (3D mesh) OR NavSidebar item (DOM)
    ↓
usePlanetSelect() hook
    ↓
SceneContext dispatch: SET_SELECTED_PLANET(id)
    ↙                          ↘
3D Scene reacts:             DOM reacts:
CameraController             InfoPanel reads selectedPlanet
reads new selection          from context → slides in
fires GSAP flyTo()           NavSidebar highlights item
OrbitLines highlights line   TopBar shows planet name
```

### Orbital Animation Flow

```
useFrame tick (60fps)
    ↓
Each Planet reads: clock.getElapsedTime() × speed × orbitalSpeed
    ↓
Updates mesh.position.x / mesh.position.z (THREE.js object mutation)
    ↓
No React state update — Three.js handles the render
    ↓
OrbitLines read same position via shared refs for hover glow sync
```

### Speed Control Flow

```
User drags TimelineControl slider (DOM)
    ↓
SceneContext dispatch: SET_SPEED(value)
    ↓
All Planet useFrame callbacks read speed from context
    ↓
Animation immediately accelerates/decelerates (no re-render needed —
speed is read inside useFrame, not as a prop)
```

### State Management

```
SceneContext (single context, no external state library needed)
    ↓ (subscribe)
┌──────────────────────────────────────────────────────────┐
│  State shape:                                             │
│  {                                                        │
│    selectedPlanet: string | null,  // planet id          │
│    hoveredPlanet: string | null,   // planet id          │
│    speed: number,                  // 0–100              │
│    isPaused: boolean,                                     │
│    cameraMode: 'overview' | 'focused', // for UI state   │
│    isLoaded: boolean,                                     │
│  }                                                        │
└──────────────────────────────────────────────────────────┘

Writers:
- Planet (hover/click) → hoveredPlanet, selectedPlanet
- CameraController → cameraMode (after fly-to completes)
- TimelineControl → speed, isPaused
- R3F Canvas → isLoaded (via onCreated or Suspense)
- useKeyboardShortcuts → selectedPlanet, isPaused

Readers:
- InfoPanel → selectedPlanet
- NavSidebar → selectedPlanet, hoveredPlanet
- OrbitLines → hoveredPlanet
- SolarSystem useFrame → speed, isPaused
- LoadingScreen → isLoaded
```

### Key Data Flows

1. **Planet data (static):** `data/planets.js` array is imported once at module load. `SolarSystem` maps over it to render `<Planet>` components; `NavSidebar` maps over the same array for the sidebar list. Single source of truth for planet count, names, distances, and textures.

2. **Camera position (mutable ref, NOT state):** Camera position and OrbitControls target are Three.js objects mutated by GSAP. They are stored in refs (`cameraRef`, `controlsRef`), never in React state. This keeps the animation loop at 60fps without triggering React reconciliation.

3. **Hover state (React context):** Hover *is* React state (in SceneContext) because it drives DOM changes (label visibility, orbit line glow, sidebar highlight). Pointer events from Three.js raycaster dispatch `SET_HOVERED_PLANET` to context.

---

## Component Boundaries (What Talks to What)

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `Planet` → `SceneContext` | Context dispatch (`SET_SELECTED`, `SET_HOVERED`) | Pointer events trigger dispatch |
| `NavSidebar` → `SceneContext` | Context dispatch (`SET_SELECTED`) | Click triggers same action as planet click |
| `SceneContext` → `InfoPanel` | Context read (`selectedPlanet`) | Panel reads and renders planet data from `planets.js` |
| `SceneContext` → `CameraController` | Context read via `useCamera` | `useEffect` on `selectedPlanet` fires `flyTo()` |
| `Planet` → `CameraController` | `useCamera()` hook call | On click, fires flyTo immediately |
| `TimelineControl` → `SolarSystem` | Context (`speed`, `isPaused`) | `useFrame` reads speed each tick |
| `SolarSystem` → `Planet` | Props (`data`) | Planet receives its config at render time |
| `Planet` → `Moon` | Props (`parentRef`) | Moon reads parent position via ref each frame |
| `useKeyboardShortcuts` → `SceneContext` | Context dispatch | Keyboard events mapped to same actions as clicks |
| `Canvas (R3F)` → `LoadingScreen` | `isLoaded` in context | R3F `onCreated` or Suspense fallback updates context |

---

## Suggested Build Order

Dependencies between components determine the safest build sequence:

```
Phase 1 — Foundation (no dependencies)
├── SceneContext (everything depends on this)
├── data/planets.js (everything depends on this)
├── Canvas scaffold in App.jsx
└── Starfield (no deps, visual confidence early)

Phase 2 — Core Scene Bodies (depends on Phase 1)
├── Sun (simple sphere, no orbital logic)
├── Planet (core component: sphere + orbital useFrame)
└── OrbitLines (depends on planet data positions)

Phase 3 — Camera & Selection (depends on Phases 1-2)
├── CameraController + useCamera hook
├── usePlanetSelect hook
└── HoverLabel (<Html> depends on Planet existing)

Phase 4 — Extended Scene (depends on Phases 1-3)
├── Moon (depends on Planet ref pattern)
├── Rings (depends on Planet)
├── AsteroidBelt (InstancedMesh, independent of selection)
└── PostProcessing (depends on scene being populated)

Phase 5 — 2D UI (depends on SceneContext from Phase 1)
├── NavSidebar (reads selectedPlanet, triggers selectPlanet)
├── InfoPanel (reads selectedPlanet, reads planets.js)
├── TimelineControl (writes speed/isPaused)
├── TopBar, Footer (static/display only)
└── LoadingScreen (reads isLoaded)

Phase 6 — Keyboard & Polish (depends on all above)
├── useKeyboardShortcuts (dispatches to existing actions)
├── Responsive layout (mobile sidebar/bottom sheet)
└── Loading progress
```

Key dependency rule: **SceneContext and `data/planets.js` must exist before any other component.** All scene components depend on planet data; all UI components depend on context. Everything else can be built in parallel within a phase.

---

## Anti-Patterns

### Anti-Pattern 1: Storing Camera Position in React State

**What people do:** Call `setCamera({ x, y, z })` from a useState hook and derive camera position from React state in `useEffect`.

**Why it's wrong:** At 60fps, updating React state triggers reconciliation on every frame. The scene becomes sluggish and unresponsive. Three.js objects are mutable by design — mutate them.

**Do this instead:** Store camera and OrbitControls in `useRef`. Mutate with GSAP. React state only tracks logical state (`cameraMode: 'focused'`), not the numeric position.

---

### Anti-Pattern 2: Putting Heavy Logic Inside useFrame

**What people do:** Computing physics, sorting arrays, or doing JSON operations inside `useFrame` callbacks.

**Why it's wrong:** `useFrame` runs 60 times per second. Any computation inside it compounds. A 1ms operation = 60ms/sec = constant CPU drain. The asteroid belt with 2000 instances doing individual position updates in naive loops is a classic offender.

**Do this instead:** Pre-compute positions (orbital angles only change by a tiny delta). For the asteroid belt, use `InstancedMesh` with a matrix update in a single `useFrame` loop — not 2000 separate mesh components. Pre-compute the sin/cos lookup tables if needed.

---

### Anti-Pattern 3: Rendering DOM UI Components Inside the R3F Canvas

**What people do:** Place `<NavSidebar>` or `<InfoPanel>` as children of `<Canvas>` and use drei's `<Html>` for all UI.

**Why it's wrong:** `<Html>` portals are designed for 3D-anchored labels (hover names, tooltip pins). Using them for full panels breaks tab order, accessibility, and scroll behavior. Tailwind classes don't work reliably inside `<Html>` portals in all configurations.

**Do this instead:** Keep all panel/sidebar/controls UI *outside* the `<Canvas>` in the regular DOM, positioned absolutely over it with CSS. Only use `<Html>` for truly 3D-anchored elements (hover labels, object-space tooltips).

---

### Anti-Pattern 4: Single Giant SolarSystem Component

**What people do:** Put all planets, the sun, asteroid belt, orbit lines, and post-processing inside one 600-line `SolarSystem.jsx`.

**Why it's wrong:** Impossible to work on individual features, difficult to optimize (can't memoize individual bodies), and breaks when adding features (rings, moons, belt).

**Do this instead:** One component per celestial body type. `SolarSystem` is a coordinator that maps over `planets.js` to render `<Planet>` components — nothing more. Each `<Planet>` manages its own refs and `useFrame`.

---

### Anti-Pattern 5: Prop-Drilling the `selectPlanet` Function

**What people do:** Pass `onSelectPlanet` as a prop from `App` down through `Canvas → SolarSystem → Planet` AND also from `App` down through `NavSidebar → PlanetListItem`.

**Why it's wrong:** Two separate prop chains for the same action. When the action changes (e.g., adding a sound effect to selection), it must be updated in two places.

**Do this instead:** The `usePlanetSelect` hook (backed by `SceneContext`) is the single API for selection. Both `Planet` and `NavSidebar` call the hook directly. No prop drilling.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| 3D scene ↔ 2D UI | `SceneContext` React context | Only crossing point; keep it narrow |
| WebGL objects ↔ GSAP | Direct ref mutation | Camera/controls are THREE objects, not React state |
| `useFrame` ↔ planet data | Module import | `data/planets.js` imported at module scope, not via context |
| `Planet` ↔ `Moon` | Ref passed as prop | Moon reads parent mesh ref each frame for relative position |
| R3F Canvas ↔ DOM | CSS absolute positioning | Canvas fills viewport; DOM layers stack on top via z-index |

### External Libraries

| Library | Integration Pattern | Notes |
|---------|---------------------|-------|
| `@react-three/fiber` | `<Canvas>` root + `useFrame`, `useThree` hooks | All 3D components live inside `<Canvas>` |
| `@react-three/drei` | Import helpers: `OrbitControls`, `Html`, `Line`, `Stars`, `EffectComposer` | Saves 80% of boilerplate |
| `@react-three/postprocessing` | `<EffectComposer>` + `<Bloom>` inside Canvas | Must be last child in scene for correct layering |
| `gsap` | Direct mutation of `camera.position`, `controls.target` | Use `@gsap/react` `useGSAP` hook for cleanup |
| Tailwind CSS v4 | Standard CSS classes on DOM elements only | Does not apply inside WebGL; `<Html>` portals need explicit className |

---

## Scaling Considerations

This is a static portfolio piece — scaling means visual performance, not user volume.

| Concern | Mitigation |
|---------|------------|
| Asteroid belt (2000+ instances) | `InstancedMesh` — single draw call for all instances |
| Planet textures (9 × 2-4MB) | Lazy load with R3F Suspense; show progress in LoadingScreen |
| Post-processing cost | Bloom is expensive on mobile; conditionally disable if `window.devicePixelRatio < 2` |
| Mobile GPU limits | Reduce asteroid count, disable vignette, lower texture resolution on mobile |
| `useFrame` callback count | ~15 components with `useFrame` — well within R3F limits; no optimization needed |
| Re-renders from context | `selectedPlanet` changes cause re-render of all context consumers; memoize pure display components |

---

## Sources

- React Three Fiber official documentation: https://docs.pmnd.rs/react-three-fiber (HIGH confidence — official docs)
- `@react-three/drei` documentation: https://drei.docs.pmnd.rs (HIGH confidence — official docs)
- GSAP + Three.js camera animation patterns: established community pattern, validated against R3F examples repo (MEDIUM confidence)
- InstancedMesh for asteroid belts: Three.js official docs pattern (HIGH confidence — official)
- Canvas/DOM overlay separation: core R3F architecture, documented in official examples (HIGH confidence)

---

*Architecture research for: Interactive 3D solar system web app (React Three Fiber + GSAP)*
*Researched: 2026-02-24*
