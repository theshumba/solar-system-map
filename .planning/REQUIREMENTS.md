# Requirements: Solar System Interactive Map

**Defined:** 2026-02-24
**Core Value:** A visually stunning, interactive 3D solar system that showcases AU Brussel's creative and technical capabilities

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### 3D Scene

- [ ] **SCENE-01**: Sun rendered as emissive glowing sphere with Bloom post-processing and pulsating light
- [ ] **SCENE-02**: 8 planets + Pluto rendered as textured spheres with proportional sizes
- [ ] **SCENE-03**: All planets orbit the Sun with adjustable-speed orbital animation
- [ ] **SCENE-04**: Each planet self-rotates on its axis with correct axial tilt
- [ ] **SCENE-05**: Saturn rendered with visible ring system (torus geometry)
- [ ] **SCENE-06**: Earth rendered with cloud layer overlay and orbiting Moon
- [ ] **SCENE-07**: Venus rendered with atmosphere glow effect
- [ ] **SCENE-08**: Jupiter rendered with 4 Galilean moons (Io, Europa, Ganymede, Callisto)
- [ ] **SCENE-09**: Asteroid belt rendered between Mars and Jupiter using InstancedMesh
- [ ] **SCENE-10**: Procedural starfield background using Points geometry
- [ ] **SCENE-11**: Faint orbit path lines for each planet with glow on hover
- [ ] **SCENE-12**: Compressed orbital distances (not real scale) for visibility

### Camera & Interaction

- [ ] **CAM-01**: Free-orbit camera with OrbitControls centered on Sun by default
- [ ] **CAM-02**: Click planet triggers GSAP cinematic camera fly-to (~1.5s ease)
- [ ] **CAM-03**: Hover over planet shows name label, brightens orbit line, subtle scale-up
- [ ] **CAM-04**: Keyboard shortcuts: 1-9 jump to planet, Escape back to overview, Space pause/resume
- [ ] **CAM-05**: OrbitControls disabled during GSAP fly-to, re-enabled on completion

### UI Overlay

- [ ] **UI-01**: Info panel slides in from right with planet name, tagline, 6 key stats
- [ ] **UI-02**: Info panel shows atmospheric composition as animated bar chart
- [ ] **UI-03**: Info panel shows 2-4 rotating fun facts per planet
- [ ] **UI-04**: Info panel shows list of notable moons (clickable for major ones)
- [ ] **UI-05**: Navigation sidebar (left) with all celestial bodies, click to fly-to
- [ ] **UI-06**: Timeline speed control (bottom) with slider 0x-100x and play/pause
- [ ] **UI-07**: Loading screen with AU Brussel branding, progress bar, and space fact
- [ ] **UI-08**: "Created by AU Brussel" persistent footer badge

### Responsive

- [ ] **RESP-01**: Desktop layout with sidebar + right info panel
- [ ] **RESP-02**: Mobile layout with hamburger nav and bottom sheet info panel
- [ ] **RESP-03**: Touch events properly isolated (panel drag doesn't rotate scene)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Visuals
- **VIS-01**: Planet surface detail textures (high-res NASA maps)
- **VIS-02**: Neptune and Uranus faint ring detail
- **VIS-03**: Comet with tail particle effect

### Enhanced Interaction
- **INT-01**: Comparison mode (side-by-side planet stats)
- **INT-02**: Distance measurement tool between bodies
- **INT-03**: Real-time date simulation with actual planet positions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real ephemeris/VSOP87 positions | Rabbit hole with imperceptible visual benefit for portfolio |
| WebXR/VR mode | Doubles testing surface for <1% of viewers |
| Spacecraft trajectories | NASA Eyes spent years on this — not portfolio scope |
| All 146 Saturn moons | Performance killer, 4 major moons sufficient |
| Sound/audio | Visual showcase focus, browser autoplay restrictions |
| Backend/server | Pure static site, no authentication needed |
| Drag-and-drop rearrangement | Not scientifically meaningful |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (populated during roadmap creation) | | |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 0
- Unmapped: 23

---
*Requirements defined: 2026-02-24*
*Last updated: 2026-02-24 after initial definition*
