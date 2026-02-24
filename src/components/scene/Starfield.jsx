import { Stars } from '@react-three/drei'

// ─── Starfield ────────────────────────────────────────────────────────────────
// Procedural starfield using drei's Stars primitive.
// Placed OUTSIDE <Suspense> in App.jsx so it renders immediately
// — no blank black void while assets load.
export default function Starfield() {
  return (
    <Stars
      radius={200}
      depth={60}
      count={8000}
      factor={4}
      saturation={0}
      fade
      speed={0.5}
    />
  )
}
