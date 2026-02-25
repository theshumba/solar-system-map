import { SUN, PLANETS } from '../../data/planets'
import { useSceneContext } from '../../context/SceneContext'
import { usePlanetSelect } from '../../hooks/usePlanetSelect'

// ─── NavSidebar ───────────────────────────────────────────────────────────────
// Fixed sidebar on the left that lists the Sun + all 9 planets.
// Clicking any entry dispatches SELECT_PLANET via usePlanetSelect.
// Active highlight applied when selectedPlanet === body.id.
//
// Responsive layout:
//   Mobile (<768px):  slides off-screen left (-translate-x-full) by default.
//                     When isOpen=true → translate-x-0 slides it in.
//                     Auto-closes after planet selection via onClose callback.
//   Desktop (≥768px): md:translate-x-0 always pins the sidebar — isOpen has
//                     no visual effect because md:translate-x-0 overrides mobile.
//
// Touch isolation: onTouchStart/onTouchMove/onPointerDown stop propagation so
// dragging within the sidebar never rotates the 3D scene behind it.
//
// pointer-events-auto re-enables events (parent overlay has pointer-events-none).

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
        // Mobile: hidden by default, visible when isOpen. Desktop: always pinned.
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0',
        'flex flex-col',
      ].join(' ')}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
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
