# Project Research Summary

**Project:** Solar System Map
**Domain:** Interactive 3D Solar System Web App (Portfolio Showcase)
**Researched:** 2026-02-24
**Confidence:** HIGH (stack verified via npm registry; architecture from official R3F docs; pitfalls from official documentation and community post-mortems; features MEDIUM due to unavailable web search)

## Executive Summary

This is a WebGL-based interactive orrery built as a portfolio showcase for AU Brussel. The field is well-established: React Three Fiber (R3F) is the clear standard for React + WebGL projects, and the library ecosystem around it (drei for helpers, @react-three/postprocessing for bloom, GSAP for camera animation, zustand for state) is mature and well-documented. The recommended stack is React 19 + R3F v9 + three.js 0.183 + GSAP 3, deployed as a pure static site — a combination that is version-compatible, performant, and already what portfolio reviewers expect to see from a senior frontend engineer.

The recommended architecture enforces a hard boundary between the 3D WebGL world (inside `<Canvas>`) and the 2D DOM world (Tailwind panels positioned over the canvas). A single SceneContext bridges them. Camera position is never React state — it lives in a ref mutated by GSAP. This constraint is not optional: violating it causes 60fps React reconciliation during every camera animation, which destroys the app. All orbital animation runs inside R3F's `useFrame` hook using modulo-based time (not accumulated deltas) to prevent drift. The asteroid belt uses InstancedMesh — a non-negotiable architectural decision at any instance count above ~200.

The key risk in this project is not architectural complexity but rather the accumulation of subtle per-frame mistakes: creating Three.js objects inside `useFrame`, storing camera position in React state, enabling shadow maps, and failing to set a luminance threshold on Bloom. Each individual mistake is small but their combined effect is a scene that looks fine in development and is unusable in production on mobile. The mitigation strategy is to establish the correct patterns in Phase 1 (canvas setup, scale constants, Suspense boundary, disposal pattern, Bloom threshold) before writing any planet or interaction code. Every subsequent phase builds on a foundation that is already correct.

## Key Findings

### Recommended Stack

The stack is React 19.2.4 + Vite 7.3.1 + @react-three/fiber 9.5.0 + three 0.183.1 + @react-three/drei 10.7.7 + @react-three/postprocessing 3.0.4 + GSAP 3.14.2 + @gsap/react 2.1.2 + zustand 5.0.11 + Tailwind CSS v4. All versions are npm-registry verified as of 2026-02-24. The single most important version constraint: R3F v9 requires `react: ">=19 <19.3"` — do not upgrade React beyond 19.2.x until R3F v9 releases an updated peer dep range.

Zustand is required over React Context for state that is read inside `useFrame` — Context's re-render-all-consumers pattern is fatal at 60fps. However, the SceneContext (selection, speed, isLoaded) can use React Context because these values change infrequently (on user interaction, not per-frame). GSAP is the correct animation library for camera fly-to because it gives precise cinematic timeline control; react-spring's physics model is wrong for the "fly through space" feel. OrbitControls must be disabled (`controls.enabled = false`) during every GSAP tween and re-enabled in `onComplete`.

**Core technologies:**
- React 19.2.4: UI layer — concurrent features improve responsiveness during scene load; required by R3F v9
- @react-three/fiber 9.5.0: React WebGL renderer — declarative Three.js in JSX; useFrame is the animation loop
- @react-three/drei 10.7.7: R3F helper library — replaces dozens of boilerplate setups (Stars, OrbitControls, Html, Line, useTexture, Preload)
- three 0.183.1: 3D engine peer dep — SphereGeometry, TextureLoader, MeshStandardMaterial, InstancedMesh all native
- @react-three/postprocessing 3.0.4: Post-processing pipeline — Bloom (sun glow), Vignette; declarative EffectComposer
- GSAP 3.14.2 + @gsap/react 2.1.2: Camera animation — cinematic fly-to with power2.inOut easing; useGSAP handles React 19 Strict Mode cleanup
- zustand 5.0.11: Client state — selector-based subscriptions prevent cascading re-renders in the animation loop
- Tailwind CSS v4.2.1: 2D overlay styling — CSS-first, zero runtime, correct for panels over a WebGL canvas
- Vite 7.3.1: Build tool — fastest HMR for 3D projects; add `optimizeDeps: { include: ['three'] }` to pre-bundle

**What NOT to use:**
- R3F v8 (React 18 only), react-spring for camera animation, `<Canvas shadows>` enabled, `MeshPhongMaterial`, `useState` for camera position, `new THREE.Vector3()` inside `useFrame`

### Expected Features

The feature research identified 13 table stakes, 17 differentiators, and 10 explicit anti-features (scope traps). The prioritization matrix is clear.

**Must have (table stakes) — v1 launch:**
- All 8 planets + Pluto orbiting Sun with textures and correct relative sizes
- Saturn ring system — single most expected visual; absence is universally noticed
- Sun with bloom glow + PointLight — flat grey sphere reads as a bug
- Starfield background — empty void feels unfinished
- Click planet → GSAP camera fly-to + info panel — core interaction loop
- Info panel: name, diameter, distance, orbital period, fun facts (6 stats minimum)
- Navigation sidebar with all bodies — orientation aid
- Pause/play + speed slider (0–100x) — engagement hook
- Orbit lines (faint, hover brightens) — spatial legibility
- Earth Moon — most expected moon; absence is noticed
- Keyboard shortcuts (1-9, Space, Escape) — power-user delight
- Loading screen with progress + space fact — polish signal
- Responsive design (desktop + mobile) — portfolio reviewed everywhere
- AU Brussel footer branding — portfolio purpose

**Should have (competitive differentiators) — v1.x after launch:**
- Galilean moons for Jupiter (Io, Europa, Ganymede, Callisto)
- Saturn visible moons (Titan minimum)
- Asteroid belt (InstancedMesh) — visual variety, demonstrates instancing skill
- Composition bar chart in info panel — animated data visualization
- Venus retrograde + Uranus extreme tilt — scientific accuracy easter eggs
- Neptune faint rings — completeness

**Defer to v2+:**
- Real ephemeris positions (VSOP87/JPL) — imperceptible difference for portfolio viewers; engineering burden is extreme
- WebXR/VR mode — <1% of portfolio visitors; doubles interaction paradigm
- Spacecraft trajectories — major scope increase; mention in README as planned

**Anti-features to explicitly avoid:**
- Real-time shadow maps — prohibitive on mobile GPU
- Real moon counts (95+ for Saturn) — performance killer
- Day/night cycle visible from orbit — effort-to-impression ratio too low
- Fully accurate elliptical orbits — non-trivial math for imperceptible visual difference
- Procedural terrain generation — beyond portfolio scope; use NASA textures

### Architecture Approach

The architecture divides the React tree into two hard-separated worlds: 3D scene components live inside `<Canvas>` (using R3F primitives and `useFrame`), while 2D UI components (NavSidebar, InfoPanel, TimelineControl) live in the DOM positioned absolutely over the canvas with CSS. A single SceneContext sits above both worlds and serves as the only cross-boundary communication channel. Camera position and OrbitControls target are Three.js refs mutated by GSAP — never React state. All planet data lives in a static `data/planets.js` module imported once at module load, consumed by both the scene and the sidebar.

**Major components:**
1. SceneContext — cross-boundary state: selectedPlanet, hoveredPlanet, speed, isPaused, cameraMode, isLoaded
2. SolarSystem — scene root; maps planets.js to Planet components; coordinates useFrame animation loop
3. Planet — textured sphere with axial tilt, orbital useFrame, self-rotation, click/hover handlers; renders Rings and Moon as children
4. CameraController — holds OrbitControls ref; exposes flyTo(target) via GSAP; disables/enables controls around tweens
5. useCamera hook — shared camera animation API called by Planet click (3D), NavSidebar click (DOM), and keyboard shortcuts
6. PostProcessing — EffectComposer with Bloom (luminanceThreshold 0.9+) and Vignette; last child in scene
7. AsteroidBelt — InstancedMesh only; single draw call for all instances; matrix buffer updated in useFrame
8. InfoPanel — DOM slide-in panel; persistently rendered, prop-driven content (no re-mount on planet switch)
9. NavSidebar — DOM panel; maps same planets.js array; triggers usePlanetSelect hook
10. LoadingScreen — DOM overlay; tied to isLoaded context; uses R3F Suspense + `<Preload all />`

**Recommended project structure:**
```
src/
├── components/scene/   # R3F / WebGL (inside Canvas)
├── components/ui/      # DOM / HTML (outside Canvas, positioned over it)
├── context/            # SceneContext
├── hooks/              # useCamera, usePlanetSelect, useOrbitalAnimation, useKeyboardShortcuts
├── data/               # planets.js, constants.js (SCALE_FACTOR, DISTANCE_FACTOR, texture paths)
├── assets/textures/    # NASA planet texture images
└── App.jsx             # Root: Canvas + DOM overlay composition
```

### Critical Pitfalls

Research identified 10 critical pitfalls (rewrites or permanent performance loss), 8 moderate pitfalls, and 7 minor pitfalls. The top 5 that must be prevented from day 1:

1. **Geometry and material GPU leaks** — create Three.js objects imperatively and never dispose them; GPU VRAM fills over time causing tab crashes. Prevention: use JSX material declarations (`<meshStandardMaterial />`); dispose imperatively-created objects in useEffect cleanup; never construct inside useFrame.

2. **new THREE.Vector3() inside useFrame** — allocating Vector3/Quaternion/Matrix objects at 60fps triggers rhythmic GC pauses every 2-4 seconds. Prevention: pre-allocate scratch objects at module scope (`const _vec = new THREE.Vector3()`); use mutating methods (.set(), .copy(), .lerp()).

3. **Individual meshes for asteroid belt** — one draw call per asteroid; 2000 asteroids = 2000+ draw calls = FPS collapse to <10. Prevention: InstancedMesh from first implementation, never refactor from individual meshes.

4. **GSAP animating React state** — using setState inside GSAP onUpdate triggers React reconciliation at 60fps. Prevention: GSAP animates camera.position ref directly; React state only tracks logical state (which planet is selected, panel open/closed).

5. **OrbitControls fighting GSAP camera tweens** — both systems try to own the camera simultaneously. Prevention: disable OrbitControls before tween (`controls.enabled = false`), re-enable in onComplete; GSAP must animate both camera.position AND controls.target.

Additional critical pitfalls: Bloom without luminance threshold (everything glows), texture loading without Suspense (black planets on slow connections), real astronomical scale (outer planets invisible), mobile touch event conflicts between canvas and HTML overlays.

## Implications for Roadmap

Architecture research provides an explicit 6-phase build order based on dependencies. Features research confirms this ordering (orbital loop is foundational; camera fly-to is a shared primitive; UI panels can be parallel to camera work). Pitfalls research overlays specific "must establish before proceeding" constraints per phase.

### Phase 1: Foundation — Canvas, Scene Setup, Core Infrastructure

**Rationale:** SceneContext and planets.js are required by every other component. Scale constants, Suspense boundary, Bloom threshold, disposal pattern, and Canvas configuration (dpr, no shadows) must be established first — retrofitting these later causes rewrites. Architecture research explicitly states: "SceneContext and planets.js must exist before any other component."

**Delivers:** Vite scaffold, App.jsx Canvas/DOM split, SceneContext, planets.js data schema, constants.js with logarithmic scale compression, Suspense + Preload + LoadingScreen, Starfield, basic Sun sphere, PostProcessing with Bloom (luminanceThreshold 0.9+), canvas dpr={[1,2]}, no shadows

**Features:** Starfield background, loading screen, Sun as light source (partial)

**Pitfalls to prevent:** Missing Suspense boundary (Pitfall 7), wrong scale making outer planets invisible (Pitfall 8), Bloom on all objects (Pitfall 5), shadow maps enabled (Pitfall 13), canvas dpr without cap (Pitfall 14), geometry/material leaks (Pitfall 1)

**Research flag:** No deeper research needed — well-documented patterns, official R3F docs cover all setup steps.

### Phase 2: Core Scene Bodies — Planets, Sun, Orbital Animation

**Rationale:** The orbital animation loop is the dependency that everything else (moons, asteroid belt, speed control) hangs off. Build it correctly once using modulo-based time and pre-allocated scratch vars. Planet component is reused for all 9 bodies. Saturn rings and Earth Moon ship in this phase as they share the Planet component pattern.

**Delivers:** Planet component (textured sphere, orbital useFrame, axial tilt, self-rotation), all 8 planets + Pluto, Saturn RingGeometry (depthWrite:false), Earth Moon, OrbitLines (with Y offset anti-Z-fighting), Sun emissive + PointLight

**Features:** All planets orbiting Sun, Saturn ring system, Earth Moon, Sun bloom glow, orbit lines

**Stack:** Planet uses useFrame (R3F), useTexture (drei), MeshStandardMaterial (three.js), maath for orbital angle; OrbitLines uses Line (drei)

**Pitfalls to prevent:** Per-frame allocation in useFrame (Pitfall 2), orbital drift via accumulated deltas (Pitfall 16), Saturn rings clipping sphere (Pitfall 18), orbit line Z-fighting (Pitfall 10)

**Research flag:** No deeper research needed — established R3F patterns.

### Phase 3: Camera System and Planet Selection

**Rationale:** Camera fly-to is a shared primitive used by Phase 4 (sidebar), Phase 5 (keyboard shortcuts), and the planet click handler. Build it as a hook (useCamera) called from all entry points rather than duplicating the logic. Hover labels and selection state ship here.

**Delivers:** CameraController + useCamera hook (GSAP flyTo with OrbitControls disable/enable handoff), usePlanetSelect hook, HoverLabel (`<Html occlude>`), SceneContext wired for selectedPlanet/hoveredPlanet, InfoPanel (persistent render, prop-driven content, slide-in animation), click pointer cursor on planets

**Features:** Click planet → fly-to + info panel, hover label, planet info stats, fun facts

**Stack:** GSAP 3 + @gsap/react useGSAP hook, drei Html with occlude prop, OrbitControls makeDefault

**Pitfalls to prevent:** GSAP animating React state (Pitfall 4), OrbitControls/GSAP fight (Pitfall 6), GSAP double-fire in Strict Mode (Pitfall 15), Html labels rendering through geometry without occlude (Pitfall 11), InfoPanel re-mount on selection change (Pitfall 17), stale refs in useFrame closures (Pitfall 12)

**Research flag:** No deeper research needed — useCamera pattern is well-documented in R3F community; GSAP + OrbitControls handoff is a known solution.

### Phase 4: 2D UI Layer — Navigation, Controls, Responsive Layout

**Rationale:** NavSidebar and TimelineControl can be built in parallel once SceneContext and usePlanetSelect exist. Responsive layout ships here because mobile touch event conflicts with canvas must be resolved before the final feature set. Keyboard shortcuts are low-complexity and ship with this phase.

**Delivers:** NavSidebar (planet list, planet select, highlights), TimelineControl (speed slider 0–100x, play/pause toggle), TopBar, Footer (AU Brussel branding), useKeyboardShortcuts (1-9, Space, Escape), responsive layout (mobile sidebar collapse, bottom sheet InfoPanel), touch-action:none on canvas + stopPropagation on HTML overlays

**Features:** Navigation sidebar, pause/play, speed control, keyboard shortcuts, responsive mobile layout, AU Brussel branding

**Pitfalls to prevent:** Mobile touch events conflicting with OrbitControls (Pitfall 9), no back-to-overview on mobile (UX pitfall), orbital speed defaulting to 1x (UX pitfall — use 30x default)

**Research flag:** Mobile touch event architecture may need spot-checking for iOS Safari specifics. Otherwise standard patterns.

### Phase 5: Polish and Differentiators — Extended Bodies, Visual Enhancements

**Rationale:** Galilean moons, asteroid belt, and atmospheric extras require the core Planet/Moon component pattern to be stable. Asteroid belt must use InstancedMesh — this is a separate implementation from the Planet component. Ship these after v1 is verified working so they don't introduce risk to the core experience.

**Delivers:** AsteroidBelt (InstancedMesh, ~2000 instances, single draw call), Galilean moons for Jupiter (Io, Europa, Ganymede, Callisto), Saturn moons (Titan), Earth cloud layer (separate semi-transparent sphere), Venus retrograde rotation (negative rotationSpeed), Uranus extreme tilt (98° group rotation), Neptune faint rings, composition bar chart in InfoPanel (CSS/SVG + GSAP stagger), fun facts carousel

**Features:** All v1.x differentiators from FEATURES.md

**Pitfalls to prevent:** Individual meshes for asteroid belt (Pitfall 3 — InstancedMesh mandatory), real moon counts crashing performance (anti-feature from FEATURES.md)

**Research flag:** No deeper research needed — InstancedMesh pattern is well-documented in Three.js official docs.

### Phase 6: Performance Validation and Production Hardening

**Rationale:** Performance issues (GC hiccups, memory leaks, mobile FPS) are invisible in development and only manifest at full scene complexity. A dedicated phase for production validation prevents shipping a broken experience.

**Delivers:** Verified InstancedMesh draw call count (Spector.js audit), GC hiccup audit (grep all useFrame for `new THREE.*`), Bloom threshold verified (rings/labels/lines don't glow), camera fly-to stability (rapid planet switching), mobile touch verified on real device, HiDPI crisp rendering confirmed, texture loading on throttled 3G verified, WebP/KTX2 texture compression, r3f-perf and leva removed from production build, Vercel/Netlify static deployment

**Features:** All v1 requirements verified working; production deployment

**Pitfalls to address:** Full "Looks Done But Isn't" checklist from PITFALLS.md; texture path resolution in Vite prod build (Pitfall 7 variant); Tailwind canvas sizing resets (integration gotcha)

**Research flag:** Texture compression (WebP vs KTX2) may need research during planning — depends on texture file sizes and target browser support. Otherwise standard deployment.

### Phase Ordering Rationale

- Phase 1 before everything: SceneContext and planets.js are hard dependencies of all other components; Bloom threshold, scale constants, and Suspense boundary cannot be retrofitted without touching every component.
- Phase 2 before camera: Camera fly-to requires stable Planet meshes with known positions to fly to; can't implement flyTo without a target.
- Phase 3 before UI: NavSidebar and keyboard shortcuts both call usePlanetSelect — that hook must exist first.
- Phase 4 (UI) is relatively independent: NavSidebar can read existing SceneContext; mobile layout is self-contained. Some Phase 4 work can begin in parallel with late Phase 3 work.
- Phase 5 (polish) after v1 verified: Adding asteroid belt or moon systems to an unstable core scene multiplies debugging complexity.
- Phase 6 last: Performance validation requires full scene complexity to surface real issues.

### Research Flags

Phases needing deeper research during planning:
- **Phase 6 (texture compression):** WebP vs KTX2/basis for planet textures — depends on actual texture file sizes from NASA source. If textures are under 2MB, WebP is sufficient. If over, KTX2 is worth the `useKTX2` drei setup complexity.
- **Phase 4 (iOS Safari touch):** Mobile touch-action interaction with iOS 17+ Safari rubber-band scroll may have updated behavior since training data. Recommend manual verification on device during planning.

Phases with well-documented patterns (skip research-phase):
- **Phase 1:** Vite + R3F + Tailwind setup is straightforward; official docs cover all setup steps.
- **Phase 2:** Planet orbital math and useFrame pattern are canonical R3F examples.
- **Phase 3:** GSAP + OrbitControls handoff is a documented community pattern with known solution.
- **Phase 5:** InstancedMesh is documented in Three.js official docs with code examples.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions npm-registry verified 2026-02-24; peer dep ranges confirmed live |
| Features | MEDIUM | WebSearch unavailable; competitor analysis from training data (cutoff August 2025); core table stakes are universally stable, differentiator list may have minor changes |
| Architecture | HIGH | Official R3F docs + drei docs are primary sources; Canvas/DOM split and useFrame patterns are canonical and stable |
| Pitfalls | HIGH | R3F official pitfalls documentation + Three.js manual + @gsap/react docs are primary sources; all critical pitfalls are library-documented behaviors |

**Overall confidence:** HIGH

### Gaps to Address

- **Competitor feature verification:** FEATURES.md competitor analysis was based on training data. Before adding any "because competitor X does it" justification to requirements, manually check current feature state of NASA Eyes, Solar System Scope, and Solar System Scope web app. Unlikely to change the v1 feature set but worth confirming for v1.x differentiators.

- **Texture asset sourcing:** The planet texture pipeline (NASA free textures, Solar System Scope textures, or custom) is not resolved. The choice affects file sizes (2K vs 4K vs 8K), which affects whether KTX2 compression is needed and the texture loading strategy. Resolve before Phase 2 planning.

- **r3f-perf + drei v10 runtime compatibility:** STACK.md flagged this as LOW confidence — r3f-perf@7.2.3 requires drei@>=9 but its compatibility with drei v10 is not verified against live runtime (only peer dep declarations). If r3f-perf causes issues in dev, replace with custom `<Stats>` from drei or drop it; it's dev-only and not required for shipping.

- **React 19 canary constraint:** If the project timeline extends beyond ~6 months, R3F v9's `react: ">=19 <19.3"` constraint may need revisiting. R3F v9 may release an update to support React 19.3+ or newer. Monitor pmnd.rs release notes.

## Sources

### Primary (HIGH confidence)
- npm registry — all package versions and peer deps verified 2026-02-24
- React Three Fiber official docs (docs.pmnd.rs/react-three-fiber) — architecture patterns, useFrame, pitfalls
- @react-three/drei documentation (drei.docs.pmnd.rs) — Html, OrbitControls, Stars, Line, Instances, Preload, Loader
- Three.js manual "How to dispose of objects" (threejs.org/docs) — disposal pattern
- @gsap/react documentation — React 19 Strict Mode compatibility, useGSAP hook
- Three.js InstancedMesh documentation (threejs.org/docs) — asteroid belt pattern

### Secondary (MEDIUM confidence)
- @react-three/postprocessing bloom layer strategy — community-validated pattern (no single official source)
- GSAP + Three.js camera tween pattern — training knowledge; standard community pattern
- zustand vs Context for 3D state — training knowledge; widely documented as R3F best practice
- OrbitControls vs GSAP conflict mitigation — training knowledge; known issue with known solution

### Tertiary (MEDIUM confidence — training data)
- NASA Eyes on the Solar System feature analysis — https://eyes.nasa.gov/apps/solar-system/
- Solar System Scope competitor analysis — https://www.solarsystemscope.com/
- Design document — `/Users/theshumba/Documents/GitHub/solar-system-map/docs/plans/2026-02-24-solar-system-map-design.md`

---
*Research completed: 2026-02-24*
*Ready for roadmap: yes*
