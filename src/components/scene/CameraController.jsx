import { useEffect } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useSceneContext } from '../../context/SceneContext'
import { useSceneStore } from '../../store/sceneStore'
import { useCamera } from '../../hooks/useCamera'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { PLANETS } from '../../data/planets'

// ─── CameraController ─────────────────────────────────────────────────────────
// Owns all camera behaviour:
//   1. OrbitControls — free exploration mode (makeDefault exposes ref via R3F state)
//   2. GSAP fly-to   — triggered when selectedPlanet changes in SceneContext
//   3. Keyboard shortcuts — delegated to useKeyboardShortcuts
//
// Why makeDefault on OrbitControls:
//   R3F exposes controls via useThree((s) => s.controls) only when makeDefault is set.
//   useCamera reads controls this way so it can disable/re-enable OrbitControls
//   around the GSAP tween without prop drilling.
//
// Fly-to flow:
//   SceneContext.selectedPlanet changes
//   → useEffect fires
//   → looks up planetRef from Zustand store (groupRef = live Three.js ref)
//   → looks up planet data from PLANETS array
//   → calls flyTo(planetData, groupRef) or flyToOverview()
//
// Planet refs are registered by each Planet component via Zustand registerPlanetRef.

export default function CameraController() {
  const { selectedPlanet } = useSceneContext()
  const { flyTo, flyToOverview } = useCamera()

  // Install keyboard shortcuts (1-9, Space, Esc)
  useKeyboardShortcuts()

  useEffect(() => {
    if (selectedPlanet === null) {
      // No planet selected — fly back to overview
      flyToOverview()
    } else {
      // Look up the live group ref and planet data
      const planetRefs = useSceneStore.getState().planetRefs
      const groupRef = planetRefs[selectedPlanet]
      const planetData = PLANETS.find((p) => p.id === selectedPlanet)

      if (groupRef && planetData) {
        flyTo(planetData, groupRef)
      }
    }
    // flyTo and flyToOverview are stable useCallback refs — safe deps
  }, [selectedPlanet, flyTo, flyToOverview])

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={200}
    />
  )
}
