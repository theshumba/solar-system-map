import { useState, useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import { useSceneContext, useSceneDispatch } from '../../context/SceneContext'

// ─── Space facts shown randomly while assets load ─────────────────────────────
const SPACE_FACTS = [
  'The Sun contains 99.86% of the total mass of the Solar System.',
  'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
  'A day on Venus is longer than a year on Venus.',
  'Jupiter\'s Great Red Spot is a storm that has raged for over 350 years.',
  'Saturn\'s rings are made mostly of ice and rock, spanning up to 282,000 km wide.',
  'One million Earths could fit inside the Sun.',
  'The footprints left by Apollo astronauts will remain on the Moon for millions of years — there\'s no wind to erase them.',
  'Neptune\'s winds are the fastest in the Solar System, reaching 2,100 km/h.',
  'Mars has the tallest volcano in the Solar System: Olympus Mons stands 22 km high.',
  'The asteroid belt between Mars and Jupiter contains over a million asteroids.',
]

// ─── LoadingScreen ─────────────────────────────────────────────────────────────
// Lives OUTSIDE the Canvas in the DOM layer.
// useProgress() hooks into R3F's loader cache — no Canvas context needed.
export default function LoadingScreen() {
  const { active, progress } = useProgress()
  const { isLoaded } = useSceneContext()
  const dispatch = useSceneDispatch()

  // Pick a random fact once on mount
  const [factIndex] = useState(() => Math.floor(Math.random() * SPACE_FACTS.length))

  // Track whether we're in the fade-out phase
  const [fading, setFading] = useState(false)

  // When loading finishes, start the fade-out then mark as loaded
  useEffect(() => {
    if (!active && progress === 100) {
      setFading(true)
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_LOADED', payload: true })
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [active, progress, dispatch])

  // Once fully loaded, remove from the DOM entirely
  if (isLoaded) return null

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
      style={{
        transition: 'opacity 800ms ease-out',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* ── Branding ─────────────────────────────────────────────────── */}
      <p className="text-white text-2xl font-bold tracking-widest uppercase mb-1">
        AU Brussel
      </p>
      <p className="text-gray-400 text-sm tracking-wide mb-10">
        Interactive Solar System
      </p>

      {/* ── Progress bar ─────────────────────────────────────────────── */}
      <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-blue-400 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Percentage ───────────────────────────────────────────────── */}
      <p className="text-gray-500 text-xs mb-8">
        {Math.floor(progress)}%
      </p>

      {/* ── Space fact ───────────────────────────────────────────────── */}
      <p className="max-w-sm text-center text-gray-400 text-sm italic px-4">
        &ldquo;{SPACE_FACTS[factIndex]}&rdquo;
      </p>
    </div>
  )
}
