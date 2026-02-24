# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** A visually stunning, interactive 3D solar system that showcases AU Brussel's creative and technical capabilities — the experience must feel alive, responsive, and cinematic.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 2 of 2 in current phase
Status: Awaiting human checkpoint (Task 2 visual verification)
Last activity: 2026-02-24 — Task 1 of 01-02 committed (LoadingScreen, Starfield, PostProcessing)

Progress: [██░░░░░░░░] 20%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 5 min
- Total execution time: 5 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 1/2 (01-02 pending checkpoint) | 5 min | 5 min |

**Recent Trend:**
- Last 5 plans: 5 min
- Trend: Baseline established

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

### Pending Todos

None.

### Blockers/Concerns

- [Pre-Phase 2]: Texture asset pipeline not resolved — NASA free textures vs Solar System Scope textures, affects file sizes and whether KTX2 compression is needed. Resolve before Phase 2 planning.
- [Pre-Phase 4]: iOS Safari touch-action behavior with OrbitControls may need manual device verification during Phase 4 planning.

## Session Continuity

Last session: 2026-02-24
Stopped at: Task 1 of 01-02 complete — awaiting human verification checkpoint (Task 2)
Resume file: .planning/phases/01-foundation/01-02-PLAN.md
