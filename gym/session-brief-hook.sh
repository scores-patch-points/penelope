#!/bin/sh
# gym/session-brief-hook.sh — a SessionStart hook: tells a session in a nexus repo WHERE IT IS, then prints the session brief (GL-SB-01).
# A nexus repo is found by its git remote (scores-patch-points/<repo>); outside git, by the Fold/EO folder names or PLAN-v3.md / LEDGER.md.
# In a nexus repo it prints one status line (repo, branch, commit, commits behind origin's default branch, uncommitted files), the repo's gate
# (read from its CLAUDE.md), and a WARNING when the checkout is not on the default branch or is behind it: stale branches hid fixes that main
# already had (the 2026-11-18 regression diagnosis). Then the brief: fetched from main with a 3 s limit, cached, and a plain notice when it has neither.
# Prints nothing in an unrelated project. Wiring it into ~/.claude/settings.json is the owner's decision.
nexus=0; repo=""
url=$(git -C "$PWD" remote get-url origin 2>/dev/null)
case "$url" in
  *scores-patch-points/*) nexus=1; repo=${url##*/}; repo=${repo%.git} ;;
esac
if [ "$nexus" = 0 ]; then
  case "$PWD" in
    *khora*|*janus*|*pharos*|*penelope*|*the-fold*|*holodeck*|*Alhazen*|*Zenodotus*) nexus=1 ;;
    *) if [ -f PLAN-v3.md ] || [ -f experiments/zero-overlap/LEDGER.md ]; then nexus=1; fi ;;
  esac
fi
[ "$nexus" = 1 ] || exit 0
if [ -n "$repo" ]; then
  branch=$(git symbolic-ref --short -q HEAD || echo detached)
  commit=$(git rev-parse --short HEAD 2>/dev/null)
  # the default branch: the kit's own line in CLAUDE.md ("Default branch `x`"), else origin/main if it exists, else what origin/HEAD says
  # (a local origin/HEAD can be stale and point at some feature branch), else main
  def=$(grep -m1 -o 'Default branch `[^`]*`' CLAUDE.md 2>/dev/null | sed 's/Default branch `//; s/`$//')
  if [ -z "$def" ]; then
    if git rev-parse --verify -q refs/remotes/origin/main >/dev/null 2>&1; then def=main
    else def=$(git symbolic-ref --short -q refs/remotes/origin/HEAD 2>/dev/null); def=${def#origin/}; fi
  fi
  [ -n "$def" ] || def=main
  behind=$(git rev-list --count "HEAD..origin/$def" 2>/dev/null || echo "?")
  dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  echo "NEXUS: repo $repo · branch $branch @ $commit · $behind commit(s) behind origin/$def (as of the last fetch) · $dirty uncommitted file(s)"
  gate=$(grep -m1 '^- Gate' CLAUDE.md 2>/dev/null | sed 's/^- Gate (run it before you finish): //')
  [ -n "$gate" ] && echo "NEXUS: gate: $gate"
  if [ "$branch" != "$def" ]; then echo "NEXUS WARNING: you are on '$branch', not '$def'. A stale branch can hide fixes the default branch already has. Name the commit you read."; fi
  if [ "$behind" != "0" ] && [ "$behind" != "?" ]; then echo "NEXUS WARNING: this checkout is $behind commit(s) behind origin/$def: git fetch and update before you rely on it."; fi
fi
URL="${BRIEF_URL:-https://raw.githubusercontent.com/scores-patch-points/penelope/main/BRIEF.md}"
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/penelope-session-brief.md"
mkdir -p "$(dirname "$CACHE")"
curl -fsS -m 3 -o "$CACHE.tmp" "$URL" 2>/dev/null && mv "$CACHE.tmp" "$CACHE"
rm -f "$CACHE.tmp"
if [ -f "$CACHE" ]; then cat "$CACHE"; else echo "SESSION BRIEF UNAVAILABLE (offline and no cache): read BRIEF.md at the root of the penelope repo before working on the Fold/EO research."; fi
