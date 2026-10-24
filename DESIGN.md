# DELTA LAB — Design System

Purpose: Delta Force mobile AKM loadout analysis; not an official game website.

## Visual identity
Editorial military engineering. Night graphite #090e13, dark slate #151e26, pale signal green #c4df9a, light ivory #eef3f0, caution coral #f2a19b. Strong type hierarchy, measured whitespace. Do not add meaningless glow, bounce, glass cards, parallax or gamified scoring.

## Weapon silhouette fidelity
- The screenshot-calibrated AKM outline lives at assets/akm-side.svg; geometry and evidence at data/weapons/akm-geometry.json.
- Reference: overall physical length 880mm; barrel length 415mm (includes chambered section). Original mobile screenshot has front segment approximately 34.5%, receiver 35%, stock 30.5%.
- SVG is a calibrated 2D approximation, not an official in-game 3D model or engineering CAD. Do not advertise pixel-perfect precision.
- Never stretch image horizontally or vertically. Render preserving viewBox aspect ratio.
- Never upload player screenshots including UID to the website.
- Any future real 3D view requires a lawfully licensed exact-geometry AKM model, rigging, and per-part transformation anchors.

## UX principles
- Mobile first. Gun image should remain easy to recognize, slot buttons must be touch usable.
- Every slot is available / installed / locked / pending, with a clear explanation.
- Parent attachment can unlock children only if source data explicitly declares that relationship.
- Explain before/after stats; clearly mark calculations with uncertain game formulas.
- Always support keyboard, Escape, touch, and reduced-motion users.

## Matte material fidelity (mandatory, 2026-10-23)

- Primary reference: original mobile game's dim armory lighting. Phosphated/oxidized steel, subtle brushed grain and uncoated aged wood; never synthetic showroom gloss.
- Restrict metallic highlight to very narrow, low-intensity edge definition; wood needs muted low-frequency grain, not a bright plastic-to-brown gradient.
- Avoid glassmorphism, large radial halos, perpetual glows, excessive drop shadows, glossy hero CTA styling and multiple reflections.
- The weapon should remain the strongest contrast object, controls clearly readable but visually subordinate.
- Charts rely on line weight and geometry, not shiny fills. Reserve high-contrast accent only for selected, valid, and warning states.
- Motion changes state, not materials: do not animate specular brightness or add reflective sweeps.
- `assets/main.css` is the production CSS; keep one source of truth and avoid adding another external stylesheet.

## AKM 30-round magazine geometry (2026-10-23 evidence update)
- The in-game screenshot's stock AKM magazine angles forward, with upper feed at about x 780–850 and lower base x 695–745 in 1536px screenshot coordinates. Convert relative to the same rifle coordinate frame before tracing; never size by eye after separate CSS cropping.
- Current asset is split into a bare rifle `assets/akm-side.svg` and an aligned removable curved steel magazine `assets/akm-magazine.svg` sharing `viewBox=0 0 1000 420`, and it is **not** the official game model.
- Magazine motion is an inspect-only graphic demonstration and does not alter item compatibility or ammunition capacity. Do not redistribute the source screenshot or the player UID.

## ACFH V1 · Cinematic armory 2D scene (2026-10-24)

### Evidence-based art direction

Active Theory demonstrates narrative scene composition, deliberate depth hierarchy and state-based interaction. We borrow these principles, not Hydra, proprietary assets or a perpetual WebGL scene. See `docs/RESEARCH-ACTIVE-THEORY-ACFH-V1.md` and `docs/RESEARCH-2D-PERFORMANCE-2026-10-24.md`.

### Executed V1 visual scope

- Original `assets/armory-environment.svg`: low-contrast matte armory architecture with structural bays, overhead practical light and perspective floor. No screenshots, player UID, third-party texture, actual weapon mesh, image CDN or unlicensed assets.
- `assets/main.css` is the **single** loaded production stylesheet. The appended ACFH section changes the large visual environment, hero hierarchy, panel material and slot legibility without touching weapon geometry or JS calculations.
- The rifle / independent curved magazine SVGs retain their shared 1000×420 viewBox and original fitted layers.
- The background remains visible without JS/WebGL. The optional `studio-light.mjs` cue never runs continuously when idle; <=760px defaults to static 2D.
- On narrow screens, the environment fills only the gun-display region. The attachment grid remains a readable normal HTML layout; no horizontal squash of the rifle.
- Keep warning and evidence state styling legible; no unverified part is silently promoted to verified.

### Deferred and release gate

- Not a 3D rendered room, physically accurate weapon relighting, licensed in-game AKM skin or physically simulated ballistics.
- Use Playwright desktop 1440 and mobile 390/360 with visual artifacts; still requires manual image review and the user's POCO F8 Ultra real-device performance measurement.
- Avoid massive blur, particle animation, unbounded context creation, large shadow halos and fancy interactions that degrade repeated loadout editing.
