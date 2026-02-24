import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useSceneStore } from '../../store/sceneStore'
import { TEXTURE_PATHS } from '../../data/constants'

// ─── EarthClouds ──────────────────────────────────────────────────────────────
// Renders a translucent cloud layer over Earth that self-rotates independently
// at a slightly slower rate than Earth's own surface rotation.
//
// Two-texture technique:
//   map={cloudTexture}      — renders the white cloud pattern
//   alphaMap={cloudTexture} — white areas = opaque clouds, dark = transparent
//   This makes the cloud texture its own alpha mask — no separate alpha file.
//
// Why depthWrite={false}:
//   Without this, the cloud sphere writes to the depth buffer and causes z-
//   fighting artifacts where the cloud shell intersects Earth's surface.
//
// Why a separate useFrame rotation (not tied to Earth's rotation):
//   Cloud layers rotate at a slightly different speed than the planet surface.
//   This independent motion adds visual life to Earth and is scientifically
//   accurate (wind drives cloud rotation, not just planetary rotation).
//
// Props:
//   radius — Earth's planet sphere radius (cloud shell = radius * 1.02)

export default function EarthClouds({ radius }) {
  const cloudRef = useRef()
  const cloudTexture = useTexture(TEXTURE_PATHS.earthClouds)

  useFrame((_state, delta) => {
    if (!cloudRef.current) return
    const { speed, isPaused } = useSceneStore.getState()
    if (!isPaused) {
      // Slightly slower rotation than Earth's surface — visually distinct
      cloudRef.current.rotation.y += delta * 0.05 * speed
    }
  })

  return (
    <mesh ref={cloudRef}>
      <sphereGeometry args={[radius * 1.02, 32, 32]} />
      <meshStandardMaterial
        map={cloudTexture}
        alphaMap={cloudTexture}   // cloud map doubles as its own alpha mask
        transparent={true}
        depthWrite={false}        // prevents z-fighting with Earth surface
        opacity={0.7}
      />
    </mesh>
  )
}
