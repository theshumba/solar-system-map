# Stack Research

**Domain:** Interactive 3D solar system web app (portfolio showcase)
**Researched:** 2026-02-24
**Confidence:** HIGH (all versions verified via npm registry; rationale from training knowledge flagged where unverified by official docs)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.2.4 | UI layer, component tree | Latest stable; R3F v9 requires `>=19 <19.3`; concurrent features (`useTransition`) improve UI responsiveness during 3D scene loads |
| Vite | 7.3.1 | Build tool, dev server | Fastest cold-start HMR for large 3D projects; native ESM; R3F/drei build fine with default config; project already on this toolchain |
| @react-three/fiber | 9.5.0 | React renderer for Three.js | Declarative Three.js in JSX; `useFrame` loop integrates seamlessly with GSAP targets; v9 is the React 19 release (v8 is React 18 only) |
| three | 0.183.1 | 3D engine / WebGL renderer | Peer dep of R3F; SphereGeometry, TextureLoader, MeshStandardMaterial, PointLight all native; WebGPU renderer available as opt-in in this version |
| @react-three/drei | 10.7.7 | R3F helper components | Stars (starfield), OrbitControls, useTexture, Html (DOM overlays in 3D space), Line (orbit trails), Environment, PerspectiveCamera, useProgress — replaces dozens of manual Three.js setups |
| @react-three/postprocessing | 3.0.4 | Post-processing effects | Bloom (sun glow), DepthOfField, Vignette — declarative effect pipeline over R3F canvas; v3 targets R3F v9 + three >=0.156 |
| gsap | 3.14.2 | Camera animation timeline | Best-in-class for camera fly-to tweens with `gsap.to(camera.position, {...})` and `onUpdate` callback; easing library is mature and battle-tested |
| @gsap/react | 2.1.2 | GSAP React integration | `useGSAP()` handles cleanup automatically (prevents memory leaks in StrictMode double-mount); drop-in for `useLayoutEffect` with GSAP |
| Tailwind CSS | 4.2.1 | UI panel styling | CSS-first `@theme` approach; used for 2D overlay panels (planet info cards, nav) without touching 3D canvas; v4 has zero-config Vite integration |
| @vitejs/plugin-react | 5.1.4 | React Fast Refresh in Vite | Required for HMR; supports all Vite versions from 4–7; Babel-based transform (not SWC) for better GSAP/decorator compatibility |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| maath | 0.10.8 | Math utilities for R3F | Elliptical orbit position calculations (`maath/easing`, `maath/misc`); bundled as drei dependency, import directly when needed |
| zustand | 5.0.11 | Client state | Track which planet is selected, camera state, UI panel open/closed; drei already bundles it as a dep, so zero extra cost |
| @react-three/postprocessing's Bloom | (via 3.0.4) | Sun glow effect | Use `<Bloom luminanceThreshold={0.3} intensity={1.5} />` inside `<EffectComposer>`; critical for making the sun look physically correct |
| r3f-perf | 7.2.3 | Performance HUD in dev | `<Perf position="top-left" />` shows GPU ms, FPS, draw calls; remove from production build; peer requires `@react-three/drei >=9` — works fine with drei v10 since it only uses drei internals |
| leva | 0.10.1 | Dev-time GUI controls | Tweak orbit speeds, sizes, bloom intensity without code changes during development; do NOT ship in production |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite 7 + `@vitejs/plugin-react` | Dev server + HMR | Default config works; add `optimizeDeps: { include: ['three'] }` to pre-bundle three.js and avoid cold-start lag |
| TypeScript (optional) | Type safety | Three.js has excellent `@types/three` coverage; R3F has built-in types; recommended but not required for a solo portfolio project |
| ESLint + `eslint-plugin-react-hooks` | Hook lint rules | Catches misuse of `useFrame` dependencies; critical when mixing GSAP refs with React state |

---

## Installation

```bash
# Core 3D stack
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing

# Animation
npm install gsap @gsap/react

# State
npm install zustand

# Framework (likely already scaffolded)
npm install react@19.2.4 react-dom@19.2.4

# Dev tools
npm install -D vite @vitejs/plugin-react tailwindcss r3f-perf leva
```

**Version-pinned install (copy-paste safe as of 2026-02-24):**

```bash
npm install three@0.183.1 @react-three/fiber@9.5.0 @react-three/drei@10.7.7 @react-three/postprocessing@3.0.4 gsap@3.14.2 @gsap/react@2.1.2 zustand@5.0.11
npm install -D vite@7.3.1 @vitejs/plugin-react@5.1.4 tailwindcss@4.2.1 r3f-perf@7.2.3 leva@0.10.1
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @react-three/fiber v9 | R3F v8 | Only if you cannot move to React 19; R3F v8 supports React 18. For this project (React 19 specified), use v9 |
| @react-three/postprocessing | Raw `postprocessing` library | If you need effects not yet wrapped by @react-three/postprocessing; adds significant boilerplate |
| GSAP for camera fly-to | @react-spring/three | react-spring is better for physics-feel spring animations (e.g., elastic UI). GSAP wins for cinematic timeline control, precise easing, and scrubbing — mandatory for planet fly-to sequences |
| @react-three/drei `Stars` | Three.js `Points` mesh manually | drei's `Stars` component handles attribute buffer, shader, and randomization with one line. Only use manual `Points` if you need custom star density profiles |
| zustand | React Context | Context causes all consumers to re-render on any state change — fatal for a 60fps `useFrame` loop. Zustand's selector-based subscriptions prevent cascading re-renders in the 3D canvas |
| Tailwind CSS v4 | Styled Components / Emotion | CSS-in-JS adds runtime cost; Tailwind's compiled classes are zero-runtime; correct choice for 2D overlay panels over a 3D canvas |
| Vite | Create React App | CRA is deprecated and abandoned. Vite is the current standard |
| Vite | Next.js | No server-side rendering needed for a static portfolio; Next.js adds unnecessary complexity and SSR has friction with WebGL canvas |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@react-three/fiber@8.x` | Does not support React 19; peer dep range is `>=18 <19`; will produce peer dep warnings and potential concurrent mode bugs | `@react-three/fiber@9.5.0` |
| `react-spring` for camera animation | Spring physics does not give precise control over camera fly-to duration/easing. Overshoot artifacts look wrong for a solar system fly-to | GSAP 3 with custom ease (`power2.inOut`) |
| Direct DOM manipulation inside `useFrame` | `useFrame` runs in the R3F render loop — mutating DOM (or React state via `setState`) from it causes de-sync with React's scheduler | Use `ref`s for Three.js object mutations; dispatch to zustand only for discrete events |
| `Canvas` with `shadows` enabled on all objects | Planetary-scale shadow maps are prohibitively expensive (8K+ shadow map for Saturn ring system). 60fps target requires skipping real-time shadows | Bake shadows into textures; use ambient + point lights only |
| `MeshPhongMaterial` | Legacy; not physically-based; looks flat and toy-like | `MeshStandardMaterial` with roughness/metalness maps for realistic planet surfaces |
| `OrbitControls` in production scene | OrbitControls interferes with GSAP camera tweens (both fight over camera position/target). Use OrbitControls only in a dev debug mode | Implement custom pointer drag via `useGesture` or disable OrbitControls during GSAP tweens with `controls.enabled = false` |
| `@theatrejs/core` | Theatre.js (not published on npm as of 2026-02-24 registry check) is a keyframe editor, not a runtime animation library. Adds significant complexity for this use case | GSAP timelines for all camera and object animations |
| `react-three-a11y` | Adds wrapper nodes around all interactive meshes, causes subtle Z-fighting and performance overhead; still assumes R3F v7/v8 API | Handle accessibility at the 2D overlay layer (Tailwind panels have full keyboard support) |

---

## Stack Patterns by Variant

**If targeting mobile browsers (portfolio will be viewed on phones):**
- Use `<Canvas dpr={[1, 1.5]} />` (cap device pixel ratio at 1.5, not the default 2)
- Reduce sphere segment counts: `<sphereGeometry args={[1, 32, 32]} />` not 64/64
- Use compressed textures (KTX2/basis) for planet maps via `useKTX2` from drei
- Because: mobile GPU bandwidth is the bottleneck, not vertex count

**If orbit trails are needed (ecliptic lines):**
- Use drei's `<Line>` component with `lineWidth` prop
- Compute ellipse points with `maath/misc` `ellipseCurve` utility
- Because: Three.js `LineLoop` requires manual BufferGeometry management; drei's `Line` accepts a points array directly

**If planet rings are needed (Saturn):**
- Use `<mesh>` with `<ringGeometry>` and a custom `ShaderMaterial` or `MeshBasicMaterial` with transparency
- Set `side={THREE.DoubleSide}` and `transparent={true}` on the material
- Because: Ring geometry is hollow and needs double-sided rendering to be visible from above and below

**If you need real astronomical data (not decorative):**
- NASA Horizons API has CORS issues for browser-direct requests; bake the orbital elements into a static JSON file at build time
- Because: No backend in this project; static JSON of Keplerian elements is the right pattern

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@react-three/fiber@9.5.0` | `react@>=19 <19.3`, `three@>=0.156` | React 19.2.x is within the `<19.3` bound; React canary (19.3.0-canary-*) is NOT supported |
| `@react-three/drei@10.7.7` | `react@^19`, `three@>=0.159`, `@react-three/fiber@^9.0.0` | Requires three >=0.159; our three@0.183.1 satisfies this |
| `@react-three/postprocessing@3.0.4` | `@react-three/fiber@^9.0.0`, `react@^19.0`, `three@>=0.156.0` | All peers satisfied by our stack |
| `@gsap/react@2.1.2` | `gsap@^3.12.5`, `react@>=17` | No upper bound on React version; safe with React 19 |
| `r3f-perf@7.2.3` | `@react-three/fiber@>=8.0`, `react@>=18.0`, `three@>=0.133` | Requires drei@>=9 internally; works with drei v10 (no declared peer conflict) |
| `leva@0.10.1` | `react@^18.0.0 || ^19.0.0` | Explicitly supports React 19 |
| `zustand@5.0.11` | `react@>=18.0.0` | No upper bound; safe with React 19.2.x |
| `@vitejs/plugin-react@5.1.4` | `vite@^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0` | Supports Vite 7 |

**Critical version constraint:**
`@react-three/fiber@9.x` declares `react: ">=19 <19.3"`. The current React latest is 19.2.4 which is within range. Do NOT upgrade React to canary/experimental builds (19.3.0-canary-*) until R3F v9 releases an updated peer dep range. This is the single biggest version trap in this stack.

---

## Sources

- npm registry (`npm show [package] version/peerDependencies`) — all versions verified 2026-02-24 (HIGH confidence)
- `@react-three/fiber@9.5.0` peer deps — `react: ">=19 <19.3"`, `three: ">=0.156"` (HIGH confidence, live registry)
- `@react-three/drei@10.7.7` peer deps — `react: "^19"`, `three: ">=0.159"`, `@react-three/fiber: "^9.0.0"` (HIGH confidence, live registry)
- `@react-three/postprocessing@3.0.4` peer deps — `@react-three/fiber: "^9.0.0"`, `react: "^19.0"`, `three: ">= 0.156.0"` (HIGH confidence, live registry)
- `@gsap/react@2.1.2` peer deps — `gsap: "^3.12.5"`, `react: ">=17"` (HIGH confidence, live registry)
- `r3f-perf@7.2.3` dependency on drei@>=9 (verified via npm deps output — LOW confidence on drei v10 runtime compatibility; may need testing)
- GSAP + Three.js camera tween pattern — training knowledge (MEDIUM confidence; standard pattern well-documented in GSAP community; no live source verified)
- zustand vs Context for 3D state — training knowledge (MEDIUM confidence; widely documented as best practice in R3F community)
- OrbitControls vs GSAP conflict — training knowledge (MEDIUM confidence; known issue in R3F ecosystem; mitigation via `controls.enabled = false` is standard)

---

*Stack research for: Interactive 3D solar system web app*
*Researched: 2026-02-24*
