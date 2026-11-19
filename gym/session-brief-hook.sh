#!/bin/sh
# gym/session-brief-hook.sh — a SessionStart hook that prints the session brief (BRIEF.md) into Fold/EO sessions (GL-SB-01).
# NOT installed by the repo: wiring it into ~/.claude/settings.json is the owner's decision. It prints nothing in unrelated projects,
# fetches the brief from main with a 3 s limit, keeps a cache, and says plainly when it has neither.
case "$PWD" in
  *khora*|*janus*|*pharos*|*penelope*|*the-fold*|*holodeck*|*Alhazen*|*Zenodotus*) ;;
  *) [ -f PLAN-v3.md ] || [ -f experiments/zero-overlap/LEDGER.md ] || exit 0 ;;
esac
URL="${BRIEF_URL:-https://raw.githubusercontent.com/scores-patch-points/penelope/main/BRIEF.md}"
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/penelope-session-brief.md"
mkdir -p "$(dirname "$CACHE")"
curl -fsS -m 3 -o "$CACHE.tmp" "$URL" 2>/dev/null && mv "$CACHE.tmp" "$CACHE"
rm -f "$CACHE.tmp"
if [ -f "$CACHE" ]; then cat "$CACHE"; else echo "SESSION BRIEF UNAVAILABLE (offline and no cache): read BRIEF.md at the root of the penelope repo before working on the Fold/EO research."; fi
