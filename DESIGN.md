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
