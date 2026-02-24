import { AdditiveBlending } from 'three'

// ─── VenusAtmosphere ──────────────────────────────────────────────────────────
// Renders a faint atmospheric glow halo around Venus using the BackSide +
// AdditiveBlending technique — no custom shader required.
//
// How the effect works:
//   A sphere slightly larger than Venus is rendered with BackSide (interior
//   faces face outward from the viewer's perspective). Combined with
//   AdditiveBlending, this creates a rim-glow effect that resembles atmospheric
//   haze. AdditiveBlending brightens whatever is behind the sphere, so the
//   atmosphere appears to glow rather than occlude.
//
// meshBasicMaterial (not Standard):
//   Basic ignores all lighting — this is intentional. The atmosphere glow is
//   a pure visual effect that should not react to the Sun's PointLight.
//
// Props:
//   radius — the planet sphere radius to scale the atmosphere shell around

export default function VenusAtmosphere({ radius }) {
  return (
    <mesh>
      <sphereGeometry args={[radius * 1.08, 32, 32]} />
      <meshBasicMaterial
        color="#e8cda0"
        side={1}                      // THREE.BackSide — renders interior faces
        transparent={true}
        opacity={0.15}
        blending={AdditiveBlending}   // brightens behind, does not occlude
        depthWrite={false}
      />
    </mesh>
  )
}
