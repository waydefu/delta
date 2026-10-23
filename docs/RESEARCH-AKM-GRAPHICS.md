# AKM Magazine and Lighting — Research Decision Record
Date: 2026-10-23
Scope: Delta Force mobile gunsmith, first visual implementation.

## Evidence hierarchy

**Primary visual evidence:** user-supplied 1536x707 Delta Force mobile AKM gunsmith screenshot (2026-10-23). The source image includes a player UID, so it is used only as a private reference and **must not** be committed to this public repository.

**Public external cross-check:**
- 7.62×39mm 30-round curved steel AKM magazine: https://smallarmsreview.com/identifying-and-collecting-the-7-62x39mm-ak-47-akm-magazine/
- AK/AKM specification and side-profile illustrations: https://upload.wikimedia.org/wikipedia/commons/1/1f/WorldwideEquipmentGuide_2015_Ground_Systems.pdf
- AK series manufacturer data / 880 mm fixed-stock reference: https://www.armaco.bg/en/product/assault-rifles-c2/akm-assault-rifle-p492
- WebGL performance and fallback: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- 3D PBR metallic/roughness pipeline requirements: https://threejs.org/docs/pages/MeshStandardMaterial.html
- WebGL + DOM synchronization techniques (future 3D stage): https://tympanus.net/codrops/2026/10/21/atelier-ui-webgl-dom/

## Screenshot-based approximate points (not CAD dimensions)

The user screenshot shows the muzzle around x345, the buttplate around x1307; magazine enters the receiver in the x780–860 zone around y350 and curves forward toward the muzzle until the base around x695–740, y~520. These are *approximate screen pixel ranges*, not exact game asset vertices. This project maps the rifle to SVG 1000x420 with a calibrated silhouette.

The previous magazine model used an almost-vertical end profile with bottom tip near SVG x454–483. The 2026-10-23 revision moves the magazine's lower end to around SVG x376–418 while retaining the upper receiver location x458–550. The geometry is a traced approximation preserving the characteristic 30-round steel 'banana' curve, longitudinal stampings and bottom plate.

The standalone magazine asset shares the exact same 1000x420 viewBox and responsive box with the gun body so it does not drift when the page resizes.

## Effects selection — implemented first

- **WebGL2 shader:** Single full-screen triangle behind the rifle and UI anchors. Low-saturation graphite surface, weak neutral studio key illumination, deterministic fine noise. No ongoing idle render loop.
- **Interaction:** Per-slot focus cue lasts 360 ms and only redraws during that cue. Magazine inspect uses an independent sprite transform with fixed pivot and returns to its resting pose.
- **Mobile protections:** Limited backbuffer width 1360, height 740, DPR 1.0 on <=760px viewports and <=1.25 on larger; pause when hidden or offscreen, WebGL context-loss handling and CSS fallback.
- **Accessible behavior:** Reduced-motion preference removes decorative movement and state changes remain instantaneous. Focusable controls, visible text and existing DOM remain authoritative.

## Explicitly deferred (not claimed implemented)

- True PBR metallic reflection, environment maps, normal/roughness maps applied to AKM mesh
- HDRI, accurate contact shadow, volumetric god-rays, depth of field
- A licensed node-separated GLB with correct AKM magazine socket, pivot and subattachments
- Full 3D exploded-view attachment sequencing, hit testing and camera orbit
- Real ballistic / recoil traces derived from game data

These require a genuine authorized and properly segmented 3D model; the 2D shader must not be represented as physical relighting of steel.

## Next required gates
- Human visual confirmation that magazine insertion angle, curvature and height match the current in-game weapon; if not, revise coordinates before additional mesh work
- Real browser interaction check on 375–390px mobile and 1440px desktop; inspect 2D overlay registration and WebGL availability
- Device performance (frame time and memory) under repeated selector interactions
- Explicit GLB asset permission + node topology review before 3D switch
