# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** A visually stunning, interactive 3D solar system that showcases AU Brussel's creative and technical capabilities — the experience must feel alive, responsive, and cinematic.
**Current focus:** Phase 4 — UI and Responsive — In progress

## Current Position

Phase: 4 of 4 (UI and Responsive) — In progress
Plan: 1 of 2 in current phase — COMPLETE
Status: In progress — 04-01 complete, 04-02 ready to start
Last activity: 2026-02-25 — Completed 04-01-PLAN.md — NavSidebar, TimelineControl, Footer, CompositionChart

Progress: [████████░░] 88% (7 of 8 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 7 (01-01, 01-02, 02-01, 02-02, 03-01, 03-02, 04-01)
- Average duration: ~5 min
- Total execution time: ~38 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 2/2 COMPLETE | ~10 min | ~5 min |
| 2. Scene Bodies | 2/2 COMPLETE | ~12 min | ~6 min |
| 3. Camera and Interaction | 2/2 COMPLETE | ~7.5 min | ~3.75 min |
| 4. UI and Responsive | 1/2 | ~8 min | ~8 min |

**Recent Trend:**
- Last 5 plans: ~5-8 min
- Trend: Consistent quick execution

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Setup]: Camera position lives in a ref mutated by GSAP — never React state (prevents 60fps reconciliation)
- [Setup]: Zustand required for state read inside useFrame; SceneContext (React Context) only for infrequent UI state
- [Setup]: InstancedMesh is mandatory for asteroid belt — never individual meshes
- [Setup]: R3F v9 requires react >=19 <19.3 — do not upgrade React beyond 19.2.x
- [01-01]: Two-context pattern for SceneContext (state + dispatch separate) prevents dispatch-only components from re-rendering at 60fps
- [01-01]: No shadows on Canvas — PointLight shadow maps cost-prohibitive at solar system scale; ambient + emissive Sun sufficient
- [01-01]: constants.js has zero imports — pure data module, zero circular dep risk across the project
- [01-01]: r3f-perf@7.2.3 has peer dep conflict with drei v10 (uses bundled drei v9 internally) — benign, dev tool only
- [01-02]: Bloom luminanceThreshold={0.9} is a Phase 1 lock — DO NOT lower; only emissive Sun exceeds this threshold
- [01-02]: Starfield must stay outside Suspense — procedural geometry, no assets, prevents void flash during loading
- [01-02]: LoadingScreen transition: fading state triggers CSS opacity transition, then SET_LOADED fires after 800ms delay
- [02-01]: Zustand store coexists with SceneContext — SceneContext retains speed/isPaused for UI reactivity; Zustand is animation-loop read source only
- [02-01]: Solar System Scope CC-BY 4.0 texture source — 2K JPGs, no KTX2 compression needed; resolves texture pipeline blocker
- [02-01]: Pluto texture uses 2k_eris_fictional.jpg (similar icy dwarf — Solar System Scope has no dedicated Pluto 2K)
- [02-01]: Planet orbital animation uses accumulated angleRef (not clock.elapsedTime) — correctly handles pause/resume without position jump
- [02-01]: PointLight decay=0 ensures distance-independent illumination at compressed scene scale
- [02-02]: saturn-ring.png is 2048x125 RGBA PNG strip (12KB) — legitimate ring alpha texture from Solar System Scope, not a placeholder
- [02-02]: earth-clouds.png delivered as JPEG with .png extension by Solar System Scope — Three.js reads by content-type, transparent rendering via alphaMap works correctly
- [02-02]: Extended features (rings/moons/clouds) mount inside Planet's orbital group (groupRef), outside the tilt mesh — SaturnRings stays horizontal, moons orbit correctly
- [02-02]: Moon component is reusable for Earth Moon and all 4 Galilean moons (same accumulated angleRef orbital pattern)
- [02-02]: AsteroidBelt scratch Object3D is module-level (not component-level) — zero GC pressure from 2000 setMatrixAt per frame
- [03-01]: GSAP fires two simultaneous tweens (camera.position + controls.target) — keeps OrbitControls target in sync during flight, not one tween
- [03-01]: controls.enabled = false BEFORE tween start — prevents OrbitControls fighting GSAP mid-flight, re-enabled in onComplete
- [03-01]: Module-level _scratchVec in useCamera — allocated once, never GC'd during 60fps loop
- [03-01]: Zustand planetRef registry (registerPlanetRef/unregisterPlanetRef) — CameraController reads live refs without prop chain
- [03-01]: Drag suppression via e.delta > 2 guard on onClick — R3F tracks pointer movement, delta > 2 means drag not click
- [03-01]: useKeyboardShortcuts dispatches TOGGLE_PAUSE to both SceneContext (UI reactivity) and Zustand (animation loop)
- [03-02]: notableMoons stored as plain string arrays (not objects) — InfoPanel renders strings directly as badge text, simpler and sufficient for display-only
- [03-02]: InfoPanel uses persistent mount pattern (never unmount) — preserves scroll position across planet switches, no carousel restart artifacts
- [03-02]: HoverLabel skips occlude — only one label visible at a time, occlude complexity not justified
- [03-02]: Scene.jsx reads hoveredPlanet and passes conditional props to OrbitLine — no changes needed inside OrbitLine itself
- [04-01]: usePlanetSelect thin hook (not inline dispatch) — single SELECT_PLANET dispatch point across all UI click handlers
- [04-01]: CompositionChart lives inside InfoPanel.jsx (not separate file) — only used by InfoPanel, no standalone use case
- [04-01]: transition-[width] required for CSS width animations — Tailwind default transition excludes width property
- [04-01]: rAF animation pattern for CompositionChart — reset animated=false then rAF setAnimated(true) guarantees paint at 0% before transition
- [04-01]: isNavOpen state lifted to App.jsx (not deferred to 04-02) — NavSidebar already accepts props, 04-02 only needs hamburger button UI

### Pending Todos

None.

### Blockers/Concerns

- [RESOLVED - Pre-Phase 2]: Texture asset pipeline — RESOLVED: Solar System Scope 2K JPGs, CC-BY 4.0, no KTX2 needed
- [RESOLVED - 02-02]: saturn-ring.png and earth-clouds.png placeholder textures — RESOLVED: both downloaded from Solar System Scope
- [Pre-Phase 4]: iOS Safari touch-action behavior with OrbitControls may need manual device verification during Phase 4 planning.

## Session Continuity

Last session: 2026-02-25
Stopped at: Phase 4, Plan 1 complete — 04-01 NavSidebar/TimelineControl/Footer/CompositionChart
Resume file: .planning/phases/04-ui-and-responsive/04-02-PLAN.md (if it exists) or run /gsd:plan-phase 4 for plan 2
Dev server: http://localhost:5174
