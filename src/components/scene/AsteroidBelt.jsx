import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D } from 'three'
import { useSceneStore } from '../../store/sceneStore'
import { ORBITAL_DISTANCES } from '../../data/constants'

// ─── AsteroidBelt ─────────────────────────────────────────────────────────────
// Renders ~2000 animated asteroid instances using Three.js InstancedMesh.
//
// Why InstancedMesh (not individual meshes):
//   2000 individual mesh components = 2000 draw calls = instant performance death.
//   InstancedMesh = 1 draw call regardless of instance count. For animated
//   per-instance transforms, the raw imperative InstancedMesh API is used
//   directly rather than drei's Instances helper (which has React overhead).
//
// Scratch Object3D (CRITICAL performance rule):
//   The `scratch` Object3D is allocated ONCE at module level — outside the
//   component. Allocating a new Object3D inside useFrame would create garbage
//   2000× per frame, triggering GC spikes that destroy frame rate.
//
// Belt bounds:
//   INNER = mars orbit + 2 scene units (just outside Mars)
//   OUTER = jupiter orbit - 3 scene units (just inside Jupiter)
//   This matches the real asteroid belt location between Mars and Jupiter.
//
// frustumCulled={false}:
//   InstancedMesh frustum culling uses the combined bounding sphere of all
//   instances. When the camera looks away from the belt's center, Three.js
//   may incorrectly cull the entire belt. Disabling frustum culling ensures
//   asteroids always render.
//
// instanceData mutation:
//   The angle field in instanceData is mutated directly in useFrame — this is
//   intentional. No state update, no React re-render. Pure imperative animation.

const COUNT = 2000
const INNER = ORBITAL_DISTANCES.mars + 2       // just outside Mars orbit
const OUTER = ORBITAL_DISTANCES.jupiter - 3    // just inside Jupiter orbit

// Pre-allocated scratch Object3D — NEVER allocate inside useFrame
const scratch = new Object3D()

export default function AsteroidBelt() {
  const meshRef = useRef()

  // Pre-generate stable per-instance random data once — never recomputed
  const instanceData = useMemo(() => {
    const data = []
    for (let i = 0; i < COUNT; i++) {
      const radius = INNER + Math.random() * (OUTER - INNER)
      const angle = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 1.5        // slight vertical spread
      const speed = 0.02 + Math.random() * 0.03    // vary orbital speed slightly
      const rotX = Math.random() * Math.PI
      const rotY = Math.random() * Math.PI
      const scale = 0.05 + Math.random() * 0.1
      data.push({ radius, angle, y, speed, rotX, rotY, scale })
    }
    return data
  }, [])

  // Set initial positions — InstancedMesh starts with all-zero matrices (invisible)
  // Must explicitly initialize all instance transforms
  useEffect(() => {
    if (!meshRef.current) return
    instanceData.forEach((d, i) => {
      scratch.position.set(
        Math.cos(d.angle) * d.radius,
        d.y,
        Math.sin(d.angle) * d.radius
      )
      scratch.rotation.set(d.rotX, d.rotY, 0)
      scratch.scale.setScalar(d.scale)
      scratch.updateMatrix()
      meshRef.current.setMatrixAt(i, scratch.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [instanceData])

  useFrame((_state, delta) => {
    if (!meshRef.current) return
    const { speed, isPaused } = useSceneStore.getState()
    if (isPaused) return

    instanceData.forEach((d, i) => {
      // Accumulate orbital angle — direct mutation of instanceData is intentional
      d.angle += delta * d.speed * speed
      scratch.position.set(
        Math.cos(d.angle) * d.radius,
        d.y,
        Math.sin(d.angle) * d.radius
      )
      scratch.rotation.set(d.rotX, d.rotY, 0)
      scratch.scale.setScalar(d.scale)
      scratch.updateMatrix()
      meshRef.current.setMatrixAt(i, scratch.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    // args=[null, null, COUNT] — geometry and material provided as children
    // frustumCulled={false} — prevent incorrect whole-belt culling
    <instancedMesh ref={meshRef} args={[null, null, COUNT]} frustumCulled={false}>
      <dodecahedronGeometry args={[0.07, 0]} />
      <meshStandardMaterial color="#888888" roughness={0.9} metalness={0.1} />
    </instancedMesh>
  )
}
