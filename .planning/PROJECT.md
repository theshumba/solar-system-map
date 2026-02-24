# Solar System Interactive Map

## What This Is

An interactive 3D solar system map built as a portfolio showcase for AU Brussel. A living orbital orrery where all planets orbit the Sun in real-time within a single continuous Three.js scene. Users explore freely with camera controls, click planets to fly in for detailed scientific info, and navigate via sidebar or keyboard shortcuts. Dynamic, fun, youthful, yet scientifically accurate.

## Core Value

A visually stunning, interactive 3D solar system that showcases AU Brussel's creative and technical capabilities — the experience must feel alive, responsive, and cinematic.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Full 3D solar system scene with Sun, 8 planets, Pluto, asteroid belt, and major moons
- [ ] Real NASA/scientific data for all celestial bodies (distances, diameters, temperatures, compositions)
- [ ] Orbital animation with adjustable speed (0x to 100x)
- [ ] Camera fly-to animation on planet click with smooth GSAP transitions
- [ ] Planet info panel with stats, fun facts, composition charts, and moon lists
- [ ] Navigation sidebar for quick planet jumps
- [ ] Keyboard shortcuts (1-9 planet jump, Escape back, Space pause)
- [ ] Saturn rings, planet axial tilts, self-rotation
- [ ] Procedural starfield background
- [ ] Bloom post-processing for Sun glow
- [ ] Hover effects (name labels, orbit line glow, scale-up)
- [ ] Loading screen with AU Brussel branding and progress indicator
- [ ] Responsive design (desktop sidebar + panel, mobile bottom sheet + hamburger)
- [ ] AU Brussel branding (footer badge, loading screen)
- [ ] Planet-specific visual features (Venus atmosphere, Earth clouds/Moon, Jupiter moons, Neptune blue)

### Out of Scope

- Backend/server — pure static site
- User accounts or authentication — portfolio piece, not a product
- Realistic orbital distances — would make outer planets invisible (use compressed distances)
- VR/AR mode — adds significant complexity for minimal showcase value
- Sound/audio — visual showcase focus
- Drag-and-drop planet rearrangement — not scientifically meaningful

## Context

- AU Brussel is the author/creator — branding must be visible but tasteful
- This is a portfolio showcase piece — visual impact and interactivity are paramount
- All planet data should use real scientific values from NASA
- Planet sizes are proportionally scaled but distances are compressed for visibility
- Design doc committed at `docs/plans/2026-02-24-solar-system-map-design.md`

## Constraints

- **Tech stack**: React 19 + Vite 7 + React Three Fiber + @react-three/drei + GSAP 3 + Tailwind CSS v4 — chosen for DX and capability
- **No backend**: Static site deployable anywhere (Vercel, Netlify, GitHub Pages)
- **Performance**: Must run smoothly on modern browsers (60fps target for 3D scene)
- **Textures**: Procedural or free NASA textures only — no paid assets

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single-scene orbital orrery (not hub+detail or scroll-driven) | Most immersive "living map" feel, best for free exploration | — Pending |
| React Three Fiber over vanilla Three.js | React component model, familiar DX, great ecosystem (drei) | — Pending |
| GSAP for camera animations | Buttery smooth fly-to transitions, proven animation library | — Pending |
| Compressed orbital distances | Real distances make outer planets invisible at any zoom level | — Pending |
| Procedural starfield (not skybox) | No external image dependency, lightweight, customizable | — Pending |
| Tailwind CSS v4 for UI overlay | Consistent with modern React projects, fast styling | — Pending |

---
*Last updated: 2026-02-24 after initialization*
