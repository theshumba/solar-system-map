import { Html } from '@react-three/drei'

// ─── HoverLabel ───────────────────────────────────────────────────────────────
// Three.js-space DOM label that appears above a planet when hovered.
//
// Rendering notes:
//   - drei Html with center=true anchors the element to the 3D position
//   - distanceFactor={60} scales the label relative to camera distance so it
//     stays readable without growing too large when zoomed in
//   - position=[0, radius*1.6, 0] places the label just above the planet sphere
//   - No occlude — label always renders regardless of other geometry
//   - No transform mode — HTML element stays facing the camera automatically
//   - pointer-events:none — label does not intercept mouse events (planet mesh
//     handles its own hover/click events beneath)

export default function HoverLabel({ name, radius }) {
  return (
    <Html
      center
      distanceFactor={60}
      position={[0, radius * 1.6, 0]}
    >
      <div
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '4px',
          padding: '3px 8px',
          color: '#ffffff',
          fontSize: '11px',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: '600',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </div>
    </Html>
  )
}
