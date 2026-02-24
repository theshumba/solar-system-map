import { useMemo } from 'react'
import { Line } from '@react-three/drei'

// ─── OrbitLine ────────────────────────────────────────────────────────────────
// Faint orbital path circle rendered using drei's Line (Line2 + LineMaterial
// under the hood — supports configurable pixel-width unlike raw THREE.Line).
//
// Z-fighting prevention (belt-and-suspenders):
//   - Y=0.01 lifts points slightly above the XZ orbital plane
//   - depthTest={false} renders the line on top of all geometry regardless
// Both together are the most reliable approach per Three.js forum research.

const SEGMENTS = 128

export default function OrbitLine({ radius, color = '#334455', opacity = 0.3 }) {
  const points = useMemo(() => {
    const pts = []
    for (let i = 0; i <= SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2
      pts.push([
        Math.cos(angle) * radius,
        0.01,  // slight Y offset to prevent z-fighting
        Math.sin(angle) * radius,
      ])
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
      depthTest={false}
    />
  )
}
