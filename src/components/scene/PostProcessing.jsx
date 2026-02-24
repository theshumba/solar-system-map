import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

// ─── PostProcessing ───────────────────────────────────────────────────────────
// EffectComposer with two effects:
//   - Bloom: luminanceThreshold={0.9} — PHASE 1 LOCK. Only the emissive Sun
//     exceeds this threshold; planets never glow. DO NOT lower this value.
//   - Vignette: darkens edges for cinematic depth-of-field feel.
export default function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.9}
        luminanceSmoothing={0.025}
        mipmapBlur
        intensity={1.5}
        radius={0.85}
      />
      <Vignette offset={0.3} darkness={0.6} eskil={false} />
    </EffectComposer>
  )
}
