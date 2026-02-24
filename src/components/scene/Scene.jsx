import Sun from './Sun'
import Planet from './Planet'
import OrbitLine from './OrbitLine'
import SaturnRings from './SaturnRings'
import EarthClouds from './EarthClouds'
import Moon from './Moon'
import VenusAtmosphere from './VenusAtmosphere'
import GalileanMoons from './GalileanMoons'
import AsteroidBelt from './AsteroidBelt'
import { PLANETS } from '../../data/planets'
import { PLANET_RADII } from '../../data/constants'

// ─── Scene ────────────────────────────────────────────────────────────────────
// Root scene component — assembles all celestial bodies, orbit path lines,
// and extended body features added in Plan 02-02.
//
// Structure:
//   <ambientLight>   — faint fill so shadowed planet sides aren't pitch black
//   <Sun />          — emissive sphere + PointLight at origin
//   {PLANETS.map}    — each planet + its orbit line in a shared group
//     <Planet>       — planet body with extended children per planet
//       Extended features mounted as children of specific planets:
//         Venus  → <VenusAtmosphere>
//         Earth  → <EarthClouds> + <Moon>
//         Saturn → <SaturnRings>
//         Jupiter → <GalileanMoons>
//   <AsteroidBelt /> — standalone sibling between Mars and Jupiter orbits
//
// Earth's Moon orbital distance uses PLANET_RADII.earth * 3.5 for visual
// clarity — ensures the Moon is clearly outside Earth's sphere.
//
// Saturn ring dimensions are scaled relative to PLANET_RADII.saturn:
//   inner = saturn radius * 1.4 (ring begins just outside planet)
//   outer = saturn radius * 2.4 (ring extends to 2.4× planet radius)

const EARTH_MOON = {
  radius: PLANET_RADII.earth * 0.27,
  distance: PLANET_RADII.earth * 3.5,
  orbitalPeriod: 27.32 / 365.25,   // 27.32 Earth days → years
  color: '#aaaaaa',
}

export default function Scene() {
  return (
    <>
      {/* Faint ambient fill — prevents fully dark shadowed hemisphere */}
      <ambientLight intensity={0.08} />

      {/* The Sun — emissive sphere + illuminating PointLight */}
      <Sun />

      {/* All 9 planetary bodies with orbit lines and extended features */}
      {PLANETS.map((planet) => (
        <group key={planet.id}>
          <Planet data={planet}>
            {/* Venus — atmospheric glow halo */}
            {planet.id === 'venus' && (
              <VenusAtmosphere radius={planet.radius} />
            )}

            {/* Earth — cloud layer + orbiting Moon */}
            {planet.id === 'earth' && (
              <>
                <EarthClouds radius={planet.radius} />
                <Moon
                  radius={EARTH_MOON.radius}
                  distance={EARTH_MOON.distance}
                  orbitalPeriod={EARTH_MOON.orbitalPeriod}
                  color={EARTH_MOON.color}
                />
              </>
            )}

            {/* Saturn — ring system */}
            {planet.id === 'saturn' && (
              <SaturnRings
                innerRadius={planet.radius * 1.4}
                outerRadius={planet.radius * 2.4}
              />
            )}

            {/* Jupiter — 4 Galilean moons */}
            {planet.id === 'jupiter' && <GalileanMoons />}
          </Planet>
          <OrbitLine radius={planet.distance} />
        </group>
      ))}

      {/* Asteroid belt — between Mars and Jupiter orbits */}
      <AsteroidBelt />
    </>
  )
}
