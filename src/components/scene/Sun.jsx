import { useTexture } from '@react-three/drei'
import { SUN } from '../../data/planets'

// ─── Sun ──────────────────────────────────────────────────────────────────────
// The Sun is a static emissive sphere at the scene origin.
// It does not orbit — all other bodies orbit around it.
//
// Rendering notes:
// - emissiveMap + emissive + emissiveIntensity pushes luminance above Bloom
//   threshold (0.9), producing the characteristic solar glow from PostProcessing
// - PointLight with decay=0 ensures light reaches all planets regardless of
//   scene distance — no inverse-square falloff in compressed scene units
// - PointLight is a sibling of the mesh, NOT a child (children inherit position
//   in Three.js scene graph, but both should be at origin anyway)

export default function Sun() {
  const texture = useTexture(SUN.texture)

  return (
    <>
      {/* Sun surface */}
      <mesh>
        <sphereGeometry args={[SUN.radius, 64, 64]} />
        <meshStandardMaterial
          map={texture}
          emissive={SUN.emissiveColor}
          emissiveIntensity={SUN.emissiveIntensity}
          emissiveMap={texture}
        />
      </mesh>

      {/* PointLight at Sun position — illuminates all planets */}
      {/* decay=0: light doesn't fall off with distance (scene-scale lighting) */}
      <pointLight
        intensity={2}
        decay={0}
        position={[0, 0, 0]}
        color="#ffffff"
      />
    </>
  )
}
