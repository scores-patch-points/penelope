#!/bin/sh
# G1-3 round 4 (PREREG-G1-3-ROUND4.md): a replication of the FROZEN round-3 code. Builds the candidate windows a, b, c in order (the build is model-free and does not run the composer),
# stops at the first whose fold states a kin relation fact (parent_of, sibling_of, spouse_of or term) and scores ONLY that window once; if none does, scores window a (R4 will then fail again).
cd "$(dirname "$0")"
V="$PWD"; R="/Users/mlacy/Library/Application Support/Claude/scratch-workspaces/4bf59fed-b26b-4f7d-a90f-11d28a16ba25/1a7b49f0-7962-48a4-8bfc-8a3bc2e27d2d/scratch-2026-10-25-aa54ca/clones/penelope-clone"; P="/Users/mlacy/Library/Application Support/Claude/scratch-workspaces/4bf59fed-b26b-4f7d-a90f-11d28a16ba25/1a7b49f0-7962-48a4-8bfc-8a3bc2e27d2d/scratch-2026-10-25-aa54ca/clones/pins"
: > round4.log
CHOSEN=""
for w in a b c; do
  cp window-xv-on/build-fold.mjs window-xv-on/build-inputs.mjs window-xv-on/swap.mjs window-xv-on/lib.mjs window-xv-on/run-fresh.sh window-r4$w/
  sh window-r4$w/run-fresh.sh > /dev/null 2>&1
  n=$(node -e 'const f=JSON.parse(require("fs").readFileSync("window-r4'$w'/fold.json","utf8"));console.log(f.kin.facts.filter((x)=>["parent_of","sibling_of","spouse_of","term"].includes(x.rel)).length+" kin relation facts; "+f.kin.facts.length+" facts; "+f.kin.unbound.length+" unbound; "+Object.keys(f.referents).length+" beings")')
  echo "window r4$w: $n" >> round4.log
  k=$(echo "$n" | cut -d' ' -f1)
  if [ "$k" -gt 0 ] && [ -z "$CHOSEN" ]; then CHOSEN=$w; break; fi
done
[ -z "$CHOSEN" ] && CHOSEN=a
echo "scored: window r4$CHOSEN" >> round4.log
cd "$R" || exit 1
for f in organs/kin-telling.mjs organs/kin-telling-check.mjs organs/kin-telling-frames.json organs/generation/adapters/kin-telling.mjs gym/kin-telling-run.mjs gym/kin-telling-lib.mjs gym/kin-telling-mutants.mjs organs/kin-telling.test.mjs; do
  h=$(shasum -a 256 $f | cut -d' ' -f1); grep -q "$h" "$V/ADDENDUM-R3-1.md" || { echo "CODE HASH MISMATCH $f" >> "$V/round4.log"; exit 3; }
done
echo "code hashes match Addendum R3-1" >> "$V/round4.log"
FS=$(shasum -a 256 organs/kin-telling-frames.json | cut -d' ' -f1)
mkdir -p "$V/results-round4"
JANUS_HOME="$P/janus" KHORA_HOME="$P/khora" node gym/kin-telling-run.mjs --window fresh-r4$CHOSEN --dir "$V/window-r4$CHOSEN" --plain "$V/window-r4$CHOSEN/plain-reply.txt" --janus "$P/janus" --frames-sha "$FS" --out "$V/results-round4" > "$V/results-round4/fresh-run-console.txt" 2>&1
echo "scorer exit $?" >> "$V/round4.log"
