import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useSceneStore } from '../../store/sceneStore'

// ─── Planet ───────────────────────────────────────────────────────────────────
// Reusable component for any planet body. Receives a data object matching the
// shape of a PLANETS entry from planets.js.
//
// Two-level scene graph for clean separation of concerns:
//   <group ref={groupRef}>    — handles orbital positioning (updated in useFrame)
//     <mesh ref={meshRef}>    — handles axial tilt (static rotation.z) + self-rotation
//
// Orbital animation pattern (accumulated angle, not elapsedTime):
//   - angleRef accumulates delta*rate*speed each frame
//   - This correctly handles pause: paused → no accumulation → no position jump on resume
//   - elapsedTime-based approach causes jumps because elapsedTime includes paused time
//
// Zustand read pattern:
//   - useSceneStore.getState() inside useFrame — synchronous, zero React overhead
//   - Never useSceneStore() hook inside useFrame — would cause re-render cascade

export default function Planet({ data }) {
  const texture = useTexture(data.texture)

  const groupRef = useRef()  // orbital group — position set by useFrame
  const meshRef = useRef()   // planet mesh — axial tilt + self-rotation

  // Pre-compute animation constants (depend on props, stable across renders)
  // ORBITAL_RATE: radians per Earth-day
  const ORBITAL_RATE = (2 * Math.PI) / (data.orbitalPeriod * 365.25)
  // SELF_ROT_RATE: radians per second (rotationPeriod is in Earth-days → ×86400 → seconds)
  const SELF_ROT_RATE = (2 * Math.PI) / (Math.abs(data.rotationPeriod) * 86400)
  // ROT_SIGN: Venus (-243.02) and Pluto (-6.387) have retrograde rotation
  const ROT_SIGN = data.rotationPeriod < 0 ? -1 : 1

  // Accumulated orbital angle — random start so planets are spread around the Sun
  const angleRef = useRef(Math.random() * Math.PI * 2)

  useFrame((_state, delta) => {
    if (!groupRef.current || !meshRef.current) return

    // Read animation state from Zustand — no React re-render triggered
    const { speed, isPaused } = useSceneStore.getState()

    if (!isPaused) {
      // Accumulate orbital angle (radians per Earth-day × delta × speed)
      // delta is in seconds; orbital rate is per Earth-day (86400s)
      // delta * 86400 would be too slow — speed multiplier compensates for visual scale
      angleRef.current += delta * ORBITAL_RATE * speed
    }

    // Update orbital position on the group (XZ plane orbit)
    const angle = angleRef.current
    groupRef.current.position.set(
      Math.cos(angle) * data.distance,
      0,
      Math.sin(angle) * data.distance
    )

    if (!isPaused) {
      // Self-rotation on the planet mesh Y axis
      meshRef.current.rotation.y += ROT_SIGN * delta * SELF_ROT_RATE * speed
    }
  })

  return (
    // Orbital group — position is purely orbital, no rotation applied here
    <group ref={groupRef}>
      {/* Axial tilt on Z axis — applied once in JSX, stable across frames */}
      {/* Tilt is relative to the orbital plane, matching astronomical convention */}
      <mesh ref={meshRef} rotation={[0, 0, (data.axialTilt * Math.PI) / 180]}>
        <sphereGeometry args={[data.radius, 32, 32]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      {/* Plan 02-02: additional children (rings, clouds, moons) mount here */}
    </group>
  )
}
