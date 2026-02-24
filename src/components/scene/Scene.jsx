import Sun from './Sun'
import Planet from './Planet'
import OrbitLine from './OrbitLine'
import { PLANETS } from '../../data/planets'

// ─── Scene ────────────────────────────────────────────────────────────────────
// Root scene component — assembles all celestial bodies and orbit path lines.
//
// Structure:
//   <ambientLight>   — faint fill so shadowed planet sides aren't pitch black
//   <Sun />          — emissive sphere + PointLight at origin
//   {PLANETS.map}    — each planet + its orbit line in a shared group
//
// Each planet/orbit pair is wrapped in a <group key={planet.id}> so React
// reconciles them as stable units. The Planet component handles its own
// orbital positioning internally via useFrame.
//
// Plan 02-02 additions mount INSIDE Planet's group (rings, moons, clouds).
// This file stays clean — only the top-level assembly.

export default function Scene() {
  return (
    <>
      {/* Faint ambient fill — prevents fully dark shadowed hemisphere */}
      {/* Intentionally low: the Sun's PointLight should dominate */}
      <ambientLight intensity={0.08} />

      {/* The Sun — emissive sphere + illuminating PointLight */}
      <Sun />

      {/* All 9 planetary bodies (Mercury through Pluto) with orbit lines */}
      {PLANETS.map((planet) => (
        <group key={planet.id}>
          <Planet data={planet} />
          <OrbitLine radius={planet.distance} />
        </group>
      ))}
    </>
  )
}
