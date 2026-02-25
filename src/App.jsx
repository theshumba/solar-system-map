import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import { SceneProvider } from './context/SceneContext'
import LoadingScreen from './components/ui/LoadingScreen'
import InfoPanel from './components/ui/InfoPanel'
import NavSidebar from './components/ui/NavSidebar'
import TimelineControl from './components/ui/TimelineControl'
import Footer from './components/ui/Footer'
import Starfield from './components/scene/Starfield'
import PostProcessing from './components/scene/PostProcessing'
import Scene from './components/scene/Scene'

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
// Inside <Canvas> structure:
//   [outside Suspense]
//     <Starfield />       — procedural, no assets, renders immediately
//   <Suspense>
//     <PostProcessing />  — needs WebGL context to be ready
//     <Preload all />     — kicks off texture loading, feeds useProgress()
//     (future: <Scene />) — planet meshes, orbit rings, etc.
//   </Suspense>
//
// DOM layer:
//   <LoadingScreen />     — reads useProgress(), fades out when assets loaded

export default function App() {
  // isNavOpen state is lifted here for mobile hamburger toggle (wired in 04-02).
  const [isNavOpen, setIsNavOpen] = useState(false)

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
          {/* Starfield is OUTSIDE Suspense — procedural, no assets needed */}
          <Starfield />

          {/* Everything that needs assets goes inside Suspense */}
          <Suspense fallback={null}>
            <PostProcessing />
            <Scene />
            <Preload all />
          </Suspense>
        </Canvas>

        {/* ── 2D WORLD (DOM overlays) ──────────────────────────────────────── */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* LoadingScreen re-enables its own pointer-events while visible */}
          <LoadingScreen />
          {/* InfoPanel — persistent sidebar, slides in when a planet is selected */}
          <InfoPanel />
          {/* NavSidebar — left navigation list; isOpen controls mobile slide (04-02) */}
          <NavSidebar isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
          {/* TimelineControl — speed slider + play/pause at bottom center */}
          <TimelineControl />
          {/* Footer — AU Brussel branding badge at bottom-right */}
          <Footer />
        </div>

      </div>
    </SceneProvider>
  )
}
