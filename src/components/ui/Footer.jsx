// ─── Footer ───────────────────────────────────────────────────────────────────
// AU Brussel branding badge, fixed at the bottom-right of the viewport.
// pointer-events-none so it never captures clicks or touches.
// Minimal styling — must not compete visually with the 3D scene.

export default function Footer() {
  return (
    <div className="fixed bottom-4 right-4 z-10 pointer-events-none">
      <span className="text-white/30 text-[10px] uppercase tracking-widest">
        Created by AU Brussel
      </span>
    </div>
  )
}
