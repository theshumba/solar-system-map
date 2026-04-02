# Solar System Explorer

**A real-time 3D interactive solar system built with React Three Fiber, featuring textured planets, orbital mechanics, GSAP-powered camera flights, and per-body data panels.**

An immersive WebGL experience that lets you explore the Sun, all eight planets, Pluto, the asteroid belt, and notable moons. Click any celestial body to fly in, browse real astronomical data, and control simulation speed from pause to 100x.

---

## Features

**3D Rendering and Visual Effects**
- Textured planet spheres with accurate axial tilts and rotation directions (including retrograde Venus and Pluto)
- Emissive Sun with HDR bloom and vignette post-processing via `@react-three/postprocessing`
- Saturn's ring system with UV-remapped radial textures and z-fight-free transparency
- Earth cloud layer rotating independently from the surface
- Venus atmospheric glow using BackSide + AdditiveBlending (no custom shaders)
- Jupiter's four Galilean moons (Io, Europa, Ganymede, Callisto) with accurate relative orbits
- 2,000-instance animated asteroid belt rendered in a single draw call via `InstancedMesh`
- 8,000-star procedural starfield rendered outside Suspense for instant visibility

**Orbital Simulation**
- Accumulated-angle orbital animation (no time jumps on pause/resume)
- Per-planet orbital periods derived from real astronomical data
- Independent self-rotation rates per body
- Simulation speed slider from 0x to 100x with play/pause toggle
- Logarithmically compressed orbital distances for visual clarity

**Interaction and Navigation**
- Click any planet to trigger a GSAP-animated camera fly-to with smooth easing
- Orbit controls (rotate, zoom, pan) with damping
- Keyboard shortcuts: `1`-`9` to jump to planets, `Space` to pause, `Esc` to return to overview
- Hover labels that float above planets with cursor-pointer feedback
- Responsive sidebar navigation with color-coded planet list

**Information Panels**
- Slide-in data panel with real stats: distance, diameter, orbital period, temperature, moon count
- Animated composition bar charts (atmospheric or geological breakdown per body)
- Rotating fun-fact carousel with dot indicators
- Notable moons listed as pill badges
- Desktop: right sidebar. Mobile: bottom sheet with drag handle

**Performance**
- Zustand store for animation-loop reads (zero React re-renders at 60fps)
- Split React Context (state vs dispatch) to prevent unnecessary re-renders
- Module-level scratch objects for zero-allocation animation loops
- `InstancedMesh` for the asteroid belt (1 draw call for 2,000 bodies)
- Asset preloading with loading screen, progress bar, and random space facts

---

## Tech Stack

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r183-000000?style=flat-square&logo=threedotjs&logoColor=white)
![React Three Fiber](https://img.shields.io/badge/R3F-9.5-000000?style=flat-square&logo=threedotjs&logoColor=white)
![drei](https://img.shields.io/badge/drei-10.7-000000?style=flat-square&logo=threedotjs&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-3.14-88CE02?style=flat-square&logo=greensock&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-443E38?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite&logoColor=white)

| Layer | Technology | Role |
|-------|-----------|------|
| 3D Engine | Three.js r183 | WebGL rendering, geometries, materials |
| React Binding | React Three Fiber v9 | Declarative scene graph, `useFrame` loop |
| 3D Helpers | drei v10 | `OrbitControls`, `Stars`, `useTexture`, `useProgress` |
| Post-Processing | `@react-three/postprocessing` | Bloom (Sun glow), vignette |
| Animation | GSAP 3 | Camera fly-to tweens with easing |
| State (UI) | React Context + `useReducer` | Planet selection, hover, pause, speed |
| State (Animation) | Zustand 5 | Non-reactive reads inside `useFrame` |
| Styling | Tailwind CSS v4 | UI overlays, responsive layout |
| Build | Vite 7 | Dev server, production bundling |

---

## Screenshots

> Screenshots coming soon. The project renders a full 3D solar system with textured planets, bloom lighting, orbit lines, and interactive data panels.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install

```bash
git clone https://github.com/theshumba/solar-system-map.git
cd solar-system-map
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`. Hot-reloads on save.

### Production Build

```bash
npm run build
npm run preview
```

---

## Architecture

```
src/
  App.jsx                        # Canvas + DOM overlay split
  main.jsx                       # React root
  index.css                      # Tailwind v4 import
  context/
    SceneContext.jsx              # Split state/dispatch contexts + reducer
  store/
    sceneStore.js                 # Zustand — animation-safe reads
  data/
    constants.js                 # Orbital distances, radii, texture paths
    planets.js                   # Planet data: stats, facts, composition
  hooks/
    useCamera.js                 # GSAP fly-to + overview return
    useKeyboardShortcuts.js      # 1-9, Space, Escape bindings
    usePlanetSelect.js           # Dispatch helper for planet selection
  components/
    scene/
      Scene.jsx                  # Root scene assembly
      Sun.jsx                    # Emissive sphere + PointLight
      Planet.jsx                 # Orbital group + textured mesh + interaction
      CameraController.jsx       # OrbitControls + fly-to orchestration
      OrbitLine.jsx              # Orbit path ring with hover highlight
      Starfield.jsx              # 8,000-star procedural background
      PostProcessing.jsx         # Bloom + vignette
      AsteroidBelt.jsx           # 2,000 instanced asteroids
      SaturnRings.jsx            # UV-remapped ring geometry
      EarthClouds.jsx            # Independent cloud rotation layer
      VenusAtmosphere.jsx        # Additive-blend atmospheric glow
      Moon.jsx                   # Reusable orbiting moon
      GalileanMoons.jsx          # Io, Europa, Ganymede, Callisto
      HoverLabel.jsx             # Floating planet name on hover
    ui/
      LoadingScreen.jsx          # Progress bar + space facts
      InfoPanel.jsx              # Stats, facts carousel, composition chart
      NavSidebar.jsx             # Planet list with color swatches
      TimelineControl.jsx        # Speed slider + play/pause
      Footer.jsx                 # AU Brussel branding
```

### Key Design Decisions

**Canvas/DOM split** -- The 3D scene and UI overlays occupy separate layers. The Canvas fills the viewport at `z-0` with `touch-action: none`. DOM overlays sit at `z-10` with `pointer-events: none` on the container; individual interactive elements re-enable pointer events.

**Dual state architecture** -- React Context handles UI reactivity (panel visibility, selected planet). Zustand handles animation-loop reads via `getState()` to avoid triggering React re-renders 60 times per second.

**Accumulated-angle orbits** -- Each planet accumulates its orbital angle by `delta * rate * speed` per frame. This avoids the time-jump problem where pausing and resuming with `elapsedTime` causes planets to teleport.

**Logarithmic distance compression** -- Real AU distances would make outer planets invisible. Orbital distances are compressed so all nine bodies remain visible from the default camera position.

---

## Controls

| Input | Action |
|-------|--------|
| Click planet | Fly to planet, open info panel |
| `1` - `9` | Jump to Mercury through Pluto |
| `Space` | Pause / resume simulation |
| `Esc` | Return to overview |
| Drag | Orbit camera |
| Scroll | Zoom in/out |
| Slider | Adjust simulation speed (0-100x) |

---

## License

MIT
