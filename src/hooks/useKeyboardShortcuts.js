import { useEffect } from 'react'
import { PLANETS } from '../data/planets'
import { useSceneDispatch } from '../context/SceneContext'
import { useSceneStore } from '../store/sceneStore'

// ─── useKeyboardShortcuts ─────────────────────────────────────────────────────
// Global keyboard handler for scene navigation.
//
// Bindings:
//   1–9   → SELECT_PLANET for the nth planet (Mercury = 1, Pluto = 9)
//   Space → TOGGLE_PAUSE (SceneContext for UI + Zustand for animation loop)
//   Esc   → SELECT_PLANET null (return to overview)
//
// Guard: skips handling when focus is inside an INPUT or TEXTAREA so users
// can type without accidentally triggering shortcuts.
//
// Cleanup: removes listener on unmount to prevent memory leaks.

export function useKeyboardShortcuts() {
  const dispatch = useSceneDispatch()

  useEffect(() => {
    function handleKeyDown(e) {
      // Skip if user is typing in a form field
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const key = e.key

      // 1–9: jump to corresponding planet
      if (key >= '1' && key <= '9') {
        const index = parseInt(key, 10) - 1
        const planet = PLANETS[index]
        if (planet) {
          dispatch({ type: 'SELECT_PLANET', payload: planet.id })
        }
        return
      }

      // Space: pause/resume orbital animation
      if (key === ' ') {
        e.preventDefault() // prevent page scroll
        // Toggle both contexts so UI and animation loop stay in sync
        dispatch({ type: 'TOGGLE_PAUSE' })
        useSceneStore.getState().togglePause()
        return
      }

      // Escape: return to overview
      if (key === 'Escape') {
        dispatch({ type: 'SELECT_PLANET', payload: null })
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch])
}
