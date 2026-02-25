import { useSceneDispatch } from '../../context/SceneContext'
import { useSceneStore } from '../../store/sceneStore'

// ─── TimelineControl ──────────────────────────────────────────────────────────
// Speed slider + play/pause toggle positioned at the bottom center of the
// viewport.
//
// Dual-dispatch pattern (same as useKeyboardShortcuts for TOGGLE_PAUSE):
//   - SceneContext dispatch: keeps UI state in sync (InfoPanel, overlays)
//   - Zustand setSpeed / togglePause: keeps animation-loop reads in sync
//
// Speed range: 0–100x (integer steps). Default: 1.
// Play/pause uses unicode ▶ / ⏸ symbols.
//
// pointer-events-auto re-enables events (parent overlay has pointer-events-none).

export default function TimelineControl() {
  const dispatch = useSceneDispatch()
  const speed = useSceneStore((s) => s.speed)
  const isPaused = useSceneStore((s) => s.isPaused)

  function handleSpeedChange(e) {
    const value = Number(e.target.value)
    dispatch({ type: 'SET_SPEED', payload: value })
    useSceneStore.getState().setSpeed(value)
  }

  function handlePlayPause() {
    dispatch({ type: 'TOGGLE_PAUSE' })
    useSceneStore.getState().togglePause()
  }

  return (
    <div
      className={[
        'absolute bottom-4 left-1/2 -translate-x-1/2',
        'pointer-events-auto',
        'bg-black/60 backdrop-blur-sm rounded-full',
        'px-4 py-2 flex items-center gap-3',
        'select-none',
      ].join(' ')}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Play / pause button */}
      <button
        onClick={handlePlayPause}
        aria-label={isPaused ? 'Resume animation' : 'Pause animation'}
        className={[
          'w-7 h-7 flex items-center justify-center flex-shrink-0',
          'rounded-full border border-white/15',
          'text-white/70 hover:text-white hover:border-white/35',
          'transition-colors duration-150 text-sm leading-none',
        ].join(' ')}
      >
        {isPaused ? '▶' : '⏸'}
      </button>

      {/* Speed slider */}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={speed}
        onChange={handleSpeedChange}
        aria-label="Simulation speed"
        className="w-40 accent-blue-400 cursor-pointer"
      />

      {/* Speed label */}
      <span className="text-white/50 text-[11px] font-medium w-10 text-right tabular-nums">
        {speed}x
      </span>
    </div>
  )
}
