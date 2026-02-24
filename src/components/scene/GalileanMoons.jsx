import Moon from './Moon'

// ─── GalileanMoons ────────────────────────────────────────────────────────────
// Renders the 4 Galilean moons of Jupiter: Io, Europa, Ganymede, and Callisto.
//
// These moons are discovered by Galileo in 1610 and are the four largest of
// Jupiter's 95 confirmed moons. They are visible to the naked eye in ideal
// conditions and are among the most scientifically interesting bodies in the
// solar system.
//
// Mount this component as a direct child of Jupiter's orbital group. The moons
// are then positioned relative to Jupiter's local origin (0,0,0) — no world
// position tracking needed.
//
// Orbital periods are in Earth days, converted to Earth years for Moon component.
// Distances are in scene units, sized for visual clarity at Jupiter's scale
// (Jupiter radius = 3.2 scene units).
//
// Solid colors only in Phase 2 — textures added in a future phase if needed.

const GALILEAN_MOONS = [
  {
    id: 'io',
    radius: 0.12,
    distance: 3.8,
    orbitalPeriod: 1.769 / 365.25,    // 1.769 Earth days → years
    color: '#e8c84a',                  // Io — yellowish sulfur volcanism
  },
  {
    id: 'europa',
    radius: 0.10,
    distance: 5.0,
    orbitalPeriod: 3.551 / 365.25,    // 3.551 Earth days → years
    color: '#c9b99a',                  // Europa — icy beige surface
  },
  {
    id: 'ganymede',
    radius: 0.16,
    distance: 6.8,
    orbitalPeriod: 7.155 / 365.25,    // 7.155 Earth days → years
    color: '#8a7e6f',                  // Ganymede — largest moon in solar system
  },
  {
    id: 'callisto',
    radius: 0.15,
    distance: 9.0,
    orbitalPeriod: 16.69 / 365.25,    // 16.69 Earth days → years
    color: '#5a5a5a',                  // Callisto — heavily cratered, dark
  },
]

export default function GalileanMoons() {
  return (
    <>
      {GALILEAN_MOONS.map((moon) => (
        <Moon
          key={moon.id}
          radius={moon.radius}
          distance={moon.distance}
          orbitalPeriod={moon.orbitalPeriod}
          color={moon.color}
        />
      ))}
    </>
  )
}
