# Interactive Solar System Map — Design Document

**Author:** AU Brussel
**Date:** 2026-02-24
**Purpose:** Portfolio showcase — visually stunning interactive 3D solar system map

---

## Overview

A single-page interactive 3D solar system built as a living orbital orrery. All planets orbit the Sun in real-time within one continuous Three.js scene. Users explore freely with camera controls, click planets to fly in for detailed info, and navigate via sidebar or keyboard shortcuts. Dynamic, fun, youthful, scientific.

## Tech Stack

- **React 19 + Vite 7** — Fast dev, static site output
- **React Three Fiber (R3F)** + **@react-three/drei** — Three.js as React components
- **GSAP 3** + **@gsap/react** — Camera fly-to animations, UI transitions
- **Tailwind CSS v4** — UI panels, overlays, responsive layout
- **No backend** — Pure static site, deployable anywhere

## Project Structure

```
src/
  components/
    scene/          — 3D: Sun, Planet, Rings, AsteroidBelt, Starfield, OrbitLines
    ui/             — 2D: InfoPanel, NavSidebar, TopBar, LoadingScreen, Footer
  data/
    planets.js      — All planet/moon data (real NASA values)
    constants.js    — Scale factors, colors, texture paths
  hooks/            — useCamera, usePlanetSelect, useOrbitalAnimation
  assets/
    textures/       — Planet texture images (procedural generation)
  App.jsx
  main.jsx
```

## Architecture: Single-Scene Orbital Orrery

One continuous Three.js scene. All celestial bodies orbit simultaneously. Camera is free-orbit by default (OrbitControls centered on Sun). Clicking a planet triggers a GSAP-animated camera fly-to (~1.5s). No scene transitions — fully immersive.

## 3D Scene Design

### The Sun
- Central glowing sphere with emissive material + bloom post-processing
- Pulsating light animation
- Primary light source (PointLight)

### Planets
Each planet is a textured sphere with:
- Real relative sizes (scaled proportionally so all visible)
- Real orbital order but compressed distances
- Axial tilt matching real values
- Self-rotation at proportional speeds
- Orbital motion around Sun (adjustable speed)

### Planet Features

| Body | Special Features |
|------|-----------------|
| Mercury | Small, cratered texture, fast orbit |
| Venus | Thick atmosphere glow, retrograde rotation |
| Earth | Cloud layer, Moon orbiting |
| Mars | Red tint, slight atmosphere haze |
| Jupiter | Banded texture, Great Red Spot, 4 Galilean moons |
| Saturn | Iconic ring system (torus), 4 visible moons |
| Uranus | Tilted rings, blue-green tint |
| Neptune | Deep blue, faint rings |
| Pluto | Small, heart-shaped Tombaugh Regio |

### Asteroid Belt
- Instanced mesh of small rocks between Mars and Jupiter
- Thousands of particles orbiting

### Starfield
- Procedural star background using Points geometry
- No skybox image dependency

### Orbit Lines
- Faint dashed elliptical lines per planet
- Glow on hover

### Post-Processing
- Bloom (Sun glow)
- Subtle vignette

## Interactions & Camera

### Default State
Free-orbit camera (OrbitControls) centered on Sun. Planets orbit in real-time.

### Planet Selection Flow
1. **Hover** — Name label appears, orbit line brightens, subtle scale-up
2. **Click** — GSAP camera fly-to (~1.5s ease), planet becomes new orbit center
3. **Info panel** slides in from right with planet data (GSAP stagger)
4. **Back/Escape** — Camera flies back to overview

### Navigation Sidebar (Left)
- Vertical list of all celestial bodies with icons
- Click name → camera flies to planet
- Current selection highlighted
- Collapsible on mobile (hamburger)

### Timeline Control (Bottom)
- Speed slider: 0x (paused) to 100x real-time
- Play/pause button

### Keyboard Shortcuts
- `1-9` → Jump to planet by order
- `Escape` → Back to overview
- `Space` → Pause/resume orbits

## Info Panel Design

Right side, 400px wide. Contains:
- Planet name + nickname/tagline
- 6 key stats: distance, diameter, orbital period, day length, moons count, avg temperature
- Atmospheric/surface composition (animated bar chart)
- Fun facts (2-4 per planet, rotating carousel)
- Notable moons list
- "Did You Know?" section

## AU Brussel Branding
- "Created by AU Brussel" in footer corner (persistent)
- Featured in loading screen
- Subtle but ever-present

## Loading Screen
- Space-themed with AU Brussel branding
- Progress bar styled as "distance traveled"
- Fun space fact displayed while loading

## Responsive Design
- Desktop: Full sidebar + right info panel
- Tablet: Collapsible sidebar, narrower info panel
- Mobile: Hamburger nav, bottom sheet info panel (slide up)

## Data Sources
All planet data uses real NASA/scientific values:
- Distances, diameters, orbital periods, temperatures
- Atmospheric compositions
- Moon counts and names
- Fun facts curated for engagement
