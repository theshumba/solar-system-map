---
phase: 03-camera-and-interaction
plan: "01"
subsystem: camera-interaction
tags: [camera, gsap, orbit-controls, keyboard, interaction, click, hover]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [camera-fly-to, planet-selection, keyboard-shortcuts, hover-cursor]
  affects: [scene, planet, store]
tech_stack:
  added: [gsap-tween-camera]
  patterns: [zustand-ref-registry, dual-tween-fly-to, drag-suppression, makDefault-controls]
key_files:
  created:
    - src/hooks/useCamera.js
    - src/hooks/useKeyboardShortcuts.js
    - src/components/scene/CameraController.jsx
  modified:
    - src/store/sceneStore.js
    - src/components/scene/Planet.jsx
    - src/components/scene/Scene.jsx
decisions:
  - "GSAP animates camera.position and controls.target with two simultaneous tweens, not one — keeps OrbitControls target in sync during flight"
  - "controls.enabled = false BEFORE tween start prevents OrbitControls fighting GSAP mid-flight"
  - "Module-level _scratchVec in useCamera — allocated once, never GC'd during 60fps loop"
  - "Zustand planetRef registry (not React ref prop drilling) — CameraController can read live refs without prop chain"
  - "Drag suppression via e.delta > 2 guard on onClick — R3F tracks pointer movement, delta > 2 means drag not click"
  - "useCursor(hovered) from drei — single call changes document.body.style.cursor to pointer on hover"
  - "useKeyboardShortcuts dispatches TOGGLE_PAUSE to both SceneContext (UI reactivity) and Zustand (animation loop)"
metrics:
  duration: ~2.5 min
  completed: 2026-02-25
---

# Phase 3 Plan 1: Camera and Interaction — GSAP Fly-To, OrbitControls, Keyboard

**One-liner:** GSAP two-tween camera fly-to system with OrbitControls handoff, Zustand planetRef registry, drag-suppressed click detection, and 1-9/Space/Escape keyboard shortcuts.

## What Was Built

### Task 1: Zustand planetRef registry + CameraController + useCamera hook

**src/store/sceneStore.js** — Extended with planet ref registry:
- `planetRefs: {}` — live Three.js group refs keyed by planet id
- `registerPlanetRef(id, ref)` — called by Planet on mount
- `unregisterPlanetRef(id)` — called by Planet on unmount

**src/hooks/useCamera.js** — Camera animation helpers:
- Module-level `_scratchVec = new Vector3()` — zero GC allocation in hot path
- `flyTo(planetData, groupRef)` — disables controls, kills existing tweens, fires two simultaneous GSAP tweens (camera.position + controls.target), re-enables controls on complete
- `flyToOverview()` — same pattern targeting `[0, 50, 120]` camera and `[0, 0, 0]` target
- `useThree` for camera + controls (exposed by OrbitControls makeDefault)
- Both functions are `useCallback([camera, controls])` stable refs

**src/hooks/useKeyboardShortcuts.js** — Global keyboard handler:
- `1–9` → SELECT_PLANET for nth PLANETS entry
- `Space` → preventDefault + TOGGLE_PAUSE dispatched to both SceneContext and Zustand
- `Escape` → SELECT_PLANET null
- Guard: skips if activeElement is INPUT or TEXTAREA
- Cleanup: removeEventListener on unmount

**src/components/scene/CameraController.jsx**:
- `<OrbitControls makeDefault enableDamping dampingFactor={0.05} minDistance={3} maxDistance={200} />`
- `useEffect` watching `selectedPlanet` from SceneContext
- On change: reads planetRefs from Zustand, calls `flyTo` or `flyToOverview`
- Mounts `useKeyboardShortcuts()`

### Task 2: Planet click/hover handlers + Scene wiring

**src/components/scene/Planet.jsx** — Added interaction:
- `useState(false)` for hovered, `useCursor(hovered)` from drei
- `useSceneDispatch()` for SELECT_PLANET / HOVER_PLANET
- `useEffect` to `registerPlanetRef(data.id, groupRef)` on mount, `unregisterPlanetRef` on unmount
- `handleClick`: `e.stopPropagation()`, `e.delta > 2` drag guard, `SELECT_PLANET`
- `handlePointerOver` / `handlePointerOut`: set hovered + HOVER_PLANET dispatch
- Applied to `<mesh>`: onClick, onPointerOver, onPointerOut

**src/components/scene/Scene.jsx** — Added `<CameraController />` as first child, updated comment block.

## Verification

**Build check:** `npx vite build` completed successfully in 2.23s — 630 modules, no errors.
**Dev server:** Running on http://localhost:5174 (HTTP 200 confirmed).

## Deviations from Plan

None — plan executed exactly as written.

## Human Verification Steps (Task 3 — Checkpoint)

The dev server is running at **http://localhost:5174**

Verify these behaviors in the browser:

1. **Cursor change on hover** — Move mouse over any planet sphere. Cursor should change to pointer (hand icon).

2. **Click fly-to** — Click any planet. Camera should animate smoothly (~1.5s) toward that planet, ending near it with orbital controls re-enabled.

3. **Drag suppression** — Click-drag across a planet. Camera should orbit, NOT trigger a fly-to.

4. **Keyboard 1-9** — Press digit keys 1 through 9. Each should trigger a fly-to to the corresponding planet (1=Mercury, 9=Pluto).

5. **Escape overview** — After clicking a planet, press Escape. Camera should fly back to overview position [0, 50, 120].

6. **Space pause** — Press Space. Planetary orbits should freeze. Press again to resume.

7. **OrbitControls after fly-to** — After a fly-to completes, drag to orbit around the planet. Controls should work normally.

## Self-Check: PASSED

All created/modified files confirmed present:
- FOUND: src/store/sceneStore.js
- FOUND: src/hooks/useCamera.js
- FOUND: src/hooks/useKeyboardShortcuts.js
- FOUND: src/components/scene/CameraController.jsx
- FOUND: src/components/scene/Planet.jsx
- FOUND: src/components/scene/Scene.jsx
- FOUND: .planning/phases/03-camera-and-interaction/03-01-SUMMARY.md

All commits confirmed:
- FOUND: d874efd (Task 1)
- FOUND: 19345d2 (Task 2)

Build: npx vite build completed successfully (630 modules, no errors)
Dev server: http://localhost:5174 (HTTP 200)
