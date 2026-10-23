# DELTA LAB — Agent Guidance

Before working on UI or motion, read DESIGN.md and docs/MOTION.md.

- Keep gameplay facts, approximations and unverified algorithms separate.
- Preserve 2D gun proportions according to data/weapons/akm-geometry.json.
- Do not invent compatible subslots or per-attachment dynamic geometry.
- Use UI Skills as design guidance, not as an excuse to add all runtime frameworks.
- Respect reduced motion and mobile touch input.
- Inspect third-party skill installers before running them; only install in a trusted, explicitly approved local workspace.
- Run tests and validate on desktop/mobile browsers where tools permit.
- Commit relevant changes with proof, not unsupported completion claims.

## 2026-10-23 Graphics research gate
Read `docs/RESEARCH-AKM-GRAPHICS.md` before altering magazine proportions, studio lighting or suggesting a 3D engine migration. Treat static 2D illumination as decorative; never assert it is physically correct PBR. User-supplied screenshot contains UID and may not be redistributed.
