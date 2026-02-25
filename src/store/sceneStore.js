import { create } from 'zustand'

// ─── Scene animation store ─────────────────────────────────────────────────────
// This store is the animation-loop source of truth for speed and isPaused.
//
// Why Zustand instead of SceneContext for animation state:
//   - SceneContext uses React Context + useReducer → every dispatch triggers React re-renders
//   - useFrame callbacks must NOT cause React re-renders (runs 60×/s)
//   - Zustand's `getState()` is synchronous and non-reactive — safe inside useFrame
//
// Usage pattern:
//   In useFrame:  const { speed, isPaused } = useSceneStore.getState()
//   In UI:        const speed = useSceneStore((s) => s.speed)
//
// Note: SceneContext still holds speed/isPaused for UI reactivity — this store
// is the animation-loop read source only.
//
// ─── Planet ref registry ──────────────────────────────────────────────────────
// planetRefs holds live Three.js group refs keyed by planet id.
// Used by CameraController to getWorldPosition() at fly-to time.
// Registered by each Planet component on mount, unregistered on unmount.
export const useSceneStore = create((set) => ({
  speed: 1,
  isPaused: false,
  setSpeed: (speed) => set({ speed }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

  // ── Planet ref registry ──────────────────────────────────────────────────
  // Key: planet id (string), Value: React ref object (groupRef)
  planetRefs: {},
  registerPlanetRef: (id, ref) =>
    set((s) => ({ planetRefs: { ...s.planetRefs, [id]: ref } })),
  unregisterPlanetRef: (id) =>
    set((s) => {
      const next = { ...s.planetRefs }
      delete next[id]
      return { planetRefs: next }
    }),
}))
