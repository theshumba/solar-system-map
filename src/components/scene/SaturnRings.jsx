import { useMemo } from 'react'
import { RingGeometry, Vector3 } from 'three'
import { useTexture } from '@react-three/drei'
import { TEXTURE_PATHS } from '../../data/constants'

// ─── SaturnRings ──────────────────────────────────────────────────────────────
// Renders Saturn's ring system as a flat RingGeometry with UV remapping.
//
// Why UV remap is required:
//   Default RingGeometry UVs are wrong for radial textures — the default layout
//   maps the ring as a flat rectangle, not as a polar radial disk. Without
//   remapping, the texture appears smeared or shows as a solid colored band.
//   The fix: for each vertex, compute its normalized radial distance from
//   innerRadius (0) to outerRadius (1), then assign that as the U coordinate.
//
// Why depthWrite={false}:
//   Without this, the ring's depth buffer writes cause z-fighting with Saturn's
//   sphere where the ring passes through (or near) the planet's silhouette.
//   Disabling depth writes makes the ring render transparently over everything.
//
// Mount this as a direct child of the Saturn orbital group (not inside the
// planet mesh) so it inherits orbital position but NOT axial tilt rotation.
// Saturn's rings are oriented relative to the planet, not the ecliptic.
// For simplicity in Phase 2, we keep the ring horizontal (rotation-x only).

export default function SaturnRings({ innerRadius, outerRadius }) {
  const ringTexture = useTexture(TEXTURE_PATHS.saturnRing)

  // UV remap: default RingGeometry UVs are linear billboard — wrong for radial
  // textures. Remap so inner radius = U=0, outer radius = U=1 (polar mapping).
  const geometry = useMemo(() => {
    const geo = new RingGeometry(innerRadius, outerRadius, 128, 1)
    const pos = geo.attributes.position
    const uv = geo.attributes.uv
    const v3 = new Vector3()
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i)
      const normalized = (v3.length() - innerRadius) / (outerRadius - innerRadius)
      uv.setXY(i, normalized, 1)
    }
    return geo
  }, [innerRadius, outerRadius])

  return (
    // rotation-x rotates the ring from the default XY plane to horizontal XZ plane
    <mesh geometry={geometry} rotation-x={Math.PI / 2}>
      <meshBasicMaterial
        map={ringTexture}
        side={2}              // THREE.DoubleSide — visible from above and below
        transparent={true}
        depthWrite={false}    // CRITICAL — prevents z-fighting with Saturn sphere
        opacity={0.9}
      />
    </mesh>
  )
}
