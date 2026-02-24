# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** A visually stunning, interactive 3D solar system that showcases AU Brussel's creative and technical capabilities — the experience must feel alive, responsive, and cinematic.
**Current focus:** Phase 2 — Scene Bodies (02-02 awaiting visual checkpoint)

## Current Position

Phase: 2 of 4 (Scene Bodies)
Plan: 2 of 2 in current phase
Status: Plan 02-02 execution complete — awaiting visual checkpoint (Task 3)
Last activity: 2026-02-24 — Completed 02-02 Tasks 1+2 — extended body features built

Progress: [█████░░░░░] 50% (4 of 8 plans complete pending checkpoint)

## Performance Metrics

**Velocity:**
- Total plans completed: 3 + (02-02 pending checkpoint)
- Average duration: ~7 min
- Total execution time: ~27 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 2/2 COMPLETE | ~10 min | ~5 min |
| 2. Scene Bodies | 1.5/2 (02-02 awaiting verify) | ~17 min | ~8.5 min |

**Recent Trend:**
- Last 5 plans: ~5-10 min
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
- [02-02]: saturn-ring.png is 2048×125 RGBA PNG strip (12KB) — legitimate ring alpha texture from Solar System Scope
- [02-02]: earth-clouds.png delivered as JPEG with .png extension by Solar System Scope — Three.js reads by content-type, transparent rendering via alphaMap works correctly
- [02-02]: Extended features (rings/moons/clouds) mount inside Planet's orbital group (groupRef), outside the tilt mesh — SaturnRings stays horizontal, moons orbit correctly
- [02-02]: Moon component is reusable for Earth Moon and all 4 Galilean moons (same accumulated angleRef orbital pattern)
- [02-02]: AsteroidBelt scratch Object3D is module-level (not component-level) — zero GC pressure from 2000 setMatrixAt per frame

### Pending Todos

None.

### Blockers/Concerns

- [RESOLVED - Pre-Phase 2]: Texture asset pipeline — RESOLVED: Solar System Scope 2K JPGs, CC-BY 4.0, no KTX2 needed
- [RESOLVED - 02-02]: saturn-ring.png and earth-clouds.png placeholder textures — RESOLVED: both downloaded from Solar System Scope
- [Pre-Phase 4]: iOS Safari touch-action behavior with OrbitControls may need manual device verification during Phase 4 planning.

## Session Continuity

Last session: 2026-02-24
Stopped at: Plan 02-02 Tasks 1+2 complete — awaiting Task 3 visual checkpoint at http://localhost:5180/
Resume file: .planning/phases/02-scene-bodies/02-02-PLAN.md (Task 3 checkpoint)
