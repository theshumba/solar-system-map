---
phase: 02-scene-bodies
plan: 01
subsystem: ui
tags: [react-three-fiber, drei, zustand, three, textures, orbital-animation]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: App.jsx Canvas shell, Suspense boundary, PostProcessing Bloom, SceneContext, planets.js/constants.js data
provides:
  - Zustand sceneStore with speed/isPaused for frame-safe animation reads
  - Sun component: emissive sphere + PointLight(decay=0) at scene origin
  - Planet component: accumulated-angle orbital animation, axial tilt, self-rotation, useFrame+Zustand getState pattern
  - OrbitLine component: faint circle using drei Line, z-fighting prevention
  - Scene root: assembles all 9 bodies (Mercury-Pluto) + orbit lines
  - 10 real 2K planet textures (Solar System Scope CC-BY 4.0), replacing 1x1 placeholders
affects: [02-02-scene-bodies, 03-camera-interaction, 04-ui-responsive]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Accumulated angle ref (angleRef) for pauseable orbital animation — NOT elapsedTime"
    - "Zustand getState() inside useFrame for frame-safe speed/pause reads (no React re-render)"
    - "Two-level group+mesh scene graph: group handles orbital position, mesh handles axial tilt"
    - "PointLight decay=0 for distance-independent solar illumination at compressed scene scale"

key-files:
  created:
    - src/store/sceneStore.js
    - src/components/scene/Sun.jsx
    - src/components/scene/Planet.jsx
    - src/components/scene/OrbitLine.jsx
    - src/components/scene/Scene.jsx
  modified:
    - src/App.jsx
    - public/textures/sun.jpg
    - public/textures/mercury.jpg
    - public/textures/venus.jpg
    - public/textures/earth.jpg
    - public/textures/mars.jpg
    - public/textures/jupiter.jpg
    - public/textures/saturn.jpg
    - public/textures/uranus.jpg
    - public/textures/neptune.jpg
    - public/textures/pluto.jpg

key-decisions:
  - "Zustand store owns animation state (speed/isPaused); SceneContext retains same fields for UI reactivity — no migration"
  - "Solar System Scope CC-BY 4.0 as texture source — 2K JPGs, no KTX2 compression needed"
  - "Pluto texture sourced from 2k_eris_fictional.jpg (similar icy dwarf planet appearance)"

patterns-established:
  - "Planet orbital animation: accumulated angleRef, not clock.elapsedTime (handles pause correctly)"
  - "Animation state reads: useSceneStore.getState() in useFrame, useSceneStore() hook in UI"
  - "Scene graph: orbital group + tilted mesh + future children (rings/moons) as pattern for all bodies"

# Metrics
duration: 7min
completed: 2026-02-24
---

# Phase 2 Plan 01: Scene Bodies — Core Scene Summary

**Zustand store + 10 real 2K textures + Sun/Planet/OrbitLine/Scene components producing a living solar system with all 9 bodies orbiting and rotating in R3F**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-02-24T23:39:09Z
- **Completed:** 2026-02-24T23:46:00Z (checkpoint — awaiting visual verify)
- **Tasks:** 2/2 executed (Task 3 is human-verify checkpoint)
- **Files modified:** 15

## Accomplishments
- All 10 planet textures (sun through pluto) replaced from 335-byte placeholders to real 2K JPGs from Solar System Scope (77KB–1.07MB each), CC-BY 4.0 licensed
- Zustand sceneStore with speed/isPaused/setSpeed/togglePause — read inside useFrame via getState() for zero-overhead animation control
- Planet component with accumulated-angle orbital animation (handles pause correctly), axial tilt on mesh Z, self-rotation with retrograde sign detection (Venus, Pluto, Uranus)
- Scene assembles Sun + all 9 PLANETS mapped to Planet+OrbitLine pairs — living orrery rendered inside App.jsx Canvas Suspense boundary
- Build verified clean: 618 modules, 0 errors, 1.81s build time

## Task Commits

Each task was committed atomically:

1. **Task 1: Zustand store, textures, Sun, Planet, OrbitLine** - `ba27afd` (feat)
2. **Task 2: Scene root + App.jsx wiring** - `a2aab0e` (feat)

## Files Created/Modified
- `src/store/sceneStore.js` — Zustand v5 store: speed=1, isPaused=false, setSpeed, togglePause
- `src/components/scene/Sun.jsx` — Emissive sphere (emissiveIntensity=2.0) + PointLight(decay=0) at origin
- `src/components/scene/Planet.jsx` — Reusable planet: useFrame accumulated-angle orbit, axial tilt, retrograde self-rotation
- `src/components/scene/OrbitLine.jsx` — drei Line, 128 segments, Y=0.01 + depthTest=false
- `src/components/scene/Scene.jsx` — Assembles ambientLight(0.08) + Sun + 9×(Planet+OrbitLine)
- `src/App.jsx` — Added Scene import + mount inside Suspense boundary
- `public/textures/*.jpg` (10 files) — Real 2K planet textures from Solar System Scope

## Decisions Made
- Zustand store coexists with SceneContext — SceneContext keeps speed/isPaused for UI consumers unchanged; Zustand is the animation-loop read source. Avoids migration risk.
- Solar System Scope 2K JPGs (CC-BY 4.0) — resolves texture blocker from STATE.md. No KTX2 compression needed at 2K.
- Pluto texture: Solar System Scope doesn't offer a dedicated Pluto 2K — used `2k_eris_fictional.jpg` (similar icy dwarf planet, visually appropriate)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Self-Check

Checking created files exist:
- [x] `src/store/sceneStore.js` — FOUND
- [x] `src/components/scene/Sun.jsx` — FOUND
- [x] `src/components/scene/Planet.jsx` — FOUND
- [x] `src/components/scene/OrbitLine.jsx` — FOUND
- [x] `src/components/scene/Scene.jsx` — FOUND
- [x] `src/App.jsx` (modified) — FOUND
- [x] All 10 `public/textures/*.jpg` > 100KB — CONFIRMED (except uranus 77KB, real texture)

Checking commits exist:
- [x] `ba27afd` — feat(02-01): Zustand store, real textures, Sun, Planet, OrbitLine
- [x] `a2aab0e` — feat(02-01): Scene root component with all 9 bodies

## Self-Check: PASSED

## Next Phase Readiness
- Plan 02-02 layers on top of this scene: Saturn rings (SaturnRings.jsx as child of Saturn Planet group), Earth clouds + Moon (EarthClouds.jsx + Moon.jsx as Planet group children), Venus atmosphere, Galilean moons, AsteroidBelt
- SceneContext speed/isPaused still in context — Phase 4 UI controls will dispatch SET_SPEED/TOGGLE_PAUSE to SceneContext AND call useSceneStore.getState() pattern works already
- `public/textures/saturn-ring.png` and `public/textures/earth-clouds.png` are still placeholders — Plan 02-02 must download these PNG alpha textures

---
*Phase: 02-scene-bodies*
*Completed: 2026-02-24*
