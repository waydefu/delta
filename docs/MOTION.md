# DELTA LAB — Motion Direction and QA

This is our own product specification inspired by publicly documented practices in Impeccable, Emil Kowalski, GSAP, Motion AI Kit and LottieFiles.

## Timing
- Tap and hover: 120–170ms, simple transform and border changes.
- Drawer entry: 215ms; exit: 135ms.
- Stat transitions: 215ms.
- Newly available slot one-shot highlight: 430ms.
- Chart stroke progression: 360ms.
- Initial page sequence: 300ms per group, <=275ms total stagger.

## Rules
- UI state must update regardless of whether the animation runs or fails.
- Respect OS prefers-reduced-motion and the on-site motion switch.
- Use the native Web Animations API for current static-site runtime, avoid GSAP + Motion on the same elements.
- Avoid perpetual animated backgrounds or constant particles on phones.
- Do not animate gun width, height, scaleX or scaleY separately. The weapon's proportions are invariants.
- Front-end animation is not a substitute for actual in-game projectile, drop or recoil data.
- Keep animation fast enough for repeated modding; visual feedback should never delay selecting the next part.

## Verification
- Check Node tests, GitHub Actions, 390px phone width, pointer/keyboard interactions, 60 Hz responsiveness, tap targets, reduced-motion mode.
- Failing visual tests require browser screenshot or real device validation; CI syntax pass alone is not enough.

## Agent Skill sources (installation opt-in)
Impeccable: https://github.com/pbakaus/impeccable
Emil: https://github.com/emilkowalski/skills
GSAP Skills: https://github.com/greensock/gsap-skills
Lottie Motion: https://github.com/LottieFiles/motion-design-skill
Motion AI Kit: https://github.com/motiondivision/ai-kit

To prepare local coding agents, review and optionally run scripts/install-agent-skills.sh --install. This chat can commit that script to GitHub but cannot execute it in your local Codex/Hermes session. This script is not part of production deployment or CI.

## First researched shader implementation
`src/studio-light.mjs` is a **2D soft key-light** behind the rifle, not PBR metal rendering. WebGL2 one context, 360ms input cue, no perpetual loop, capped render resolution and DPR, page visibility and intersection handling, context-loss and reduced-motion fallback. Prioritize genuine modular GLB before introducing Three.js PBR or volumetric effects.
