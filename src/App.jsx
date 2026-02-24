import { Canvas } from '@react-three/fiber'
import { SceneProvider } from './context/SceneContext'

// ─── App ──────────────────────────────────────────────────────────────────────
// Architecture: SceneProvider wraps both the 3D world (Canvas) and the 2D world
// (DOM overlays). This allows any component in either layer to read/write scene
// state without prop drilling.
//
// Canvas/DOM split pattern:
// - Canvas: position absolute, fills viewport, z-0, touch-action:none
// - DOM: position absolute, fills viewport, z-10, pointer-events:none on root
//        (individual interactive elements re-enable pointer-events themselves)
//
// Plan 01-02 additions inside <Canvas>:
//   - <Suspense> + <Preload all /> for texture loading
//   - <Stars /> (drei) for procedural starfield
//   - <EffectComposer> with <Bloom> + <Vignette> for post-processing
//
// Plan 01-02 additions inside DOM layer:
//   - <LoadingScreen /> (shown until isLoaded === true)

export default function App() {
  return (
    <SceneProvider>
      <div className="relative w-screen h-screen bg-black overflow-hidden">

        {/* ── 3D WORLD ─────────────────────────────────────────────────────── */}
        <Canvas
          className="absolute inset-0"
          dpr={[1, 2]}
          // shadows intentionally disabled — PointLight shadow maps are prohibitively
          // expensive at solar system scale; ambient + emissive Sun covers all visual needs
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          camera={{
            position: [0, 50, 120],
            fov: 60,
            near: 0.1,
            far: 10000,
          }}
          style={{ touchAction: 'none' }}
        >
          {/* Plan 01-02: <Suspense>, <Stars />, <EffectComposer> go here */}
        </Canvas>

        {/* ── 2D WORLD (DOM overlays) ──────────────────────────────────────── */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Plan 01-02: <LoadingScreen /> goes here */}
          {/* Plan 03-02: <HoverLabel />, <InfoPanel /> go here */}
          {/* Plan 04-01: <NavSidebar />, <TimelineControl />, <Footer /> go here */}
        </div>

      </div>
    </SceneProvider>
  )
}
