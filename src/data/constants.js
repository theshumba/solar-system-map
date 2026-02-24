// DO NOT USE REAL AU DISTANCES — outer planets would be invisible at any useful viewport
// All distances are compressed for visual presentation using logarithmic scaling

// ─── Scale constants ───────────────────────────────────────────────────────────
// These define the compression formula: displayDist = LOG_FACTOR * Math.log(realAU + 1) * ORBIT_SCALE
// Pre-computed values in ORBITAL_DISTANCES below
export const ORBIT_SCALE = 8
export const LOG_FACTOR = 2
export const PLANET_SCALE = 0.5
export const SUN_RADIUS = 5

// ─── Camera ────────────────────────────────────────────────────────────────────
export const CAMERA_FAR = 10000
export const DEFAULT_SPEED = 30

// ─── Orbital distances (scene units) ──────────────────────────────────────────
// Compressed — NOT real AU. Outer planets visible at camera [0, 50, 120]
export const ORBITAL_DISTANCES = {
  mercury: 6,
  venus: 9,
  earth: 12,
  mars: 16,
  jupiter: 30,
  saturn: 42,
  uranus: 54,
  neptune: 64,
  pluto: 72,
}

// ─── Planet display radii (scene units) ───────────────────────────────────────
// Scaled for visibility — NOT real relative sizes
export const PLANET_RADII = {
  sun: 5,
  mercury: 0.35,
  venus: 0.87,
  earth: 0.92,
  mars: 0.49,
  jupiter: 3.2,
  saturn: 2.7,
  uranus: 1.5,
  neptune: 1.45,
  pluto: 0.18,
}

// ─── Texture paths ─────────────────────────────────────────────────────────────
export const TEXTURE_PATHS = {
  sun: '/textures/sun.jpg',
  mercury: '/textures/mercury.jpg',
  venus: '/textures/venus.jpg',
  earth: '/textures/earth.jpg',
  earthClouds: '/textures/earth-clouds.png',
  mars: '/textures/mars.jpg',
  jupiter: '/textures/jupiter.jpg',
  saturn: '/textures/saturn.jpg',
  saturnRing: '/textures/saturn-ring.png',
  uranus: '/textures/uranus.jpg',
  neptune: '/textures/neptune.jpg',
  pluto: '/textures/pluto.jpg',
}
