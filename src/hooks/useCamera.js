import { useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import gsap from 'gsap'

// ─── useCamera ────────────────────────────────────────────────────────────────
// Provides flyTo and flyToOverview helpers that animate the R3F camera via GSAP.
//
// Design decisions:
//   - Module-level scratch vector: zero allocation in hot paths
//   - controls.enabled = false BEFORE tween starts — prevents OrbitControls
//     fighting the GSAP-driven camera during flight
//   - Two simultaneous tweens: camera.position + controls.target move together
//   - onUpdate calls controls.update() so damping stays in sync
//   - onComplete re-enables controls so user can orbit after arrival
//   - gsap.killTweensOf() prevents tween conflicts when quickly switching planets
//   - useCallback with [camera, controls] prevents unnecessary re-creations

// Module-level scratch vector — allocated once, never GC'd during animation
const _scratchVec = new Vector3()

export function useCamera() {
  const { camera } = useThree()
  // Access OrbitControls via the R3F controls state (set by makeDefault on OrbitControls)
  const controls = useThree((state) => state.controls)

  // ── flyTo ────────────────────────────────────────────────────────────────
  // Animates camera to a position near the given planet.
  // groupRef: the planet's orbital group ref (provides world position)
  // planetData: the PLANETS entry (provides radius for offset calculation)
  const flyTo = useCallback(
    (planetData, groupRef) => {
      if (!camera || !controls || !groupRef?.current) return

      // Get planet world position at call time (planet is moving!)
      groupRef.current.getWorldPosition(_scratchVec)
      const { x, y, z } = _scratchVec

      // Offset camera to sit near the planet but not inside it
      // min 8 units so small planets (Mercury) still get a clear view
      const offset = Math.max(planetData.radius * 8, 8)

      // Disable OrbitControls BEFORE tween — prevents control fighting
      controls.enabled = false

      // Kill any in-progress tweens to prevent conflicts
      gsap.killTweensOf(camera.position)
      gsap.killTweensOf(controls.target)

      // Tween camera position toward planet with a diagonal approach angle
      gsap.to(camera.position, {
        x: x + offset,
        y: y + offset * 0.5,
        z: z + offset,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => controls.update(),
        onComplete: () => {
          controls.enabled = true
        },
      })

      // Simultaneously tween the orbit target to the planet center
      gsap.to(controls.target, {
        x,
        y,
        z,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => controls.update(),
      })
    },
    [camera, controls]
  )

  // ── flyToOverview ────────────────────────────────────────────────────────
  // Returns camera to the default solar system overview position.
  const flyToOverview = useCallback(() => {
    if (!camera || !controls) return

    controls.enabled = false

    gsap.killTweensOf(camera.position)
    gsap.killTweensOf(controls.target)

    gsap.to(camera.position, {
      x: 0,
      y: 50,
      z: 120,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(),
      onComplete: () => {
        controls.enabled = true
      },
    })

    gsap.to(controls.target, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(),
    })
  }, [camera, controls])

  return { flyTo, flyToOverview }
}
