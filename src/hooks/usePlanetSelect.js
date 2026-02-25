import { useCallback } from 'react'
import { useSceneDispatch } from '../context/SceneContext'

// ─── usePlanetSelect ──────────────────────────────────────────────────────────
// Thin hook that wraps useSceneDispatch and returns a stable useCallback
// function accepting a planet id, dispatching SELECT_PLANET.
// Single import point for all planet-selection triggers across the UI.

export function usePlanetSelect() {
  const dispatch = useSceneDispatch()
  return useCallback(
    (id) => {
      dispatch({ type: 'SELECT_PLANET', payload: id })
    },
    [dispatch],
  )
}
