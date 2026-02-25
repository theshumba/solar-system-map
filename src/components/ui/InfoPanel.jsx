import { useEffect, useState, useRef } from 'react'
import { useSceneContext } from '../../context/SceneContext'
import { useSceneDispatch } from '../../context/SceneContext'
import { PLANETS, SUN } from '../../data/planets'

// ─── CompositionChart ─────────────────────────────────────────────────────────
// Animated bar chart for a planet's composition array.
// Animation pattern: reset to 0% width on each composition change, then a
// rAF guarantees a paint at 0% before the CSS transition fires to final width.
// Uses transition-[width] (NOT transition) — Tailwind default transition
// does NOT include width, so we must target it explicitly.

function CompositionChart({ composition }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setAnimated(false)
    const raf = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(raf)
  }, [composition])

  if (!composition || composition.length === 0) return null

  return (
    <section>
      <h3 className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-3">
        Composition
      </h3>
      <div className="flex flex-col gap-2.5">
        {composition.map(({ name, percent }) => (
          <div key={name} className="flex flex-col gap-1">
            {/* Label row */}
            <div className="flex justify-between items-baseline">
              <span className="text-white/60 text-[11px] font-medium">{name}</span>
              <span className="text-white/35 text-[10px] tabular-nums">{percent}%</span>
            </div>
            {/* Bar track */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              {/* Animated fill */}
              <div
                className="h-full bg-blue-400/70 rounded-full transition-[width] duration-700 ease-out"
                style={{ width: animated ? `${percent}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── PLANET_MAP ───────────────────────────────────────────────────────────────
// Module-level lookup by planet id — zero cost per render, computed once.
const PLANET_MAP = {}
PLANET_MAP[SUN.id] = SUN
for (const planet of PLANETS) {
  PLANET_MAP[planet.id] = planet
}

// ─── StatRow ──────────────────────────────────────────────────────────────────
function StatRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-white/8">
      <span className="text-white/40 text-[10px] uppercase tracking-widest font-medium">
        {label}
      </span>
      <span className="text-white/90 text-xs leading-relaxed">
        {value}
      </span>
    </div>
  )
}

// ─── InfoPanel ────────────────────────────────────────────────────────────────
// Persistent DOM sidebar that slides in/out via CSS transform.
// Translate pattern: translate-x-full (hidden) → translate-x-0 (visible)
// transition-transform duration-300 provides smooth cinematic slide.
//
// Fun facts carousel: cycles every 4 seconds via setInterval, reset on planet
// switch so new body always starts at fact index 0.
//
// pointer-events-auto re-enables events on this element (parent has none).
// overflow-y-auto allows the panel to scroll for planets with many stats.
//
// z-20 ensures the panel sits above the Canvas (z-0) and overlay root (z-10).

const FACT_INTERVAL_MS = 4000

export default function InfoPanel() {
  const { selectedPlanet } = useSceneContext()
  const dispatch = useSceneDispatch()

  // Local body data resolved from selectedPlanet id
  const body = selectedPlanet ? PLANET_MAP[selectedPlanet] ?? null : null

  // Fun facts carousel state — index into body.funFacts array
  const [factIndex, setFactIndex] = useState(0)
  const intervalRef = useRef(null)

  // Reset carousel on body switch, start interval
  useEffect(() => {
    setFactIndex(0)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (body && body.funFacts && body.funFacts.length > 1) {
      intervalRef.current = setInterval(() => {
        setFactIndex((prev) => (prev + 1) % body.funFacts.length)
      }, FACT_INTERVAL_MS)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [selectedPlanet]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    dispatch({ type: 'SELECT_PLANET', payload: null })
  }

  const isVisible = Boolean(body)

  return (
    <div
      className={[
        'absolute top-0 right-0 h-full w-80',
        'bg-black/80 backdrop-blur-sm',
        'flex flex-col',
        'pointer-events-auto',
        'transition-transform duration-300 ease-in-out',
        'z-20',
        isVisible ? 'translate-x-0' : 'translate-x-full',
      ].join(' ')}
    >
      {body && (
        <>
          {/* ── Header ───────────────────────────────────────────────────────── */}
          <div className="relative flex items-start justify-between px-5 pt-6 pb-4 border-b border-white/10">
            <div className="flex flex-col gap-1 pr-8">
              <h2 className="text-white text-lg font-semibold leading-tight tracking-wide">
                {body.name}
              </h2>
              {body.nickname && (
                <p className="text-white/45 text-xs uppercase tracking-widest">
                  {body.nickname}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              aria-label="Close info panel"
              className={[
                'absolute top-5 right-4',
                'w-7 h-7 flex items-center justify-center',
                'rounded-full border border-white/15',
                'text-white/50 hover:text-white hover:border-white/35',
                'transition-colors duration-150',
                'text-sm leading-none',
              ].join(' ')}
            >
              X
            </button>
          </div>

          {/* ── Scrollable body ──────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

            {/* Stats */}
            <section>
              <h3 className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-1">
                Stats
              </h3>
              <div className="flex flex-col">
                {Object.entries(body.stats).map(([key, value]) => (
                  <StatRow
                    key={key}
                    label={key
                      // camelCase → readable label: e.g. distanceFromSun → Distance From Sun
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (s) => s.toUpperCase())}
                    value={value}
                  />
                ))}
              </div>
            </section>

            {/* Fun fact carousel */}
            {body.funFacts && body.funFacts.length > 0 && (
              <section>
                <h3 className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">
                  Did You Know?
                </h3>
                <div className="relative bg-white/5 rounded-lg px-4 py-3 min-h-[80px] flex flex-col justify-between gap-3">
                  <p className="text-white/80 text-xs leading-relaxed italic">
                    {body.funFacts[factIndex]}
                  </p>
                  {/* Dot indicators */}
                  {body.funFacts.length > 1 && (
                    <div className="flex gap-1.5 items-center">
                      {body.funFacts.map((_, i) => (
                        <span
                          key={i}
                          className={[
                            'inline-block rounded-full transition-all duration-300',
                            i === factIndex
                              ? 'w-3 h-1.5 bg-white/70'
                              : 'w-1.5 h-1.5 bg-white/20',
                          ].join(' ')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Notable moons */}
            {body.notableMoons && body.notableMoons.length > 0 && (
              <section>
                <h3 className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">
                  Notable Moons
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {body.notableMoons.map((moon) => (
                    <span
                      key={moon}
                      className={[
                        'inline-block px-2.5 py-1 rounded-full',
                        'bg-white/8 border border-white/10',
                        'text-white/65 text-[11px] font-medium',
                      ].join(' ')}
                    >
                      {moon}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Composition chart */}
            <CompositionChart composition={body.composition} />

          </div>
        </>
      )}
    </div>
  )
}
