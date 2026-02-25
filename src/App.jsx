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
          {/* NavSidebar — left navigation list; isOpen controls mobile slide */}
          <NavSidebar isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
          {/* TimelineControl — speed slider + play/pause at bottom center */}
          <TimelineControl />
          {/* Footer — AU Brussel branding badge at bottom-right */}
          <Footer />

          {/* Hamburger button — mobile only (md:hidden hides on desktop).
              Toggles the NavSidebar. Shows ☰ when closed, × when open.
              z-40 sits above the NavSidebar (z-30) so it's always tappable. */}
          <button
            onClick={() => setIsNavOpen((prev) => !prev)}
            aria-label={isNavOpen ? 'Close navigation' : 'Open navigation'}
            className={[
              'fixed top-4 left-4 z-40 md:hidden pointer-events-auto',
              'w-10 h-10 flex items-center justify-center rounded-lg',
              'bg-black/60 backdrop-blur-sm',
              'text-white/70 hover:text-white transition-colors duration-150',
            ].join(' ')}
          >
            {isNavOpen ? (
              // Close icon (×)
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              // Hamburger icon (☰)
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

      </div>
    </SceneProvider>
  )
}
