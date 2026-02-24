import { createContext, useContext, useReducer } from 'react'

// ─── State shape ──────────────────────────────────────────────────────────────
const initialState = {
  selectedPlanet: null, // string | null — id of the currently focused planet
  hoveredPlanet: null,  // string | null — id of the planet under the cursor
  speed: 1,             // number (0–100) — orbital animation speed multiplier
  isPaused: false,      // boolean — whether orbital animation is paused
  cameraMode: 'overview', // 'overview' | 'focused'
  isLoaded: false,      // boolean — set true by LoadingScreen after assets are ready
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function sceneReducer(state, action) {
  switch (action.type) {
    case 'SELECT_PLANET':
      return {
        ...state,
        selectedPlanet: action.payload,
        cameraMode: action.payload ? 'focused' : 'overview',
      }
    case 'HOVER_PLANET':
      return { ...state, hoveredPlanet: action.payload }
    case 'SET_SPEED':
      return { ...state, speed: action.payload }
    case 'TOGGLE_PAUSE':
      return { ...state, isPaused: !state.isPaused }
    case 'SET_LOADED':
      return { ...state, isLoaded: action.payload }
    default:
      return state
  }
}

// ─── Two separate contexts to avoid re-renders ───────────────────────────────
// Components that only dispatch (e.g., buttons) won't re-render on state changes
const SceneStateContext = createContext(null)
const SceneDispatchContext = createContext(null)

// ─── Provider ─────────────────────────────────────────────────────────────────
export function SceneProvider({ children }) {
  const [state, dispatch] = useReducer(sceneReducer, initialState)

  return (
    <SceneDispatchContext.Provider value={dispatch}>
      <SceneStateContext.Provider value={state}>
        {children}
      </SceneStateContext.Provider>
    </SceneDispatchContext.Provider>
  )
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useSceneContext() {
  const context = useContext(SceneStateContext)
  if (context === null) {
    throw new Error('useSceneContext must be used within a SceneProvider')
  }
  return context
}

export function useSceneDispatch() {
  const context = useContext(SceneDispatchContext)
  if (context === null) {
    throw new Error('useSceneDispatch must be used within a SceneProvider')
  }
  return context
}
