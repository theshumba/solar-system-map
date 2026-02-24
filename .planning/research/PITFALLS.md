# Domain Pitfalls

**Domain:** Interactive 3D Web App — React Three Fiber / Three.js / GSAP Solar System
**Researched:** 2026-02-24
**Confidence:** HIGH (React Three Fiber pitfalls are well-documented across official R3F docs, Three.js manual, and extensive community post-mortems; patterns verified against known library behaviors)

---

## Critical Pitfalls

Mistakes that cause rewrites, permanent performance degradation, or total loss of 60fps target.

---

### Pitfall 1: Geometry and Material Leaks (No Disposal)

**What goes wrong:**
Every Three.js `BufferGeometry`, `Material`, `Texture`, and `RenderTarget` allocates GPU memory. When React components re-render or unmount, the old JS objects are garbage-collected but the GPU allocations are NOT freed automatically. The GPU VRAM fills up silently over minutes of use. On low-end hardware this manifests as hard tab crashes. On modern machines FPS drops from 60 to 20+ mid-session.

**Why it happens:**
Developers treat Three.js objects like regular JS objects. React's component lifecycle handles JS memory but Three.js has a separate GPU resource lifecycle that React knows nothing about. New developers create `new THREE.MeshStandardMaterial()` inside component bodies, causing a new material allocation per render.

**Consequences:**
- Slow VRAM leak that's invisible in short dev sessions
- Hard crash on mobile (GPU VRAM is ~1-2GB on phones)
- Impossible to profile without GPU memory inspection tools

**Prevention:**
- In R3F, use JSX geometry/material declarations (`<meshStandardMaterial />`) — R3F attaches these to the mesh and disposes them when the component unmounts
- If you must construct Three.js objects imperatively (e.g., in a `useMemo`), call `.dispose()` in a `useEffect` cleanup
- For textures loaded with `useLoader`/`useTexture`, the loader cache handles disposal — never construct `new THREE.TextureLoader()` inside a component body
- Never construct geometries or materials inside `useFrame` (runs 60x/sec)

**Warning signs:**
- Memory tab in DevTools shows growing heap that never drops
- GPU process memory (visible in Chrome Task Manager) creeping up over time
- Smooth performance at startup, degrading after 5+ minutes of exploring
- Hot reload in dev causes visible FPS drop each time

**Phase to address:** Phase 1 (scene foundation) — establish disposal pattern before any planet/material code is written.

---

### Pitfall 2: Creating Objects Inside useFrame (Per-Frame Allocation)

**What goes wrong:**
`useFrame` runs every animation frame (~60 calls/sec). Any object construction inside it (`new THREE.Vector3()`, `new THREE.Quaternion()`, `new THREE.Euler()`) creates fresh heap allocations that must be garbage-collected. At 60fps this triggers GC pauses every few seconds, causing visible frame stutters — the "GC hiccup" pattern. The solar system has ~15+ animated bodies plus asteroid belt; this gets severe fast.

**Why it happens:**
The pattern `planetRef.current.position.set(...)` looks fine but developers often write `planetRef.current.position.copy(new THREE.Vector3(x, y, z))` inside the frame loop without realizing the allocation cost.

**Consequences:**
- Periodic 5-16ms GC stutters that destroy perceived smoothness
- Most visible during fast orbit speed (100x) when orbital math runs every frame
- Invisible in dev with low object counts, catastrophic in production with all planets + moons + asteroid belt

**Prevention:**
- Pre-allocate scratch vectors/quaternions/matrices OUTSIDE the frame loop using `useRef` or module-level constants
- Use mutating methods: `.set()`, `.copy()`, `.lerp()`, `.applyMatrix4()` — never `new` inside `useFrame`
- Pattern: `const _vec = new THREE.Vector3()` at module scope as a scratch variable
- Audit every `useFrame` callback before it ships — treat any `new THREE.*` as a red flag

**Warning signs:**
- Chrome DevTools Performance tab shows regular GC events in the frame timeline
- FPS is consistently 58-60 then drops to 45-50 in bursts
- The stutter pattern is rhythmic (every ~2-4 seconds)

**Phase to address:** Phase 1 (orbital animation setup) — write the frame loop correctly from day one.

---

### Pitfall 3: Not Using InstancedMesh for the Asteroid Belt

**What goes wrong:**
Rendering thousands of individual asteroid objects as separate `<mesh>` components (or `THREE.Mesh` instances) creates one draw call per asteroid. The GPU driver call overhead alone murders frame rate. 5,000 individual meshes = 5,000+ draw calls per frame = GPU driver bottleneck. Target: a single draw call for all asteroids.

**Why it happens:**
It's the obvious/intuitive approach — map over asteroid data, render a `<mesh>` per item. Works fine for 10 asteroids, fails at 1,000+.

**Consequences:**
- FPS drops from 60 to <10 with just 2,000 asteroids
- CPU-bound GPU submission overhead (not solvable with hardware upgrades)
- The asteroid belt becomes the single biggest performance killer in the scene

**Prevention:**
- Use `THREE.InstancedMesh` (or R3F's `<instancedMesh>`) — one draw call for ALL asteroids
- Set each instance's transform via `instancedMesh.setMatrixAt(i, matrix)` and call `instancedMesh.instanceMatrix.needsUpdate = true`
- For orbital animation: pre-compute asteroid positions in a `Float32Array`, update the matrix buffer in `useFrame`
- Keep asteroid geometry simple: low-poly sphere (6-8 segments) or `IcosahedronGeometry(radius, 0)` — asteroids are tiny, no one sees the detail
- drei's `<Instances>` component provides a cleaner R3F API for this pattern

**Warning signs:**
- Scene with 500+ asteroids drops below 30fps immediately
- Chrome DevTools `gpu` track shows hundreds of tiny draw calls per frame
- Adding more asteroids has linear FPS cost (not sublinear)

**Phase to address:** Phase 2 (asteroid belt) — use instanced mesh from first implementation, never refactor from individual meshes.

---

### Pitfall 4: GSAP Animating React State (Re-render on Every Frame)

**What goes wrong:**
Using GSAP to animate a React state value (e.g., `gsap.to(cameraState, { fov: 60 })` with `onUpdate: () => setCameraFov(cameraState.fov)`) causes a React re-render on every animation frame. The entire React tree reconciles at 60fps during camera fly-to. This defeats the purpose of having a frame loop outside React.

**Why it happens:**
GSAP's `onUpdate` callback runs every frame. Developers familiar with DOM animation naturally reach for state to make the camera "reactive." In Three.js, camera is a mutable ref object — it should never go through React state.

**Consequences:**
- React reconciliation overhead at 60fps for the entire duration of fly-to animations
- Janky camera movement despite smooth GSAP tweens
- Potential cascading re-renders if any context consumers observe camera state

**Prevention:**
- GSAP should animate the Three.js camera object DIRECTLY via ref: `gsap.to(cameraRef.current.position, { x, y, z })`
- Camera position/target are mutable Three.js properties — update them imperatively, never through React state
- Use R3F's `useThree()` to get the camera reference: `const { camera } = useThree()`
- For `OrbitControls` target animation, tween `controls.target` directly and call `controls.update()` in `onUpdate`
- Only put in React state what affects the 2D UI (e.g., which planet's info panel is shown, panel open/closed)

**Warning signs:**
- React DevTools Profiler shows component re-renders firing at 60fps during fly-to
- Camera movement appears smooth in isolation but UI panels stutter or flicker during animation
- `console.log` inside any context consumer fires rapidly during camera fly-to

**Phase to address:** Phase 2 (camera fly-to system) — establish the "GSAP animates refs, React state handles UI" boundary before any fly-to code.

---

### Pitfall 5: Bloom Post-Processing Causing Transparency/Layering Artifacts

**What goes wrong:**
`@react-three/postprocessing` (which wraps `postprocessing` library) uses an `EffectComposer` that renders into an intermediate buffer. When bloom is applied globally, semi-transparent objects (rings, atmosphere glows, orbit lines, labels) bloom unintentionally. Saturn's rings bloom as if radioactive. Planet name labels glow. The bloom threshold and luminance cutoff are wrong by default for a scene with emissive materials.

**Why it happens:**
Bloom in the `postprocessing` library uses luminance thresholds to determine what glows. The Sun's emissive material is intentionally bright. But rings use `MeshBasicMaterial` with some opacity, orbit lines use emissive colors, and atmospheric glow effects all accidentally exceed the luminance threshold.

**Consequences:**
- Artistically wrong output — everything glows, not just the Sun
- Rings/labels become unreadable halos
- Selective bloom (only Sun) requires architectural decisions that are painful to retrofit

**Prevention:**
- Use R3F's `<Bloom>` from `@react-three/postprocessing` with `mipmapBlur` and a HIGH `luminanceThreshold` (0.9+) so only truly emissive surfaces (the Sun mesh with `emissiveIntensity > 1`) bloom
- Assign the Sun a dedicated layer (`layers.set(1)`) and use selective bloom on that layer only — this is the most reliable approach
- Alternatively: use `THREE.Layers` to isolate which objects participate in bloom
- Keep all non-Sun emissive values below 1.0 (`emissiveIntensity: 0.3` for orbit line glow)
- Test bloom in production build — Vite dev server may show different results due to tone mapping

**Warning signs:**
- Saturn's rings appear to glow in early preview
- Planet name labels become blurry glowing text
- Orbit lines appear as bright glowing tubes instead of subtle guides
- Any object with `color: "white"` unexpectedly blooms

**Phase to address:** Phase 1 (scene foundation / post-processing setup) — set luminance threshold and layer strategy before adding any non-Sun emissive materials.

---

### Pitfall 6: OrbitControls Conflicting with GSAP Camera Fly-To

**What goes wrong:**
`OrbitControls` continuously reads and overwrites camera position and target every frame. When GSAP tries to animate the camera to a planet during fly-to, `OrbitControls` fights it: both systems update the camera simultaneously. The result is jittery, broken camera movement. After fly-to completes, `OrbitControls` also snaps the camera away from the intended position because its internal target hasn't been updated.

**Why it happens:**
Both systems are designed to "own" the camera. Developers add both without establishing clear ownership rules. `OrbitControls` runs in its own `useFrame` with its own priority.

**Consequences:**
- Camera fly-to animations look broken or jittery
- After fly-to, the camera immediately jerks back as OrbitControls applies its internal state
- Race condition between GSAP tween and OrbitControls update

**Prevention:**
- During fly-to: disable OrbitControls (`controls.enabled = false`), run GSAP tween, re-enable when complete
- GSAP must animate BOTH `camera.position` AND `controls.target` to the new orbital center
- Use `onComplete` callback of GSAP tween to re-enable controls and set new `controls.target`
- Use R3F's `<OrbitControls makeDefault />` from drei and access via `useThree(state => state.controls)`
- Assign `useFrame` priorities: `useFrame(callback, 1)` for controls, `useFrame(callback, 0)` for animation — lower number = earlier execution

**Warning signs:**
- Camera spasms during planet selection
- After fly-to completes, brief snap or jerk before settling
- OrbitControls stops responding after a fly-to (enabled flag stuck)

**Phase to address:** Phase 2 (camera system + fly-to) — establish the enabled/disabled handoff protocol as the core pattern.

---

### Pitfall 7: Texture Loading Without Suspense Causing Black Planets

**What goes wrong:**
`useTexture` (drei) and `useLoader` (R3F) are Suspense-based — they suspend the component while loading. If the component using the texture is not wrapped in `<Suspense>`, the texture promise is thrown but never caught, resulting in an unhandled promise or silent fallback to undefined textures. Planets render as black spheres (no texture applied) until re-render triggers.

**Why it happens:**
Developers test with fast local file serving (100ms loads) where the race condition doesn't manifest. On deployed sites with CDN latency, textures load slowly, and the Suspense gap is visible.

**Consequences:**
- Planets appear as solid black spheres on slow connections
- Race conditions on first load
- On mobile networks (3G/4G), users see a broken scene for several seconds

**Prevention:**
- Wrap the entire `<Canvas>` or at minimum `<SolarSystem>` in `<Suspense fallback={<LoadingScreen />}>`
- Use R3F's built-in `<Loader>` component from drei for progress tracking
- Preload all textures at startup using `useLoader.preload(TextureLoader, [...paths])` before the canvas mounts
- Define texture paths in a single `constants.js` so preloading covers every asset
- Use `@react-three/drei`'s `<Preload all />` component inside Canvas

**Warning signs:**
- Black planets on first page load before textures arrive
- Console shows "Cannot read property 'map' of undefined" on texture operations
- Planets flash black when component re-mounts

**Phase to address:** Phase 1 (asset loading system) — wrap Canvas in Suspense and set up preloading before any textures are added.

---

### Pitfall 8: Real Astronomical Scale Making Outer Planets Invisible

**What goes wrong:**
Neptune is 30 AU from the Sun. At any scale factor where the Sun is visible (even 1 pixel), Neptune is 4,500px away. In a 1080p window this is off-screen by a factor of 4. The `far` clipping plane of the camera must be enormous, causing Z-fighting on close objects. Developers who try real scale spend days fighting clipping, Z-fighting, and the fact that Jupiter is a pixel and Earth is sub-pixel.

**Why it happens:**
Real scale seems "scientifically correct." The scope of the problem only becomes clear after implementing it and realizing outer planets can never coexist in frame with inner planets at any useful zoom level.

**Consequences:**
- Outer planets are permanently invisible at any camera angle showing the full system
- Inner planets are lost in texture when viewing outer planets
- Z-fighting artifacts on planet surfaces from extreme depth range

**Prevention:**
- Use logarithmic distance compression: `displayDistance = k * Math.log(1 + realAU)` where k is a visual scale constant
- The design doc already specifies "compressed distances" — enforce this in `constants.js` as the only source of truth for orbital radii
- Keep the `far` clipping plane at ~10,000 units (not millions) to avoid Z-fighting
- Size planets with a separate scale factor: actual relative sizes but not real-AU distances
- Document the compression formula in `constants.js` with comments so future contributors don't "fix" it back to real values

**Warning signs:**
- Saturn is barely visible when zoomed out to show full system
- Neptune cannot be found without extreme zoom-out
- Camera `far` value is in the millions (indicates fighting real scale)
- Z-fighting flickering on planet surfaces

**Phase to address:** Phase 1 (scene foundation / constants.js) — define scale compression as an explicit documented decision before any orbital radius values are hardcoded.

---

### Pitfall 9: Mobile Touch Events Breaking OrbitControls

**What goes wrong:**
`OrbitControls` supports touch natively, but in a React app with HTML overlay elements (info panel, sidebar, navigation buttons), touch events hit the HTML layer first. Dragging over the info panel fires a touch event that the browser interprets as both a panel scroll AND an OrbitControls rotate simultaneously. On iOS, the default "rubber-band" scroll behavior also interferes. The result: 3D camera rotates when user tries to scroll the info panel, or info panel scrolls when user tries to rotate the scene.

**Why it happens:**
The Three.js canvas covers the full viewport but HTML overlays sit on top with their own event bubbling. Touch event propagation between canvas and HTML layers requires careful `event.stopPropagation()` and CSS `touch-action` management.

**Consequences:**
- Unusable on mobile — camera spins when touching UI panels
- Info panel cannot be scrolled on mobile without rotating the camera
- iOS "bounce" scroll conflicts with OrbitControls inertia

**Prevention:**
- All HTML overlay elements (sidebar, info panel, top bar) need `style={{ touchAction: 'auto' }}` and must call `event.stopPropagation()` on touch events
- The `<Canvas>` element needs `style={{ touchAction: 'none' }}` to hand touch events to Three.js
- Use `pointer-events: none` on purely decorative overlays
- Test on actual mobile hardware early — simulator behavior differs
- Consider a "mobile-simplified" layout where the info panel is a bottom sheet that doesn't overlap the canvas

**Warning signs:**
- Dragging on the info panel rotates the scene on mobile
- Console shows touch event errors on iOS Safari
- OrbitControls zoom doesn't work on Android (pinch conflicts with browser zoom)

**Phase to address:** Phase 3 (responsive design / mobile layout) — establish touch event architecture before building HTML overlays.

---

### Pitfall 10: Orbit Line Z-Fighting with Planet Orbits

**What goes wrong:**
Orbit lines (ellipses/circles showing each planet's orbital path) rendered at `y=0` in the orbital plane Z-fight with each other. `LineLoop` or `Line` geometry sitting exactly at the same Y plane as neighboring orbit lines produces flickering where lines intersect. Visible as a shimmering flickering pattern at the intersection of orbital paths, especially Mars/asteroid belt region.

**Why it happens:**
Multiple coplanar geometries at the same depth cause the GPU's depth buffer to alternate between them pixel-by-pixel based on floating point precision. Tiny floating point differences cause per-frame flickering.

**Consequences:**
- Persistent visible flickering along all orbit intersections
- Particularly bad for inner planets (Mercury/Venus/Earth/Mars) which are close together

**Prevention:**
- Give each orbit line a tiny Y offset proportional to its orbital index: `y = index * 0.001`
- Or use `polygonOffset` material property: `polygonOffsetFactor: -1, polygonOffset: true`
- Alternatively render orbit lines in a separate render pass
- Use `depthWrite: false` on orbit line materials — they're visual guides, not physical objects

**Warning signs:**
- Orbit line paths shimmer or flicker where they visually overlap
- Flickering increases with more orbit lines (linear scaling)
- Only visible in motion, looks fine in screenshots

**Phase to address:** Phase 1 (orbit line rendering) — add Y offset or polygon offset before multiple lines are in the scene.

---

## Moderate Pitfalls

---

### Pitfall 11: Planet Labels Billboarding Incorrectly (Disappearing Behind Planets)

**What goes wrong:**
HTML `<Html>` labels from drei always render on top of the Three.js canvas regardless of occlusion. A planet label appears when the planet is behind the Sun (or behind another planet) — floating label with no planet visible underneath it. This breaks the 3D illusion.

**Prevention:**
- Use drei's `<Html occlude>` prop — this uses raycasting to hide the label when it's occluded by scene geometry
- Specify `<Html occlude={[sunRef, ...planetRefs]}>` with refs to all occluding meshes
- Test label visibility from multiple camera angles before shipping

**Phase to address:** Phase 2 (hover labels / UI labels on 3D objects).

---

### Pitfall 12: Stale Refs in useFrame Closures

**What goes wrong:**
`useFrame` captures refs at subscription time. If a prop or state value read inside `useFrame` is captured via closure (not a ref), it becomes stale. Example: `useFrame(() => { if (selectedPlanet === 'mars') ... })` — `selectedPlanet` is the value from when `useFrame` was registered, not the current value.

**Prevention:**
- All values read inside `useFrame` that can change must be in a `useRef`, not a `useState`
- Pattern: `const selectedRef = useRef(selected); useEffect(() => { selectedRef.current = selected; }, [selected]);`
- R3F's `useFrame` docs explicitly warn about this — treat it as a golden rule

**Phase to address:** Phase 1 (orbital animation) and Phase 2 (interaction system).

---

### Pitfall 13: Shadow Maps on Mobile Killing Performance

**What goes wrong:**
Enabling `<Canvas shadows>` activates shadow maps. A PointLight (Sun) casting shadows for 9 planets + moons + asteroid belt requires 6 shadow map renders (one per face of the cube shadow map) per light per frame. On mobile GPUs, this is prohibitive — can halve frame rate. Sun shadows on a planetary scale are also scientifically unrealistic (orbital shadow is a cone, not an RSM).

**Prevention:**
- Do NOT use `<Canvas shadows>` — the Sun is a point of light, planetary shadows are orbital mechanics, not real-time shadow maps
- Simulate "shadow" by adjusting the dark side of each planet with a custom shader or a half-sphere dark overlay
- If any shadows are needed, use `receiveShadow`/`castShadow` selectively on ONLY the closest bodies (Earth/Moon only)

**Phase to address:** Phase 1 (lighting setup) — explicitly document "no shadow maps" as a design decision.

---

### Pitfall 14: Canvas Resize Not Handled (Blurry Rendering on HiDPI)

**What goes wrong:**
On Retina/HiDPI displays, the canvas renders at device pixel ratio 1 (CSS pixels) but displays at 2x. Everything looks blurry. R3F handles this automatically via `dpr` prop but only if it's set. Mobile browsers also fire resize events on scroll (dynamic toolbar hide/show) that can cause continuous resize handling.

**Prevention:**
- Use R3F's `<Canvas dpr={[1, 2]}>` — caps at 2x to avoid 4x on ultra-HiDPI screens
- Never hardcode `dpr={window.devicePixelRatio}` — can be 3-4 on some Android devices, crippling performance
- The `[1, 2]` range is the community-standard safe cap

**Phase to address:** Phase 1 (Canvas initialization).

---

### Pitfall 15: GSAP + React 19 Concurrent Mode — Animation Completion Callbacks Firing Twice

**What goes wrong:**
React 19 Strict Mode (enabled in development) double-invokes effects. If a GSAP fly-to is started in a `useEffect`, it fires twice in dev. The tween completes twice, which means the `onComplete` handler (re-enabling OrbitControls, showing info panel) fires twice. In production this is not an issue, but it creates confusing dev-only bugs.

**Prevention:**
- Use `@gsap/react` `useGSAP` hook — it's designed to work with React 19's Strict Mode lifecycle and handles cleanup correctly
- Never start GSAP tweens in raw `useEffect` without proper cleanup: always return `() => gsap.killTweensOf(target)` from the effect
- `useGSAP` handles this cleanup automatically

**Phase to address:** Phase 2 (camera fly-to system).

---

## Minor Pitfalls

---

### Pitfall 16: Orbital Period Animation Drift

**What goes wrong:**
Planet orbital positions are computed as `angle += speed * delta` in `useFrame`. Over time, floating point accumulation causes planets to drift from their relative positions. After hours of running at high speed, Mercury and Earth are no longer in their correct relative positions — this breaks any "where is Earth right now" accuracy.

**Prevention:**
- Compute orbital angle as `angle = (elapsedTime * speed) % (2 * Math.PI)` — modulo-based, no accumulation
- Use a single `clockRef` (R3F's `state.clock.elapsedTime`) as the source of truth for all orbital positions
- All planets derive position from elapsed time, not from accumulated delta increments

**Phase to address:** Phase 1 (orbital animation loop).

---

### Pitfall 17: Info Panel Re-Mount on Every Planet Selection

**What goes wrong:**
If the info panel is conditionally rendered with `{selectedPlanet && <InfoPanel planet={selectedPlanet} />}`, switching from Mars to Jupiter unmounts the Mars panel and mounts a fresh Jupiter panel. Any panel entry animations (GSAP stagger) restart from scratch. Any scroll position in the panel is lost.

**Prevention:**
- Render the panel persistently: `<InfoPanel planet={selectedPlanet} visible={!!selectedPlanet} />`
- Pass the planet as a prop that updates the content; let CSS/GSAP control open/close state
- GSAP animations on panel entry should trigger from a data change, not a mount event

**Phase to address:** Phase 2 (info panel + selection system).

---

### Pitfall 18: Saturn Rings Clipping at Low Camera Angles

**What goes wrong:**
Saturn's rings are rendered as a flat `RingGeometry` or torus. At low camera angles (near the ring plane), the rings clip against the planet sphere. The ring geometry intersects the sphere geometry because both are centered at the same point with overlapping extents.

**Prevention:**
- Use `RingGeometry` (not torus) for accurate flat rings
- Give rings a tiny Y offset or use `depthWrite: false` on the ring material
- Test camera at ring-plane angle explicitly during implementation

**Phase to address:** Phase 2 (planet detail — Saturn).

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding planet radii and distances in component files | Fast to write | Cannot change scale without hunting all component files | Never — always use `constants.js` |
| Using `useState` for camera position/target | Familiar React pattern | 60fps re-renders during animations, jank | Never — use refs |
| Individual `<mesh>` per asteroid | Simple JSX loop | Hundreds of draw calls, FPS collapse at 1k+ asteroids | Never past prototyping (50 asteroids max) |
| No Suspense boundary on Canvas | One less wrapper | Black planets on slow load, no loading screen integration | Never |
| `<Canvas shadows>` enabled by default | Realistic shading | 6x render passes for shadow cubemap, mobile killer | Never for this scene |
| Raw `useEffect` for GSAP tweens | Familiar pattern | Double-fire in Strict Mode, leak on unmount | Never — always use `useGSAP` |
| `depthTest: false` on all overlay materials | No Z-fighting | Wrong render order for all transparent objects | Only on orbit lines with `depthWrite: false` combo |
| Importing all planet textures at module level | Simple imports | All textures load before any render, FOBT on slow connections | Never — use `useTexture` with Suspense |

---

## Integration Gotchas

Common mistakes when combining the specific libraries in this stack.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| R3F + GSAP | Animating React state via GSAP `onUpdate` | Animate Three.js object refs directly; state only for UI toggle |
| R3F + drei OrbitControls | Both GSAP and OrbitControls update camera simultaneously | `controls.enabled = false` before tween, `true` on `onComplete` |
| R3F + @react-three/postprocessing | Bloom affects all emissive objects including orbit lines | Use luminance threshold >0.9 or layer-based selective bloom |
| drei Html labels + Three.js | Labels render on top regardless of occlusion | Use `<Html occlude={[...refs]}>` |
| Tailwind CSS v4 + R3F Canvas | Tailwind resets break canvas sizing | Canvas needs explicit `width: 100%; height: 100%` or `w-full h-full` |
| GSAP + React 19 Strict Mode | Double-invoked effects fire GSAP twice | Always use `@gsap/react useGSAP` hook |
| `useLoader`/`useTexture` + Vite | Texture paths work in dev, fail in prod | Use Vite's `import.meta.url` for asset paths or `public/` directory |

---

## Performance Traps

Patterns that work fine in dev but fail at full scene complexity.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Individual meshes for asteroid belt | FPS collapses as asteroid count increases | `InstancedMesh` from day one | >200 individual asteroids |
| `new THREE.Vector3()` inside useFrame | Rhythmic GC hiccup stutters every 2-4 seconds | Pre-allocate scratch vectors at module scope | Always — even with 1 planet |
| Full scene shadow maps | Mobile devices drop to <30fps | Disable `<Canvas shadows>` | Any mobile device, immediately |
| `dpr={window.devicePixelRatio}` without cap | 4x pixel ratio on high-end Android = 4x fill rate cost | `dpr={[1, 2]}` cap | Immediately on 3x/4x DPR devices |
| Bloom on full scene (no threshold) | Everything glows, including labels and lines | Luminance threshold 0.9+, or Sun layer isolation | Immediately on first scene with multiple emissive materials |
| Uncompressed texture files | 15+ second load times, GPU texture decompression cost | Use WebP or KTX2/basis compressed textures, max 2K resolution | On mobile or slow connections |
| Geometry recreation per orbital period | Spike every orbital period if geometry is destroyed/recreated | All geometries created once and mutated | Any time an orbit completes |

---

## UX Pitfalls

Common UX mistakes in 3D interactive visualization.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual indication that planets are clickable | Users never discover click interaction | Hover cursor change + name label on hover + subtle scale pulse |
| Info panel opens instantly (no transition) | Jarring layout shift while camera is flying in | GSAP stagger the panel entry — delay panel open until camera fly-to is 70% complete |
| Back button only in info panel | Users trapped in planet view on mobile | Escape key + back button in top bar + tap empty space to dismiss |
| Orbital speed at 1x by default | Nothing visually moves; users think scene is broken | Default to 30x or 50x so orbital motion is immediately visible |
| No loading progress indicator | Users see black screen for 5-10 seconds on slow connections | Loading screen with texture progress using R3F's `<Loader>` |
| Camera controls disabled entirely on mobile | Site is unusable on mobile | Touch pan/rotate on canvas, touch-action:none on canvas, touch events stopped on HTML overlays |
| Asteroid belt so dense it obscures inner planets | Visual clutter makes navigation confusing | Keep asteroid belt thin (1-2 AU band) with low opacity and small instance size |

---

## "Looks Done But Isn't" Checklist

Things that appear complete in dev but break in production or on specific devices.

- [ ] **Asteroid belt:** Verify with InstancedMesh (not individual meshes) — check draw call count in Spector.js or browser GPU tools
- [ ] **Texture loading:** Verify planets don't flash black on first load on a throttled (slow 3G) connection — test in DevTools Network throttle
- [ ] **Bloom:** Verify Saturn rings, orbit lines, and labels do NOT glow — test bloom threshold with all scene elements visible
- [ ] **Camera fly-to:** Verify OrbitControls doesn't jerk after fly-to completes — test by rapidly switching between multiple planets
- [ ] **Mobile touch:** Verify info panel can be scrolled on iOS without rotating the camera — test on real iPhone
- [ ] **HiDPI:** Verify canvas is crisp on Retina display with `dpr={[1, 2]}` set — compare vs `dpr={1}`
- [ ] **Memory:** Verify no geometry/material leak — open Chrome Task Manager, navigate all planets for 5 minutes, GPU process memory should be stable
- [ ] **GC hiccup:** Verify no stutter in useFrame — run Chrome Performance timeline for 10 seconds, look for GC events
- [ ] **Z-fighting:** Verify orbit lines don't flicker where they visually overlap — view from top-down orbital plane angle
- [ ] **Stale closures:** Verify selectedPlanet inside useFrame reflects the current value — switch planets rapidly

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Memory leak discovered late | MEDIUM | Audit all component unmount paths; add disposal useEffect; R3F JSX materials are safest to switch to |
| GC hiccup stutters | LOW | Grep all useFrame callbacks for `new THREE.*`; move to module-scope scratch vars |
| Asteroid belt FPS collapse | MEDIUM | Refactor from individual meshes to InstancedMesh — API is different enough to require rewrite of asteroid component |
| Bloom artifacts on orbit lines | LOW | Adjust `luminanceThreshold` prop on Bloom effect; add per-material `emissiveIntensity` clamp |
| OrbitControls/GSAP fight | LOW | Add `controls.enabled = false` before tween and `true` in `onComplete`; single-file fix |
| Mobile touch conflicts | MEDIUM | Add `touch-action: none` on Canvas, `stopPropagation` on all HTML overlays; requires testing on device |
| Texture loading race / black planets | LOW | Add `<Suspense>` boundary above Canvas; add `<Preload all />` inside Canvas |

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Scene foundation / Canvas setup | Missing Suspense boundary, wrong dpr, no scale compression in constants | Define scale constants, add Suspense, set `dpr={[1,2]}` before any planets are added |
| Orbital animation loop | Per-frame allocation (`new THREE.*` in useFrame), drift accumulation | Scratch vars at module scope; modulo-based angle from elapsedTime |
| Lighting / post-processing | Bloom on all objects, shadow map performance cost | Set luminanceThreshold 0.9+, disable shadows entirely |
| Asteroid belt | Individual meshes, geometry re-creation | InstancedMesh with pre-allocated Float32Array for positions |
| Camera fly-to system | OrbitControls/GSAP fight, React state animation, stale closures | GSAP animates camera ref directly; disable/enable controls; `useGSAP` hook |
| Planet hover labels | Html labels rendering through geometry (no occlusion) | `<Html occlude>` with explicit mesh refs |
| Info panel | Re-mount on selection change losing animation state | Persistent render with prop-driven content |
| Saturn rings | Ring geometry Z-fighting with sphere, unexpected bloom | `depthWrite: false` on ring material; bloom threshold check |
| Responsive / mobile | Touch events fighting between Canvas and HTML overlays | `touch-action: none` on canvas, `stopPropagation` on overlays |
| Texture loading | Black planets on slow connections, path resolution in prod | `public/` directory for textures, `<Preload all />`, Suspense wrapping |

---

## Sources

- React Three Fiber official pitfalls documentation (pmnd.rs/react-three-fiber/advanced/pitfalls) — HIGH confidence
- Three.js manual: "How to dispose of objects" (threejs.org/docs) — HIGH confidence
- @gsap/react documentation and React 19 Strict Mode compatibility notes — HIGH confidence
- drei documentation: Html, OrbitControls, Instances, Preload, Loader (pmnd.rs) — HIGH confidence
- @react-three/postprocessing bloom layer strategy — MEDIUM confidence (community-validated pattern)
- R3F ecosystem performance guides: `useFrame` scratch variable pattern — HIGH confidence (widely documented)
- Three.js InstancedMesh documentation — HIGH confidence

---

*Pitfalls research for: Interactive 3D Solar System — React Three Fiber / GSAP / Three.js*
*Researched: 2026-02-24*
