# Phase 2: Scene Bodies - Research

**Researched:** 2026-02-24
**Domain:** React Three Fiber v9 — 3D planet rendering, orbital animation, InstancedMesh, texture loading, specialized geometries
**Confidence:** HIGH (all major claims verified against installed package source or official docs)

---

## Summary

Phase 2 constructs the living heart of the solar system: all 9 celestial bodies orbiting, rotating, and glowing. The data layer is complete (`planets.js`, `constants.js`) and the scene shell is in place (`App.jsx`, `SceneContext.jsx`). The only remaining concern is textures: all 12 texture files in `public/textures/` are **1×1 pixel placeholders** — real textures must be downloaded before implementation begins. Solar System Scope (CC-BY 4.0 license) is the clear texture source for this project.

The core animation pattern is straightforward in R3F v9: a single reusable `Planet` component receives data props, uses `useRef` to hold the mesh, and runs `useFrame` to compute orbital position from `state.clock.elapsedTime * speed * orbitalRate` then places the planet at `[cos(angle) * distance, 0, sin(angle) * distance]`. Self-rotation is a separate `rotation.y += delta * selfRotationRate`. Axial tilt is applied to the mesh's initial `rotation.z`, not the orbital group. Speed and pause state are read inside `useFrame` via Zustand's `store.getState()` to avoid causing React re-renders on every frame — this is the critical architectural decision for this phase.

The two genuinely tricky items are: (1) Saturn's rings require UV remapping on `RingGeometry` because the default UV layout is wrong for radial textures; and (2) the AsteroidBelt uses raw `InstancedMesh` via `useRef`, not drei's `Instances` helper, because we need per-instance orbital animation in `useFrame` with pre-allocated scratch objects.

**Primary recommendation:** Download Solar System Scope 2K textures first (one download step, CC-BY 4.0, ~1–3 MB each). Then build in order: Sun + PointLight, Planet component, all 9 bodies, orbit lines, Saturn rings, Earth cloud + Moon, Venus atmosphere, Galilean moons, AsteroidBelt.

---

## BLOCKER RESOLVED: Texture Asset Pipeline

**STATE.md blocker**: "Texture asset pipeline not resolved — NASA free textures vs Solar System Scope textures, affects file sizes and whether KTX2 compression is needed."

**Resolution:**

| Decision | Choice | Reason |
|----------|--------|--------|
| Source | Solar System Scope (solarsystemscope.com/textures) | CC-BY 4.0 license, web-optimized, covers all 9 bodies + ring + clouds |
| Resolution | 2K (2048×1024) | ~1–3 MB per texture as JPG; 8K would require KTX2 compression to be viable |
| Format | JPG for planets, PNG for saturn-ring + earth-clouds (need transparency) | Matches existing `TEXTURE_PATHS` keys in `constants.js` |
| KTX2 compression | NOT required | 2K JPGs load fast, fit comfortably in GPU memory, no pipeline tooling needed |

**What needs downloading (12 files matching `constants.js` keys):**

```
public/textures/
  sun.jpg           — Sun surface map
  mercury.jpg       — Mercury surface
  venus.jpg         — Venus surface (not atmosphere)
  earth.jpg         — Earth day map
  earth-clouds.png  — Earth cloud alpha (PNG, needs transparency)
  mars.jpg          — Mars surface
  jupiter.jpg       — Jupiter bands
  saturn.jpg        — Saturn surface
  saturn-ring.png   — Saturn ring alpha map (PNG, needs transparency/alpha)
  uranus.jpg        — Uranus surface
  neptune.jpg       — Neptune surface
  pluto.jpg         — Pluto surface
```

Solar System Scope provides all of these directly. The `saturn-ring.png` should use the ring alpha texture for transparency. The `earth-clouds.png` is the cloud alpha map (white = clouds, black = clear sky).

**Confidence:** HIGH — verified source URL, license, file availability at solarsystemscope.com/textures.

---

## Standard Stack

All packages already installed. No new installs required.

### Core (already in package.json)

| Library | Installed Version | Purpose | Role in Phase 2 |
|---------|-------------------|---------|-----------------|
| `three` | 0.183.1 | 3D engine | `InstancedMesh`, `Object3D`, `Matrix4`, `RingGeometry`, `SphereGeometry` |
| `@react-three/fiber` | 9.5.0 | R3F renderer | `useFrame`, `useRef`, Canvas context |
| `@react-three/drei` | 10.7.7 | R3F helpers | `useTexture`, `Line` (for orbit paths), `Preload` |
| `zustand` | 5.0.11 | State store | `create` + `getState()` for speed/pause inside `useFrame` |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `three-stdlib` | (drei dep) | Three.js utilities | `Line2`, `LineMaterial` used by drei's `Line` component |

### Not Needed for Phase 2

- GSAP: Phase 3 (camera fly-to)
- `@react-three/postprocessing`: Already set up in Phase 1 (`PostProcessing.jsx`) — Bloom already active
- Tailwind: Phase 3/4 (UI overlays)

---

## Architecture Patterns

### Recommended Project Structure

```
src/
  components/
    scene/
      Scene.jsx             # Root scene component — assembles all bodies
      Sun.jsx               # Emissive sphere + PointLight
      Planet.jsx            # Reusable: textured sphere, axial tilt, orbital useFrame
      OrbitLine.jsx         # Faint circle using drei Line
      SaturnRings.jsx       # RingGeometry with UV remap, depthWrite:false
      EarthClouds.jsx       # Transparent cloud sphere + Moon
      VenusAtmosphere.jsx   # Additive glow sphere (BackSide)
      GalileanMoons.jsx     # 4 small moons orbiting Jupiter
      AsteroidBelt.jsx      # InstancedMesh, ~2000 instances, useFrame orbit
    ui/
      ...                   # Phase 1 components untouched
  data/
    planets.js              # Already complete — all 9 bodies
    constants.js            # Already complete — scales, distances, texture paths
  store/
    sceneStore.js           # NEW: Zustand store for speed/isPaused (read in useFrame)
  context/
    SceneContext.jsx        # Existing — selectedPlanet, hoveredPlanet, cameraMode
```

### Pattern 1: Orbital Animation with Zustand Speed

**What:** `useFrame` reads speed and isPaused from Zustand's `getState()` (not React hook) to avoid re-renders. Uses accumulated angle stored in a ref (not elapsedTime directly) to support pause correctly.

**Why accumulated angle over elapsedTime:** If you use `clock.elapsedTime` directly, pausing requires stopping the clock which causes a jump on resume. An accumulated ref survives pause correctly.

**Example:**
```javascript
// Source: verified against r3f pitfalls docs + zustand v5 vanilla.d.ts
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { sceneStore } from '../../store/sceneStore'

export default function Planet({ data }) {
  const meshRef = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2) // random start phase
  const texture = useTexture(data.texture)

  const ORBITAL_RATE = (2 * Math.PI) / (data.orbitalPeriod * 365.25) // radians per Earth-day
  const SELF_ROT_RATE = (2 * Math.PI) / (Math.abs(data.rotationPeriod) * 86400) // per second
  const ROT_SIGN = data.rotationPeriod < 0 ? -1 : 1

  useFrame((_state, delta) => {
    if (!meshRef.current) return
    const { speed, isPaused } = sceneStore.getState() // no React re-render

    if (!isPaused) {
      angleRef.current += delta * ORBITAL_RATE * speed
    }

    const angle = angleRef.current
    meshRef.current.position.set(
      Math.cos(angle) * data.distance,
      0,
      Math.sin(angle) * data.distance
    )

    if (!isPaused) {
      meshRef.current.rotation.y += ROT_SIGN * delta * SELF_ROT_RATE * speed
    }
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[0, 0, (data.axialTilt * Math.PI) / 180]} // axial tilt on Z
    >
      <sphereGeometry args={[data.radius, 32, 32]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}
```

**Key detail:** Axial tilt is applied via `rotation.z` on the mesh declaration (JSX prop, not `rotation.x`), so the tilt is in the orbital plane's frame. This matches the visual expectation for most planets.

**Confidence:** HIGH — pattern verified against R3F v9 docs, zustand v5 vanilla API, R3F pitfalls page.

### Pattern 2: Zustand Store for Animation State

**What:** A separate Zustand store (`sceneStore`) holds `speed` and `isPaused`. These are read in `useFrame` via `sceneStore.getState()` — never via `useSceneContext()` — because context reads inside `useFrame` would cause re-render cascades.

**Why separate from SceneContext:** `SceneContext` uses React Context + useReducer, which triggers React re-renders on every dispatch. Fine for `selectedPlanet` (infrequent). Not fine for speed slider which might change 60×/s. Zustand's `getState()` is synchronous and non-reactive.

```javascript
// Source: verified zustand v5 react.d.ts + vanilla.d.ts
// src/store/sceneStore.js
import { create } from 'zustand'

export const useSceneStore = create((set) => ({
  speed: 1,
  isPaused: false,
  setSpeed: (speed) => set({ speed }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
}))

// Access in useFrame (no React subscription, no re-render):
// const { speed, isPaused } = useSceneStore.getState()
```

**Note:** `SceneContext` already handles `speed` and `isPaused` via `SET_SPEED` and `TOGGLE_PAUSE` actions. The plan must decide: either (a) migrate those to the new Zustand store, or (b) keep them in SceneContext for UI components and have SceneContext dispatch also update the Zustand store. Option (a) is cleaner — Zustand store owns animation state, SceneContext owns camera/selection state.

**Confidence:** HIGH — verified zustand v5 API, R3F pitfalls docs.

### Pattern 3: Saturn RingGeometry UV Remap

**What:** `RingGeometry`'s default UV mapping is linear/billboard and does not work for radial textures (ring maps go inner→outer radially). UV must be remapped after construction.

**Example:**
```javascript
// Source: discourse.threejs.org + github.com/mrdoob/three.js/issues/18120
import { useRef, useMemo } from 'react'
import { RingGeometry, Vector3 } from 'three'
import { useTexture } from '@react-three/drei'

export default function SaturnRings({ innerRadius, outerRadius }) {
  const ringTexture = useTexture('/textures/saturn-ring.png')

  const geometry = useMemo(() => {
    const geo = new RingGeometry(innerRadius, outerRadius, 128, 1)
    const pos = geo.attributes.position
    const uv = geo.attributes.uv
    const v3 = new Vector3()
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i)
      // Map inner radius → U=0, outer radius → U=1
      const normalized = (v3.length() - innerRadius) / (outerRadius - innerRadius)
      uv.setXY(i, normalized, 1)
    }
    return geo
  }, [innerRadius, outerRadius])

  return (
    <mesh geometry={geometry} rotation-x={Math.PI / 2}>
      <meshBasicMaterial
        map={ringTexture}
        side={2}               // THREE.DoubleSide
        transparent={true}
        depthWrite={false}     // CRITICAL — prevents z-fighting with planet
        opacity={0.9}
      />
    </mesh>
  )
}
```

**Key details:**
- `rotation-x={Math.PI / 2}` rotates the ring from XY plane to XZ plane (horizontal)
- `depthWrite={false}` is mandatory — without it the ring clips into Saturn's sphere
- `transparent={true}` enables the alpha channel of `saturn-ring.png`
- Rings are a **child of Saturn's mesh group** so they orbit and rotate with Saturn automatically

**Confidence:** HIGH — UV remap solution verified in Three.js GitHub issue #18120 and Three.js forum.

### Pattern 4: AsteroidBelt with InstancedMesh

**What:** ~2000 rock instances using Three.js `InstancedMesh` directly (not drei's `Instances`). Each instance has a random radius (within belt band), random angle, random Y spread, and random speed offset. In `useFrame`, each instance's orbital angle increments and `setMatrixAt` updates the matrix.

**Why raw InstancedMesh over drei's Instances:** drei's `Instances` uses a declarative React model with child `<Instance>` components. For 2000 animated instances updated per-frame, the raw imperative approach with a pre-allocated scratch `Object3D` is more performant.

**Example:**
```javascript
// Source: r3f docs scaling-performance, Three.js InstancedMesh source, r3f discussion #761
import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, Matrix4 } from 'three'
import { sceneStore } from '../../store/sceneStore'
import { ORBITAL_DISTANCES } from '../../data/constants'

const COUNT = 2000
const INNER = ORBITAL_DISTANCES.mars + 2      // just outside Mars
const OUTER = ORBITAL_DISTANCES.jupiter - 3  // just inside Jupiter
const scratch = new Object3D()               // PRE-ALLOCATED — no per-frame allocation

export default function AsteroidBelt() {
  const meshRef = useRef()

  // Pre-generate stable random data (never re-computed)
  const instanceData = useMemo(() => {
    const data = []
    for (let i = 0; i < COUNT; i++) {
      const radius = INNER + Math.random() * (OUTER - INNER)
      const angle = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 1.5   // slight vertical spread
      const speed = 0.02 + Math.random() * 0.03 // vary orbital speed slightly
      data.push({ radius, angle, y, speed })
    }
    return data
  }, [])

  // Set initial positions
  useEffect(() => {
    if (!meshRef.current) return
    instanceData.forEach((d, i) => {
      scratch.position.set(Math.cos(d.angle) * d.radius, d.y, Math.sin(d.angle) * d.radius)
      scratch.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      scratch.scale.setScalar(0.05 + Math.random() * 0.1)
      scratch.updateMatrix()
      meshRef.current.setMatrixAt(i, scratch.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [instanceData])

  useFrame((_state, delta) => {
    if (!meshRef.current) return
    const { speed, isPaused } = sceneStore.getState()
    if (isPaused) return

    instanceData.forEach((d, i) => {
      d.angle += delta * d.speed * speed
      scratch.position.set(Math.cos(d.angle) * d.radius, d.y, Math.sin(d.angle) * d.radius)
      scratch.updateMatrix()
      meshRef.current.setMatrixAt(i, scratch.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]} frustumCulled={false}>
      <dodecahedronGeometry args={[0.07, 0]} />
      <meshStandardMaterial color="#888888" roughness={0.9} metalness={0.1} />
    </instancedMesh>
  )
}
```

**Key details:**
- `scratch` is allocated ONCE outside the component — this is the critical performance rule
- `frustumCulled={false}` prevents the entire instanced mesh from disappearing when the camera looks away from the belt's bounding sphere
- `instanceMatrix.needsUpdate = true` must be set every frame after mutations
- `COUNT = 2000` is safe — R3F docs say keep draw calls under 1000 total, but `InstancedMesh` = 1 draw call regardless of `COUNT`

**Confidence:** HIGH — verified against Three.js InstancedMesh source (v0.183.1), R3F scaling-performance docs, R3F discussion #761.

### Pattern 5: Orbit Path Lines

**What:** A ring of points in the XZ plane passed to drei's `Line` component. Y-offset of `0.01` and `depthTest={false}` prevent z-fighting with the planet orbital plane.

**Example:**
```javascript
// Source: drei Line.d.ts + Three.js forum z-fighting discussion
import { useMemo } from 'react'
import { Line } from '@react-three/drei'

const SEGMENTS = 128

export default function OrbitLine({ radius, color = '#334455', opacity = 0.3 }) {
  const points = useMemo(() => {
    const pts = []
    for (let i = 0; i <= SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2
      pts.push([Math.cos(angle) * radius, 0.01, Math.sin(angle) * radius]) // Y=0.01 anti-z-fight
    }
    return pts
  }, [radius])

  return (
    <Line
      points={points}
      color={color}
      lineWidth={0.5}
      transparent
      opacity={opacity}
      depthTest={false}         // render on top of all geometry, no z-fighting
    />
  )
}
```

**Confidence:** HIGH — verified drei Line.d.ts (lineWidth, color, transparent, opacity props confirmed), Three.js forum z-fighting solution verified.

### Pattern 6: Earth Cloud Layer

**What:** A second sphere slightly larger than Earth with a transparent cloud texture. The clouds mesh is a sibling inside the Earth orbital group (so it orbits with Earth), but self-rotates independently at a slightly different rate.

```javascript
// Source: verified against Three.js docs, drei useTexture implementation
function EarthClouds({ earthRadius }) {
  const cloudRef = useRef()
  const cloudTexture = useTexture('/textures/earth-clouds.png')

  useFrame((_state, delta) => {
    if (!cloudRef.current) return
    cloudRef.current.rotation.y += delta * 0.05 // slightly different from Earth self-rotation
  })

  return (
    <mesh ref={cloudRef}>
      <sphereGeometry args={[earthRadius * 1.02, 32, 32]} />
      <meshStandardMaterial
        map={cloudTexture}
        alphaMap={cloudTexture}  // use cloud texture as its own alpha
        transparent={true}
        depthWrite={false}       // prevents cloud sphere from z-writing into Earth
        opacity={0.7}
      />
    </mesh>
  )
}
```

**Note on cloud texture:** The `earth-clouds.png` is currently a 1×1 placeholder. The Solar System Scope "Earth clouds" download is an alpha map (8K recommended, 2K viable). It should be white where clouds exist, black where clear sky. If the downloaded file is already grayscale alpha, use it as both `map` and `alphaMap`. If it's a color cloud image, use it only as `alphaMap`.

**Confidence:** MEDIUM — pattern is standard Three.js; specific behavior depends on the actual cloud texture format from Solar System Scope.

### Pattern 7: Venus Atmosphere Glow

**What:** A slightly larger sphere rendered with `side={THREE.BackSide}` and `blending={AdditiveBlending}` creates a rim-glow effect that looks like atmospheric haze. This is the "cheap" atmosphere technique — no shader required.

```javascript
import { AdditiveBlending } from 'three'

function VenusAtmosphere({ venusRadius }) {
  return (
    <mesh>
      <sphereGeometry args={[venusRadius * 1.08, 32, 32]} />
      <meshBasicMaterial
        color="#e8cda0"       // Venus yellowish atmosphere color
        side={1}              // THREE.BackSide
        transparent={true}
        opacity={0.15}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}
```

**Key:** `BackSide` rendering shows the interior of the sphere from outside, creating a halo effect. `AdditiveBlending` makes it brighten behind, not occlude. This does NOT respond to the PointLight — it's purely a visual hack. Acceptable for a portfolio showcase.

**Confidence:** MEDIUM — technique is documented in Three.js community but specific parameters (scale, opacity, color) need visual tuning.

### Pattern 8: Galilean Moons

**What:** Four small textured spheres orbiting Jupiter using the same `useFrame` orbital pattern as planets, but with `data.distance` relative to Jupiter's world position. The simplest implementation: each moon's `useFrame` reads Jupiter's current world position from Jupiter's `meshRef`, then computes its own orbital position offset.

**Better approach:** Galilean moon components are children of a `<group>` that tracks Jupiter's position. The moons' orbital animation runs relative to the group's local origin (which is Jupiter). This avoids needing to read Jupiter's world position.

```javascript
// Moon orbits Jupiter: mounted as children of Jupiter's orbital group
// Each moon has its own orbital radius and period
const GALILEAN_MOONS = [
  { id: 'io',       radius: 0.12, distance: 3.8, orbitalPeriod: 1.769 },
  { id: 'europa',   radius: 0.10, distance: 5.0, orbitalPeriod: 3.551 },
  { id: 'ganymede', radius: 0.16, distance: 6.8, orbitalPeriod: 7.155 },
  { id: 'callisto', radius: 0.15, distance: 9.0, orbitalPeriod: 16.69 },
]
```

**Confidence:** HIGH — orbital math is identical to planets, parent-child scene graph handles relative positioning correctly.

### Pattern 9: Earth's Moon

**What:** Same pattern as Galilean moons — a single Moon component orbiting Earth. Earth's Moon has a relatively large radius (0.27× Earth), orbital distance ~1 Earth radius × 3 for visual clarity, and a 27-day orbital period.

```javascript
const MOON_DATA = {
  id: 'moon',
  radius: PLANET_RADII.earth * 0.27,
  distance: PLANET_RADII.earth * 3.5, // compressed for visibility
  orbitalPeriod: 27.32 / 365.25,      // ~0.0748 Earth years
}
```

**Confidence:** HIGH.

### Anti-Patterns to Avoid

- **`new Vector3()` inside `useFrame`**: Allocates garbage every frame — GC spikes. Pre-allocate all scratch objects outside the component.
- **`useSceneContext()` inside `useFrame`**: React hooks can't be called inside non-React functions. Read animation state via `zustand store.getState()` instead.
- **`setState` inside `useFrame`**: Routes frame-rate updates through React scheduler — causes re-render storm.
- **Individual meshes for asteroid belt**: 2000 draw calls instead of 1 — instant performance death.
- **Mounting/unmounting planet components**: Three.js recompiles buffers on mount. Keep planets mounted (use opacity/visibility instead of conditional rendering).
- **`clock.elapsedTime` without accumulated delta for pauseable animation**: Pause will cause a position jump on resume because `elapsedTime` includes paused time.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Orbit path circles | Custom BufferGeometry circle | `<Line>` from `@react-three/drei` | Line handles LineMaterial, resolution fix, width in pixels — BufferGeometry line has fixed 1px width on WebGL |
| Texture loading with Suspense | Custom TextureLoader hook | `useTexture` from `@react-three/drei` | Handles Suspense integration, GPU upload, preloading, caching, key-value object API |
| Saturn ring UV remap | Custom ring shader | Manual UV patch on `RingGeometry` | 10 lines vs full ShaderMaterial — no custom shader needed |
| Planet-scale data | Custom data structure | Existing `planets.js` + `constants.js` | Already complete — do not duplicate |

---

## Common Pitfalls

### Pitfall 1: Placeholder Textures
**What goes wrong:** All 12 textures in `public/textures/` are 1×1 placeholder files. Planets will render as grey spheres with a single pixel color.
**Why it happens:** Textures were not downloaded during Phase 1 scaffold.
**How to avoid:** Download 2K textures from solarsystemscope.com/textures BEFORE implementing Planet component. The `TEXTURE_PATHS` keys in `constants.js` already match the expected filenames.
**Warning signs:** Grey spheres, console `THREE.Texture` warnings about mipmaps, or all planets same color.

### Pitfall 2: InstancedMesh Initial State = Invisible
**What goes wrong:** All 2000 asteroid instances are invisible on first render.
**Why it happens:** `InstancedMesh` initializes all instance matrices to zero matrix (not identity matrix). Zero-scale objects are invisible.
**How to avoid:** Set all instance matrices in a `useEffect` or immediately after the ref is assigned. Call `instanceMatrix.needsUpdate = true` after initialization.
**Warning signs:** Empty scene where the asteroid belt should be, no console errors.

### Pitfall 3: RingGeometry Texture Shows Wrong
**What goes wrong:** Saturn's ring texture appears smeared, tiled, or just a solid color band.
**Why it happens:** Default UV on `RingGeometry` is not polar — it maps the ring as if it were a flat rectangle, not a radial disk.
**How to avoid:** Apply the UV remap in `useMemo` (see Pattern 3 above) before passing geometry to the mesh.
**Warning signs:** Rings look like solid colored bands rather than showing the ring pattern.

### Pitfall 4: Z-Fighting Between Orbit Lines and Orbital Plane
**What goes wrong:** Orbit lines flicker, disappear, or show visual noise.
**Why it happens:** Orbit lines are coplanar with Y=0, fighting for depth with the planet mesh's projected area.
**How to avoid:** Use `depthTest={false}` on the `Line` material and/or set Y to `0.01`. Both together is most reliable.
**Warning signs:** Lines flicker at certain camera angles.

### Pitfall 5: Saturn Rings Clip Into Planet
**What goes wrong:** Part of the ring geometry renders inside Saturn's sphere.
**Why it happens:** Both meshes write to the depth buffer, so the ring can occlude or be occluded incorrectly by the planet.
**How to avoid:** `depthWrite={false}` on the ring material. The ring is drawn transparently over whatever is behind it.
**Warning signs:** Visible clipping where ring intersects planet silhouette.

### Pitfall 6: Axial Tilt Confuses the Orbital Angle
**What goes wrong:** Planets visually tilt in the wrong direction or wobble in orbit.
**Why it happens:** Applying axial tilt to the same `rotation` that drives orbital motion creates compound rotations.
**How to avoid:** Use a **parent group** for orbital positioning and a **child mesh** for axial tilt. The orbital `useFrame` updates the group/mesh position; the mesh's `rotation.z` (set once in JSX) provides the tilt.
**Warning signs:** Planets appear to wobble as they orbit.

### Pitfall 7: Moon Orbital Distance Uses Planet Radius, Not World Radius
**What goes wrong:** Moon appears inside or overlapping the planet.
**Why it happens:** Moon's orbital distance is set in world units but wasn't offset by the parent planet's size.
**How to avoid:** `distance = PLANET_RADII.earth * 3.5` — explicitly set relative to the planet radius, not a fixed world unit.
**Warning signs:** Moon visible inside the planet mesh.

---

## Code Examples

Verified patterns from official sources:

### useFrame Signature (r3f v9)
```javascript
// Source: @react-three/fiber dist/declarations/src/core/hooks.d.ts
// RenderCallback = (state: RootState, delta: number, frame?: XRFrame) => void
useFrame((state, delta) => {
  // state.clock.elapsedTime — total time
  // delta — seconds since last frame (use this for frame-rate independent motion)
})
```

### useTexture with Object API (drei v10)
```javascript
// Source: @react-three/drei core/Texture.d.ts, core/Texture.js
// Single texture
const texture = useTexture('/textures/earth.jpg')

// Multiple textures — returns array
const [earthTex, cloudTex] = useTexture(['/textures/earth.jpg', '/textures/earth-clouds.png'])

// Key-value (auto-assigns to material props by name)
const props = useTexture({ map: '/textures/earth.jpg', alphaMap: '/textures/earth-clouds.png' })
return <meshStandardMaterial {...props} />
```

### drei Line for Orbit Paths
```javascript
// Source: @react-three/drei core/Line.d.ts
// points: ReadonlyArray<Vector2 | Vector3>
// lineWidth: number (pixels)
<Line
  points={circlePoints}     // pre-computed array of [x, y, z]
  color="#334455"
  lineWidth={0.5}
  transparent
  opacity={0.3}
  depthTest={false}
/>
```

### Zustand v5 Store + getState Pattern
```javascript
// Source: zustand v5 react.d.ts + vanilla.d.ts
import { create } from 'zustand'

export const useSceneStore = create((set) => ({
  speed: 1,
  isPaused: false,
  setSpeed: (speed) => set({ speed }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
}))

// In useFrame (NO React hook call — direct store access):
const { speed, isPaused } = useSceneStore.getState()
```

### InstancedMesh in JSX (R3F v9)
```javascript
// Source: Three.js InstancedMesh.js source + R3F JSX element system
<instancedMesh ref={meshRef} args={[null, null, COUNT]} frustumCulled={false}>
  <dodecahedronGeometry args={[0.07, 0]} />
  <meshStandardMaterial color="#888888" roughness={0.9} metalness={0.1} />
</instancedMesh>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `drei` `<Instances>` for all InstancedMesh | Raw `<instancedMesh>` for animated instances | Always — `Instances` is declarative helper | For per-frame matrix updates, raw is simpler and avoids React overhead |
| `clock.elapsedTime * speed` for orbital angle | Accumulated `angleRef.current += delta * rate * speed` | Best practice since R3F v7 | Correctly handles pause, speed changes, and resets |
| `useContext` inside `useFrame` | Zustand `store.getState()` inside `useFrame` | R3F v8 "pitfalls" docs | Context reads inside `useFrame` cause render loops |
| `THREE.Line` + `LineBasicMaterial` | drei `<Line>` (uses `Line2` + `LineMaterial`) | drei v7+ | `Line2` supports configurable pixel-width on all platforms |

**Deprecated/outdated in this project:**
- `clock.stop()` / `clock.start()` for pause: causes `elapsedTime` discrepancy on resume. Use `isPaused` flag + delta accumulation.
- `TorusGeometry` for Saturn rings: was the "quick" approach but produces concentric rings, not a flat disk. `RingGeometry` with UV remap is correct.

---

## Open Questions

1. **Saturn ring texture alpha format**
   - What we know: `saturn-ring.png` placeholder exists; Solar System Scope provides a ring alpha texture
   - What's unclear: Does the Solar System Scope ring texture use PNG alpha channel or is transparency encoded in grayscale luminance? This affects whether `alphaMap` or `map` + `transparent` is the right setup.
   - Recommendation: Download the texture and inspect in an image editor. If it has actual alpha: use `alphaMap={texture}`. If grayscale: use `alphaMap={texture}` with `alphaTest={0.1}`.

2. **SceneContext speed/isPaused vs. Zustand store**
   - What we know: `SceneContext` already has `speed`, `isPaused`, `SET_SPEED`, and `TOGGLE_PAUSE`. A new Zustand store would duplicate this.
   - What's unclear: Should the plan migrate `speed`/`isPaused` out of `SceneContext` to Zustand, or keep SceneContext for UI and only add a Zustand store for animation reads?
   - Recommendation: Keep both — `SceneContext` drives UI components (no change to existing code), and a new Zustand store syncs speed/isPaused for `useFrame` reads. SceneContext dispatch also updates the Zustand store. Clean separation: Context = UI reactivity, Zustand = frame-loop reads.

3. **Galilean moon textures**
   - What we know: `planets.js` has no moon texture paths, `constants.js` has no moon texture paths
   - What's unclear: Should Galilean moons have real textures or solid colors for Phase 2?
   - Recommendation: Solid colors for Phase 2 (no additional textures needed). `TEXTURE_PATHS` blocker would cascade. Phase 2 success criteria doesn't require textured moons — just "4 Galilean moons orbiting Jupiter."

4. **AsteroidBelt `useFrame` performance at 2000 instances**
   - What we know: R3F docs say "no more than 1000 draw calls" — InstancedMesh is 1 draw call. The concern is the JavaScript forEach loop updating 2000 matrices per frame.
   - What's unclear: Is 2000-iteration JS loop + 2000 setMatrixAt calls a bottleneck at 60fps?
   - Recommendation: Start with 2000. Add r3f-perf monitoring (already in devDependencies). If frame time exceeds 8ms from asteroid belt, reduce to 1000 or simplify orbit math (pre-computed sin/cos tables).

---

## Sources

### Primary (HIGH confidence)
- `@react-three/fiber` v9.5.0 installed source — `dist/declarations/src/core/hooks.d.ts` (useFrame signature), `store.d.ts` (RootState, RenderCallback)
- `@react-three/drei` v10.7.7 installed source — `core/Texture.d.ts` (useTexture), `core/Texture.js` (useTexture implementation), `core/Line.d.ts` (Line props), `core/Line.js` (Line implementation), `core/Instances.d.ts` (Instances API)
- `three` v0.183.1 installed source — `src/objects/InstancedMesh.js` (setMatrixAt, instanceMatrix, needsUpdate)
- `zustand` v5.0.11 installed source — `vanilla.d.ts` (createStore, getState, subscribe), `react.d.ts` (create, UseBoundStore)
- R3F Performance Pitfalls — `r3f.docs.pmnd.rs/advanced/pitfalls` — useFrame patterns, Zustand getState inside useFrame, avoid setState in loops
- R3F Basic Animations — `r3f.docs.pmnd.rs/tutorials/basic-animations` — useFrame ref mutation pattern

### Secondary (MEDIUM confidence)
- Solar System Scope textures page — `solarsystemscope.com/textures` — CC-BY 4.0 license confirmed, all planet textures available at 2K and 8K
- Three.js forum: Applying texture to RingGeometry — `discourse.threejs.org/t/applying-a-texture-to-a-ringgeometry/9990` — UV remap confirmed
- Three.js GitHub Issue #18120 — RingGeometry texture mapping — UV polar coordinate fix confirmed
- Three.js forum: Rendering a texture for RingGeometry — `discourse.threejs.org/t/rendering-a-texture-for-ringgeometry/57478` — UV atan2 alternative + CylinderGeometry alternative
- Three.js forum: How to fix z-fighting of lines — `discourse.threejs.org/t/how-to-fix-z-fighting-of-lines/53510` — depthTest:false + renderOrder solution confirmed
- R3F discussion #761 — Minimal InstancedMesh example — Object3D scratch + setMatrixAt pattern confirmed

### Tertiary (LOW confidence)
- Venus atmosphere glow technique — discourse.threejs.org forum thread referenced a secondary thread; BackSide + AdditiveBlending pattern is widely cited but specific opacity/scale values require tuning.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified from installed node_modules
- Architecture: HIGH — useFrame, zustand getState, InstancedMesh patterns verified from installed source + official docs
- Texture blocker: HIGH — verified placeholder files (1×1 pixels), Solar System Scope source confirmed
- Saturn UV remap: HIGH — verified in Three.js GitHub issues and forum
- Pitfalls: HIGH — all from official R3F docs or verified Three.js sources
- Venus atmosphere: MEDIUM — technique confirmed, parameters require tuning
- Cloud texture format: MEDIUM — depends on actual downloaded file format

**Research date:** 2026-02-24
**Valid until:** 2026-03-26 (stable libraries — 30 days)
