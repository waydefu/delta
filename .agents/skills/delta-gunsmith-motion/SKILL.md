---
name: delta-gunsmith-motion
description: Design, implement and audit Delta Force AKM gunsmith motion, mobile drawer interactions, attachment hierarchy, and proportion-preserving weapon visuals in the Delta project.
---

# Delta Gunsmith — UI, Motion & Weapon Fidelity

Use for editing the Delta gun modification web UI. Read DESIGN.md, docs/MOTION.md and data/weapons/akm-geometry.json first.

## Procedure

1. Define interaction state transitions before animating (closed, choosing, previewing, equipping, locked).
2. Validate mount-slot availability using src/attachment-graph.mjs. Do not unlock hypothetical child slots.
3. In the gunsmith: show a proportion-preserved AKM image; only highlight the selected component, never stretch the whole rifle.
4. Provide immediate candidate preview. Switching one part updates confirmed stats and explicitly identifies approximations.
5. Move via opacity + transform (WAAPI by default). Respect OS reduced-motion and the site motion toggle.
6. Make the mobile drawer swipe-dismissible, Escape-dismissible, keyboard accessible, and focus-restoring.
7. Avoid long or perpetual visual effects. Motion communicates state; decoration must never reduce usability.
8. Run the GitHub Actions Node tests and verify actual rendered layout on desktop and a 390px mobile viewport if browser access is available.

## Strict source boundaries

- AKM original silhouette is a calibrated 2D representation, not an in-game 3D mesh.
- Original user screenshots contain a UID. They are reference evidence only, not redistributable public assets.
- Physical AKM data (880mm overall, 415mm barrel) is from linked manufacturer references; the game's geometry requires separate verification.
- No exact recoil curve, projectile drop, or attachment-dependent geometry without validated experiment or licensed asset.
- Do not mix GSAP, Motion and CSS animations on the same DOM element.

## Useful external skill workflows

- Impeccable: establish product hierarchy, audit visual design, distill unnecessary effects.
- Emil Kowalski: animation taste and individual motion review.
- GSAP Skills: use only if future complex part swapping truly requires timeline coordination; currently no runtime GSAP dependency.
- LottieFiles Motion Design: time, easing, staged choreography.
- Motion AI Kit: optional performance auditing; its paid features require separate entitlement.

External installations are optional and never run automatically from this skill.
