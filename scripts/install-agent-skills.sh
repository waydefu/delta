#!/usr/bin/env bash
set -euo pipefail
# Must be explicitly invoked on your own machine. Never runs during CI/pages.
if [[ "${1:-}" != "--install" ]]; then
 cat <<'USAGE'
Dry run. Review each upstream source and the npm installer before proceeding.
Usage: bash scripts/install-agent-skills.sh --install

npx impeccable install
npx skills add emilkowalski/skills --skill animate
npx skills add emilkowalski/skills --skill review-animations
npx skills add emilkowalski/skills --skill find-animation-opportunities
npx skills add greensock/gsap-skills
npx skills add LottieFiles/motion-design-skill
npx motion-ai
USAGE
 exit 0
fi
command -v npx >/dev/null || { echo "Install Node.js/npx first" >&2; exit 1; }
echo "Installing reviewed Skills interactively. Confirm changes in each installer."
npx impeccable install
npx skills add emilkowalski/skills --skill animate
npx skills add emilkowalski/skills --skill review-animations
npx skills add emilkowalski/skills --skill find-animation-opportunities
npx skills add greensock/gsap-skills
npx skills add LottieFiles/motion-design-skill
npx motion-ai
echo "Review installed agent skills and restart the agent."
