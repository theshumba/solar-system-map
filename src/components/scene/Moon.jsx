import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSceneStore } from '../../store/sceneStore'

// ─── Moon ─────────────────────────────────────────────────────────────────────
// Reusable orbiting moon component — used for Earth's Moon and all 4 Galilean
// moons of Jupiter.
//
// Must be mounted as a child of the parent planet's orbital group so that it
// inherits the parent's world position. The moon's position is then offset
// from the parent's local origin (0,0,0) using its own orbital radius.
//
// Animation pattern (same as Planet.jsx):
//   - Accumulated angleRef — not clock.elapsedTime — so pause works correctly
//   - useSceneStore.getState() — direct Zustand read, no React re-render
//   - Random start angle so all moons start at different orbital positions
//
// Props:
//   radius        — moon sphere radius (scene units)
//   distance      — orbital radius from parent planet center (scene units)
//   orbitalPeriod — orbital period in Earth years (drives orbital rate)
//   color         — solid color for the moon mesh (no textures in Phase 2)

export default function Moon({
  radius,
  distance,
  orbitalPeriod,
  color = '#aaaaaa',
}) {
  const meshRef = useRef()

  // Orbital rate: radians per Earth-day (delta is in seconds, no ×86400 needed
  // because the speed multiplier compensates for visual timescale)
  const ORBITAL_RATE = (2 * Math.PI) / (orbitalPeriod * 365.25)

  // Random start angle — spreads moons around their orbit on first render
  const angleRef = useRef(Math.random() * Math.PI * 2)

  useFrame((_state, delta) => {
    if (!meshRef.current) return
    const { speed, isPaused } = useSceneStore.getState()

    if (!isPaused) {
      angleRef.current += delta * ORBITAL_RATE * speed
    }

    const angle = angleRef.current
    meshRef.current.position.set(
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance
    )
  })

  return (
    // Position is set imperatively in useFrame; initial position is overridden
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}
