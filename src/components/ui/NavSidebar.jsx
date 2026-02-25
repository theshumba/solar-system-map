import { SUN, PLANETS } from '../../data/planets'
import { useSceneContext } from '../../context/SceneContext'
import { usePlanetSelect } from '../../hooks/usePlanetSelect'

// ─── NavSidebar ───────────────────────────────────────────────────────────────
// Fixed sidebar on the left that lists the Sun + all 9 planets.
// Clicking any entry dispatches SELECT_PLANET via usePlanetSelect.
// Active highlight applied when selectedPlanet === body.id.
//
// isOpen / onClose props are accepted now; mobile toggle behavior
// (hamburger button, slide-out on small screens) is wired in Plan 04-02.
// For now, translate-x-0 is always applied so the sidebar is always visible.
//
// pointer-events-auto re-enables events (parent overlay has pointer-events-none).
// transition-transform duration-300 is present for the upcoming mobile animation.

const BODIES = [SUN, ...PLANETS]

export default function NavSidebar({ isOpen, onClose }) {
  const { selectedPlanet } = useSceneContext()
  const selectPlanet = usePlanetSelect()

  function handleSelect(id) {
    selectPlanet(id)
    if (onClose) onClose()
  }

  return (
    <div
      className={[
        'fixed top-0 left-0 h-full w-56',
        'bg-black/80 backdrop-blur-sm',
        'z-30',
        'pointer-events-auto',
        'overflow-y-auto',
        'transition-transform duration-300',
        'translate-x-0',
        'flex flex-col',
      ].join(' ')}
    >
      {/* Section header */}
      <div className="px-5 pt-6 pb-3">
        <span className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">
          Solar System
        </span>
      </div>

      {/* Body list */}
      <nav className="flex flex-col gap-0.5 px-2 pb-4">
        {BODIES.map((body) => {
          const isActive = selectedPlanet === body.id
          return (
            <button
              key={body.id}
              onClick={() => handleSelect(body.id)}
              className={[
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                'text-left transition-colors duration-150',
                isActive
                  ? 'bg-white/15 text-white/90'
                  : 'text-white/55 hover:bg-white/8 hover:text-white/80',
              ].join(' ')}
            >
              {/* Color swatch */}
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: body.color }}
              />
              {/* Planet name */}
              <span className="text-xs font-medium leading-tight truncate">
                {body.name}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
