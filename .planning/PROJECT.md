# Solar System Interactive Map

## What This Is

An interactive 3D solar system map built as a portfolio showcase for AU Brussel. A living orbital orrery where all planets orbit the Sun in real-time within a single continuous Three.js scene. Users explore freely with camera controls, click planets to fly in for detailed scientific info, navigate via sidebar or keyboard shortcuts, and view atmospheric composition charts. Fully responsive with mobile bottom sheet and touch isolation. Dynamic, fun, youthful, yet scientifically accurate.

## Core Value

A visually stunning, interactive 3D solar system that showcases AU Brussel's creative and technical capabilities — the experience must feel alive, responsive, and cinematic.

## Requirements

### Validated

- Completed Full 3D solar system scene with Sun, 8 planets, Pluto, asteroid belt, and major moons — v1.0
- Completed Real NASA/scientific data for all celestial bodies (distances, diameters, temperatures, compositions) — v1.0
- Completed Orbital animation with adjustable speed (0x to 100x) — v1.0
- Completed Camera fly-to animation on planet click with smooth GSAP transitions — v1.0
- Completed Planet info panel with stats, fun facts, composition charts, and moon lists — v1.0
- Completed Navigation sidebar for quick planet jumps — v1.0
- Completed Keyboard shortcuts (1-9 planet jump, Escape back, Space pause) — v1.0
- Completed Saturn rings, planet axial tilts, self-rotation — v1.0
- Completed Procedural starfield background — v1.0
- Completed Bloom post-processing for Sun glow — v1.0
- Completed Hover effects (name labels, orbit line glow, scale-up) — v1.0
- Completed Loading screen with AU Brussel branding and progress indicator — v1.0
- Completed Responsive design (desktop sidebar + panel, mobile bottom sheet + hamburger) — v1.0
- Completed AU Brussel branding (footer badge, loading screen) — v1.0
- Completed Planet-specific visual features (Venus atmosphere, Earth clouds/Moon, Jupiter moons) — v1.0

### Active

(None — plan next milestone with `/gsd:new-milestone`)

### Out of Scope

- Backend/server — pure static site
- User accounts or authentication — portfolio piece, not a product
- Realistic orbital distances — would make outer planets invisible (use compressed distances)
- VR/AR mode — adds significant complexity for minimal showcase value
- Sound/audio — visual showcase focus
- Drag-and-drop planet rearrangement — not scientifically meaningful
- Real ephemeris/VSOP87 positions — rabbit hole with imperceptible visual benefit for portfolio

## Context

Shipped v1.0 with 2,225 LOC JavaScript/JSX across 77 files.
Tech stack: React 19 + Vite 7 + React Three Fiber v9 + drei v10 + GSAP 3 + Tailwind CSS v4 + Zustand v5.
Pure static site — deployable to Vercel, Netlify, or GitHub Pages.
All textures from Solar System Scope (CC-BY 4.0, 2K JPGs).
AU Brussel branding on loading screen and footer badge.

## Constraints

- **Tech stack**: React 19 + Vite 7 + React Three Fiber + @react-three/drei + GSAP 3 + Tailwind CSS v4
- **No backend**: Static site deployable anywhere (Vercel, Netlify, GitHub Pages)
- **Performance**: Must run smoothly on modern browsers (60fps target for 3D scene)
- **Textures**: Solar System Scope 2K JPGs (CC-BY 4.0)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single-scene orbital orrery (not hub+detail or scroll-driven) | Most immersive "living map" feel, best for free exploration | Good — delivers wow factor |
| React Three Fiber v9 over vanilla Three.js | React component model, familiar DX, great ecosystem (drei) | Good — clean component architecture |
| GSAP for camera animations (two simultaneous tweens) | Buttery smooth fly-to transitions, proven animation library | Good — position + target sync is seamless |
| Compressed orbital distances | Real distances make outer planets invisible at any zoom level | Good — all planets visible and explorable |
| Zustand for animation-loop + SceneContext for UI | useFrame needs synchronous reads (Zustand), UI needs React reactivity (Context) | Good — dual-store pattern prevents 60fps re-renders |
| Two-context pattern (state + dispatch separate) | Dispatch-only components (buttons) never re-render on state changes | Good — zero wasted renders |
| InstancedMesh for asteroid belt (~2000 instances) | Single draw call, module-level scratch Object3D for zero GC | Good — no FPS impact |
| CSS transition-[width] with rAF trigger for composition bars | No chart library needed (5 bars), guaranteed paint at 0% before transition | Good — smooth animation, zero deps |
| stopPropagation for touch isolation | iOS Safari touch-action: none has incomplete support | Good — reliable cross-browser |
| Solar System Scope 2K JPG textures (CC-BY 4.0) | Free, high quality, consistent style across all bodies | Good — resolved texture pipeline |
| Tailwind CSS v4 for UI overlay | Consistent with modern React, responsive md: breakpoints | Good — single class strings handle both layouts |

---
*Last updated: 2026-02-25 after v1.0 milestone*
