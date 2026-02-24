# Roadmap: Solar System Interactive Map

## Overview

Build a visually cinematic 3D solar system orrery as a portfolio showcase for AU Brussel. The journey runs from a bare Vite scaffold to a fully interactive, responsive experience: correct architecture first (Canvas/DOM split, SceneContext, scale constants), then all celestial bodies with orbital animation, then the camera fly-to interaction loop with info panels, and finally the complete 2D UI overlay with responsive layout and branding.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Canvas/DOM split, SceneContext, planets data, loading screen, procedural starfield
- [ ] **Phase 2: Scene Bodies** - All planets, orbital animation, extended body features (Saturn rings, Earth Moon, Galilean moons, asteroid belt)
- [ ] **Phase 3: Camera and Interaction** - GSAP fly-to, hover labels, orbit controls handoff, info panel with stats and fun facts
- [ ] **Phase 4: UI and Responsive** - Navigation sidebar, speed control, composition chart, responsive layout, AU Brussel branding

## Phase Details

### Phase 1: Foundation
**Goal**: The scene infrastructure is correct and cannot be broken by subsequent phases
**Depends on**: Nothing (first phase)
**Requirements**: SCENE-10, SCENE-12, UI-07
**Success Criteria** (what must be TRUE):
  1. Opening the app shows the AU Brussel loading screen with a progress bar and a space fact, then transitions into the 3D scene
  2. A procedural starfield fills the void around the scene (no blank black background)
  3. The Canvas is configured correctly: dpr capped at 2, no shadow maps, Bloom post-processing present with luminanceThreshold >= 0.9 (verified: Sun glows, stars do not)
  4. SceneContext, planets.js data schema, and scale constants exist and are importable by every subsequent component without circular deps
**Plans**: 2 plans in 2 waves

Plans:
- [x] 01-01-PLAN.md — Vite 7 + React 19 + R3F + Tailwind v4 scaffold with Canvas/DOM composition, SceneContext, planets.js, and constants.js (Wave 1, autonomous) ✓ 2026-02-24
- [ ] 01-02-PLAN.md — Suspense + Preload boundary, LoadingScreen with AU Brussel branding, procedural starfield (Stars from drei), PostProcessing (Bloom + Vignette) (Wave 2, checkpoint)

### Phase 2: Scene Bodies
**Goal**: Users see a living solar system — all bodies orbiting, rotating, and visually distinguishable
**Depends on**: Phase 1
**Requirements**: SCENE-01, SCENE-02, SCENE-03, SCENE-04, SCENE-05, SCENE-06, SCENE-07, SCENE-08, SCENE-09, SCENE-11
**Success Criteria** (what must be TRUE):
  1. All 8 planets and Pluto orbit the Sun continuously with correct relative sizes and textured surfaces
  2. Each planet self-rotates on its tilted axis; Saturn displays a visible ring system; Earth has an orbiting Moon
  3. Jupiter shows all 4 Galilean moons (Io, Europa, Ganymede, Callisto) orbiting it
  4. The asteroid belt is visible between Mars and Jupiter as a dense field of instances (single draw call, no FPS degradation)
  5. Faint orbit path lines are visible for each planet; the Sun emits a bloom glow with a point light illuminating all bodies
**Plans**: 2 plans in 2 waves

Plans:
- [ ] 02-01-PLAN.md — Zustand store, real 2K textures, Sun emissive + PointLight, reusable Planet component (orbital animation + self-rotation + axial tilt), OrbitLine, Scene root with all 9 bodies (Wave 1, checkpoint)
- [ ] 02-02-PLAN.md — Saturn RingGeometry (UV remap, depthWrite:false), Earth cloud layer + Moon, Venus atmosphere glow (BackSide + AdditiveBlending), Jupiter Galilean moons, AsteroidBelt InstancedMesh (~2000 instances) (Wave 2, checkpoint)

### Phase 3: Camera and Interaction
**Goal**: Users can explore the solar system by clicking planets and flying to them for detailed information
**Depends on**: Phase 2
**Requirements**: CAM-01, CAM-02, CAM-03, CAM-04, CAM-05, UI-01, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. Clicking any planet triggers a smooth cinematic camera fly-to (~1.5s ease) that positions the camera near that planet
  2. The info panel slides in from the right showing planet name, tagline, 6 key stats, and 2-4 rotating fun facts
  3. Hovering a planet shows its name label above it, brightens its orbit line, and subtly scales it up
  4. Pressing Escape returns the camera to the Sun overview; pressing 1-9 jumps to the corresponding planet; pressing Space pauses or resumes orbital animation
  5. OrbitControls are active during free exploration and automatically disabled during any GSAP fly-to tween, re-enabled on completion
**Plans**: TBD

Plans:
- [ ] 03-01: CameraController + useCamera hook (GSAP flyTo with OrbitControls ref handoff), usePlanetSelect hook, SceneContext wired for selectedPlanet/hoveredPlanet, click pointer cursor on planets, useKeyboardShortcuts (1-9, Space, Escape)
- [ ] 03-02: HoverLabel (drei Html with occlude), orbit line glow on hover, InfoPanel DOM component (persistent render, prop-driven content, slide-in CSS transition) with planet name, tagline, 6 stats, and fun facts carousel

### Phase 4: UI and Responsive
**Goal**: The full interface is polished, usable on both desktop and mobile, and branded for AU Brussel
**Depends on**: Phase 3
**Requirements**: UI-02, UI-05, UI-06, UI-08, RESP-01, RESP-02, RESP-03
**Success Criteria** (what must be TRUE):
  1. The navigation sidebar lists all celestial bodies; clicking any entry flies the camera to that body
  2. The timeline speed control (slider 0x-100x + play/pause toggle) is visible and adjusting it immediately changes orbital animation speed
  3. The info panel atmospheric composition tab shows an animated bar chart for the selected planet
  4. On desktop the sidebar is pinned on the left and the info panel slides in from the right; on mobile the sidebar collapses behind a hamburger and the info panel appears as a bottom sheet
  5. Touch events on the HTML overlay panels do not rotate the 3D scene; the "Created by AU Brussel" badge is persistently visible
**Plans**: TBD

Plans:
- [ ] 04-01: NavSidebar (planet list, usePlanetSelect, active highlight), TimelineControl (speed slider, play/pause), Footer (AU Brussel badge), composition bar chart in InfoPanel (CSS/SVG animated bars)
- [ ] 04-02: Responsive layout (desktop sidebar + panel, mobile hamburger + bottom sheet InfoPanel), touch-action:none on Canvas, stopPropagation on HTML overlays, iOS Safari touch verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/2 | In progress | - |
| 2. Scene Bodies | 0/2 | Not started | - |
| 3. Camera and Interaction | 0/2 | Not started | - |
| 4. UI and Responsive | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-24*
*Last updated: 2026-02-24 after Phase 1 planning*
