# Feature Research

**Domain:** Interactive 3D Solar System / Space Exploration Web App
**Researched:** 2026-02-24
**Confidence:** MEDIUM
**Note:** WebSearch and WebFetch were unavailable. Findings based on training-data knowledge of major competitors (NASA Eyes on the Solar System, Solar System Scope, Space Engine Web, 100,000 Stars, Chrome Experiments — "100,000 Stars", Stellarium Web) and broad WebGL/Three.js orrery ecosystem patterns. Where claims rely solely on training data, confidence is flagged LOW. Core 3D interaction patterns are HIGH confidence (well-established, stable field).

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any 3D solar system web app. Missing these makes the product feel like a prototype, not a showcase.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| All 8 planets rendered in 3D | Every solar system app shows at least the 8 planets; missing one is immediately noticed | LOW | Pluto included as bonus; the design doc already includes it. Mercury through Neptune are non-negotiable |
| Planets orbit the Sun continuously | The defining characteristic of an orrery — static positions feel dead | LOW | Real-time animation loop; orbit speed multiplier expected by users |
| Click a planet to learn about it | Core interactivity loop every user expects | LOW | Without this, it's a screensaver, not an app |
| Planet info: name, diameter, distance, orbital period | Standard data panel — users come for facts | LOW | Must show at minimum these 4 stats; the design doc plans 6, which is correct |
| Zoom / orbit camera controls | Users expect to be able to rotate and zoom freely; no controls = frustration | LOW | OrbitControls (scroll zoom, drag rotate) is the de-facto standard |
| Distinct visual identity per planet | Users must be able to distinguish planets at a glance — colour and scale matter | MEDIUM | Textures or at minimum distinct procedural materials; Saturn's rings are absolutely required |
| Saturn's ring system | Saturn without rings is universally noticed as wrong | LOW | Torus geometry with texture; this is the single most recognizable solar system feature |
| Sun as light source with glow | A flat-shaded grey sphere for the Sun reads as a bug | LOW | Emissive material + bloom post-processing + PointLight; extremely expected |
| Starfield background | Empty black void feels unfinished; stars are expected context | LOW | Points geometry or cube skybox; procedural is fine |
| Pause / play orbital animation | Users want to freeze the scene to read panels; missing this creates friction | LOW | Spacebar or button toggle; simple boolean in animation loop |
| Mobile / responsive layout | Portfolio showcase will be viewed on phones; broken mobile = failed portfolio piece | MEDIUM | Sidebar collapse, touch controls, bottom sheet pattern for info panel |
| Performance that doesn't crash the tab | If the app freezes or drops to <10fps on average hardware, users close it immediately | MEDIUM | Instanced meshes for asteroid belt, texture compression, no unnecessary re-renders |
| Loading screen with progress indicator | 3D assets take time to load; no indicator feels broken | LOW | Simple progress bar or spinner; already in design doc |

### Differentiators (Competitive Advantage)

Features that go beyond the baseline and distinguish this orrery as a quality portfolio piece. Not universally present in competitors; their presence signals craftsmanship.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| GSAP camera fly-to animation on planet select | Smooth, cinematic transitions make exploration feel like a space journey rather than clicking UI buttons; NASA Eyes does this but most lightweight web orreries don't | MEDIUM | GSAP timeline animating camera position + lookAt; requires careful easing (power2.inOut) and a stable target reference |
| Axial tilt and self-rotation per planet | Scientifically accurate orientation (Earth's 23.4° tilt, Uranus's 98° tilt, Venus retrograde) shows attention to detail that impresses recruiters/educators | MEDIUM | Rotation applied in useFrame; tilt applied as group rotation offset; retrograde is negative rotation rate |
| Earth cloud layer | Separate semi-transparent sphere over Earth is a classic differentiator that immediately elevates perceived quality | MEDIUM | Second sphere with alphaMap cloud texture; subtle rotation at different speed to Earth surface |
| Jupiter Great Red Spot | Hand-crafted texture detail that shows the creator cares about scientific authenticity | LOW | Texture map detail; no extra geometry needed |
| Galilean moons orbiting Jupiter | Four largest moons (Io, Europa, Ganymede, Callisto) orbiting Jupiter is expected by space enthusiasts and directly differentiates from minimal orreries | MEDIUM | Small spheres with own orbit math; each needs correct relative orbital period |
| Saturn visible moons (Titan etc.) | At least Titan orbiting Saturn completes the "Jupiter has moons, Saturn has moons" parity | LOW | Same moon orbit system as Jupiter |
| Moon orbiting Earth | Earth's Moon is the most expected moon; absence is noticed; presence is delightful | LOW | Single small sphere, ~27-day period (scaled) |
| Asteroid belt with instanced mesh | Visual variety between Mars and Jupiter breaks monotony and demonstrates Three.js instancing skill | MEDIUM | InstancedMesh with random positions in torus volume; thousands of instances at <1ms/frame with instancing |
| Orbit lines with hover glow | Subtle elliptical guides that brighten on hover give users spatial understanding of orbits; most minimal orreries skip hover state | LOW | Line geometry per planet; material emissiveIntensity tweak on hover |
| Planet composition bar chart in info panel | Atmospheric/surface composition as an animated visual breaks the wall-of-text data pattern | MEDIUM | Simple CSS or SVG bar chart; GSAP stagger entrance animation makes it feel alive |
| Fun facts carousel per planet | Rotating "Did You Know?" content increases dwell time and gives the app replayability | LOW | Array of strings, setInterval or click-to-advance; easily curated from NASA fact sheets |
| Timeline speed control (0x–100x) | Letting users accelerate orbits to see Jupiter lap Saturn, or pause to read, is an educational superpower | LOW | Slider controlling a speed multiplier in the animation loop; already in design doc |
| Keyboard shortcuts (1–9, Space, Escape) | Power-user UX that impresses technical reviewers; signals developer thoughtfulness | LOW | Simple keydown listener; already in design doc |
| Pluto included | Controversial but affectionate; many users expect Pluto; its inclusion with "dwarf planet" label is a conversation starter | LOW | Same pipeline as other planets; label it correctly as dwarf planet |
| Venus retrograde rotation | Scientifically accurate (Venus spins opposite direction) is an easter egg for the knowledgeable | LOW | Negative rotationSpeed constant; zero additional complexity |
| Uranus tilted rings | Uranus's extreme axial tilt (98°) means it orbits on its side — rendering this correctly is a visual surprise | LOW | Group rotation applied to both planet sphere and ring geometry |
| Neptune faint rings | Neptune has rings; showing faint ones completes the "ringed planets" set beyond just Saturn | LOW | Semi-transparent torus, very low opacity |
| "Tombaugh Regio" heart on Pluto | The distinctive heart-shaped feature on Pluto is a crowd-pleaser recognizable from New Horizons imagery | LOW | Texture map detail |
| Branded loading screen with space fact | Transforms dead load time into engagement; reinforces AU Brussel identity | LOW | Simple JSX with progress bar and rotating fact string |
| Footer attribution persistent on-screen | Portfolio showcase needs clear authorship; never hides | LOW | Absolute-positioned footer element |

### Anti-Features (Explicitly Do NOT Build)

Features that seem like good ideas but will consume disproportionate time, introduce bugs, or harm the portfolio presentation.

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| Real-time accurate orbital positions (ephemeris) | Sounds impressive; "planets are where they actually are today" | Requires VSOP87 or JPL ephemeris integration — extremely complex math, large data, hard to debug. For a portfolio piece, nobody will verify orbital accuracy to the arcsecond. The visual orrery impression is what matters | Use proportionally correct orbital periods with a time-scale multiplier; looks accurate without the engineering burden |
| VR / WebXR support | Future-looking; sounds cool | WebXR adds a full separate interaction paradigm (controller input, 6DOF navigation, comfort guidelines), doubles testing surface, and is used by <1% of web visitors. Portfolio reviewers view on desktop browser | Keep as a future v2 stretch goal; mention it as a planned extension in the README |
| User accounts / saved views | "Remember my favourite planet" personalization | This is a static portfolio site with no backend. Adding auth introduces localStorage hacks or a backend, breaking the "pure static" architecture constraint | The app is stateless by design; each visit starts fresh, which is fine for a showcase |
| Real moon counts for all planets (95 for Saturn) | Saturn has 146 known moons as of 2023 | Rendering 95+ moon orbits as individual objects kills performance. Showing all of them correctly requires a different UI pattern (orbit diagram, not 3D spheres) | Show 4 key moons per gas giant with "146 total" in the info panel; focus on major named moons only |
| Spacecraft trajectories | NASA Eyes does this; it's a major differentiator there | Requires mission data feeds, trajectory math, and animated path rendering. Massive scope increase for a feature most portfolio visitors won't interact with | Mention notable missions in fun facts text (e.g., "Voyager 2 reached Neptune in 1989") |
| Exoplanet systems | "There are other solar systems!" | Requires a completely different data model, scene camera scale, and UI. A separate app, not a feature | Keep scope to our solar system; title the app accordingly |
| Day/night cycle on Earth visible from orbit | Looks impressive in demos | Requires a dynamic shadow map or light-side/dark-side texture blend — moderately complex, and at the camera distances used in an orrery it's nearly invisible. Effort-to-impression ratio is low | Earth cloud layer gives more visual return for less effort |
| Fully accurate elliptical orbits with correct eccentricity | "Real orbits aren't circles!" | Mercury's eccentricity (0.206) is perceptible; others are nearly circular. Implementing Kepler's equation correctly is non-trivial math and introduces animation discontinuities. Portfolio visitors won't notice circular vs. slightly elliptical | Use circular orbits for simplicity; document this trade-off in code comments; optionally show orbit-line ellipse for Mercury as a stretch goal |
| Procedural planet terrain generation | "GPU-rendered realistic surfaces" | Noise-based 3D terrain (ala Space Engine) requires vertex shaders, terrain LOD, and gigabytes of theory. Way beyond portfolio scope | High-quality texture maps (free from NASA/Solar System Scope) give 95% of the visual impression for 5% of the effort |
| Sound / audio (engine hum, planet themes) | Atmospheric | Audio autoplay is blocked by all browsers; requires user gesture unlock flow; adds complexity for questionable value | Silence is fine; let the visuals speak |
| Search / filter by planet properties | "Data explorer" mode | Solar system has 8 planets; a search box is absurd. This signals product-thinking confusion | Navigation sidebar covers all discovery needs |

---

## Feature Dependencies

```
[Orbital Animation Loop]
    └──required by──> [Speed Control Slider]
    └──required by──> [Pause/Play Toggle]
    └──required by──> [Moon Orbits]
    └──required by──> [Asteroid Belt Motion]

[Planet Mesh + Material]
    └──required by──> [Click Selection]
                          └──required by──> [Camera Fly-To]
                          └──required by──> [Info Panel Display]
    └──required by──> [Hover State]
                          └──required by──> [Orbit Line Glow]
                          └──required by──> [Name Label Appearance]

[Camera Fly-To (GSAP)]
    └──required by──> [Navigation Sidebar Planet Select]
    └──required by──> [Keyboard Shortcut 1-9]
    └──required by──> [Escape → Return to Overview]

[Info Panel]
    └──required by──> [Planet Stats Display]
    └──required by──> [Composition Bar Chart]
    └──required by──> [Fun Facts Carousel]
    └──required by──> [Moon List]

[Sun PointLight]
    └──required by──> [Phong/Standard material shading on all planets]

[Post-Processing (EffectComposer)]
    └──required by──> [Bloom (Sun glow)]
    └──required by──> [Vignette]

[Responsive Layout]
    └──required by──> [Mobile Hamburger Nav]
    └──required by──> [Bottom Sheet Info Panel (mobile)]
```

### Dependency Notes

- **Orbital Animation Loop is the foundation:** Every dynamic feature (moons, asteroids, speed control) hangs off the central useFrame animation loop. It must be correct before adding dependents.
- **Camera Fly-To is a shared primitive:** Three separate features (sidebar clicks, keyboard shortcuts, click-on-planet) all trigger the same camera animation. Build the fly-to hook once, call it everywhere.
- **Info Panel requires planet data structure:** The composition chart, moon list, and fun facts all depend on `planets.js` data shape. Define the data schema before building UI components that consume it.
- **Post-processing is independent but fragile:** Bloom + vignette via `@react-three/postprocessing` does not conflict with scene objects, but it does require EffectComposer wrapping the Canvas. Add it as a layer once the scene is stable, not first.
- **Hover state conflicts with OrbitControls drag:** Mouse events for hover/click can be swallowed by OrbitControls. Need raycaster attached to pointer events on the canvas, with drag detection to avoid firing click on drag-end. This is a known pattern — `onPointerUp` with delta check, not `onClick`.

---

## MVP Definition

### Launch With (v1) — Portfolio-Ready

Minimum set that makes the app feel complete and impressive to a portfolio reviewer.

- [ ] All 8 planets + Pluto rendered with textures, correct relative sizes, orbiting Sun — *the core orrery*
- [ ] Saturn ring system — *single most expected visual feature*
- [ ] Earth Moon orbiting — *most expected moon; delight factor*
- [ ] Sun with bloom glow + PointLight — *sets the scene*
- [ ] Starfield background — *context; emptiness is jarring*
- [ ] Free orbit camera (OrbitControls) — *user agency*
- [ ] Click planet → camera fly-to + info panel — *core interaction loop*
- [ ] Info panel: 6 stats + fun facts — *educational value, dwell time*
- [ ] Navigation sidebar with all bodies — *orientation aid*
- [ ] Orbit lines (faint, hover brightens) — *spatial legibility*
- [ ] Pause/play + speed slider — *engagement hook; lets users see orbits clearly*
- [ ] Keyboard shortcuts (1-9, Space, Escape) — *power user delight*
- [ ] Responsive design (desktop + mobile) — *portfolio reviewed everywhere*
- [ ] Loading screen with progress + space fact — *polish signal*
- [ ] AU Brussel footer branding — *portfolio purpose*

### Add After v1 Validation (v1.x)

Features that elevate quality but are not blocking for launch.

- [ ] Galilean moons for Jupiter (Io, Europa, Ganymede, Callisto) — *space enthusiast delight; add once core moon system works*
- [ ] Saturn visible moons (Titan at minimum) — *parity with Jupiter treatment*
- [ ] Composition bar chart animated entrance — *elevates info panel from data dump to data visualization*
- [ ] Asteroid belt (InstancedMesh) — *visual variety; add once core scene is stable*
- [ ] Venus retrograde + Uranus extreme tilt visual — *scientific accuracy easter eggs*
- [ ] Neptune faint rings — *completeness*

### Future Consideration (v2+)

Defer entirely — scope risk or low portfolio ROI.

- [ ] Spacecraft trajectories — *major scope increase; mention in README as planned*
- [ ] WebXR/VR mode — *<1% of portfolio viewers; massive effort*
- [ ] Real ephemeris positions — *high complexity, imperceptible difference for portfolio viewers*

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| All planets orbiting Sun | HIGH | LOW | P1 |
| Click → fly-to + info panel | HIGH | MEDIUM | P1 |
| Saturn rings | HIGH | LOW | P1 |
| Sun bloom glow | HIGH | LOW | P1 |
| Starfield | HIGH | LOW | P1 |
| Responsive layout | HIGH | MEDIUM | P1 |
| Navigation sidebar | HIGH | LOW | P1 |
| Pause/play + speed control | HIGH | LOW | P1 |
| Keyboard shortcuts | MEDIUM | LOW | P1 |
| Orbit lines + hover state | MEDIUM | LOW | P1 |
| Earth Moon | MEDIUM | LOW | P1 |
| Loading screen | MEDIUM | LOW | P1 |
| Galilean moons (Jupiter) | MEDIUM | MEDIUM | P2 |
| Composition bar chart | MEDIUM | LOW | P2 |
| Asteroid belt (instanced) | MEDIUM | MEDIUM | P2 |
| Venus retrograde rotation | LOW | LOW | P2 |
| Uranus tilted rings | MEDIUM | LOW | P2 |
| Neptune faint rings | LOW | LOW | P2 |
| Fun facts carousel | MEDIUM | LOW | P1 |
| Spacecraft trajectories | LOW | HIGH | P3 |
| WebXR/VR | LOW | HIGH | P3 |
| Real ephemeris positions | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for portfolio launch
- P2: Should have, add in polish phase
- P3: Nice to have, future v2

---

## Competitor Feature Analysis

*Confidence: MEDIUM — based on training data knowledge of these products. Specifics may have changed since August 2025 knowledge cutoff. URLs provided for manual verification if needed.*

| Feature | NASA Eyes on the Solar System | Solar System Scope | Space Engine (Web) | Our Approach |
|---------|-------------------------------|-------------------|-------------------|--------------|
| 3D planets orbiting Sun | Yes — full orrery | Yes — full orrery | Yes — full universe | Yes — orrery focus |
| Camera fly-to on select | Yes — smooth GSAP-equivalent | Yes | Yes | Yes (GSAP) |
| Real ephemeris positions | Yes — JPL Horizons data | Yes | Yes | No — visual approximation only |
| Spacecraft trajectories | Yes — major feature | No | No | No (defer to v2) |
| Planet textures | Yes — NASA imagery | Yes — high quality | Yes — procedural | Yes — NASA/free textures |
| Moon systems | Yes — many moons | Yes | Yes | Key moons only (named major ones) |
| Info panels | Yes | Yes | Limited | Yes — richer content |
| Speed control | Yes | Yes | Yes | Yes |
| Mobile support | Partial (desktop-first) | Yes | Limited | Yes — first-class |
| Keyboard shortcuts | Yes | Limited | Yes | Yes |
| VR support | No | No | Planned | No (v2 stretch) |
| Loading screen | Yes | Yes | Yes | Yes — branded |
| Attribution/branding | NASA branding | Product branding | Product branding | AU Brussel — portfolio focus |
| Pure static (no backend) | No — downloadable app | No — has backend | No — has backend | Yes — differentiator for portfolio |

### Key Competitive Insights

1. **NASA Eyes is desktop-only app, not web:** Our web-native approach means no install barrier. The portfolio reviewer clicks a link — huge advantage over NASA Eyes in accessibility.

2. **Solar System Scope is the closest web competitor:** It has most features but is a commercial product with a backend. We can match it visually as a static site, which signals architectural skill.

3. **Static site deployment is itself a differentiator:** Deploying a feature-rich 3D experience as a pure static site (Vercel/Netlify, zero backend) demonstrates modern frontend capability that portfolio reviewers at tech companies recognize.

4. **Info panel quality is where we can win:** Competitors tend toward data dumps. The combination of animated stats, composition bar chart, and fun facts carousel is richer UX than any direct competitor at this scale.

5. **GSAP animations signal maturity:** Most free orrery projects use lerp or raw Three.js animation; GSAP integration with easing signals awareness of animation tooling beyond the defaults.

---

## Sources

- **NASA Eyes on the Solar System** — https://eyes.nasa.gov/apps/solar-system/ (training data knowledge; confidence MEDIUM)
- **Solar System Scope** — https://www.solarsystemscope.com/ (training data knowledge; confidence MEDIUM)
- **Space Engine** — https://spaceengine.org/ (training data knowledge; confidence MEDIUM)
- **100,000 Stars (Chrome Experiment)** — https://stars.chromeexperiments.com/ (training data knowledge; confidence MEDIUM)
- **Stellarium Web** — https://stellarium-web.org/ (training data knowledge; confidence MEDIUM)
- **Three.js / React Three Fiber ecosystem patterns** — https://docs.pmnd.rs/react-three-fiber (training data; MEDIUM confidence for general patterns, verify specific APIs)
- **Design Document** — `/Users/theshumba/Documents/GitHub/solar-system-map/docs/plans/2026-02-24-solar-system-map-design.md` (PRIMARY SOURCE — HIGH confidence for project scope)

**Note:** WebSearch and WebFetch were unavailable during this research session. All competitor analysis is based on training data (knowledge cutoff August 2025). Recommend manual verification of competitor feature sets before roadmap finalization, especially for any NASA Eyes or Solar System Scope features claimed above.

---

*Feature research for: Interactive 3D Solar System Web App (Portfolio Showcase — AU Brussel)*
*Researched: 2026-02-24*
