#!/bin/sh
# G1-3 round 2: builds the FRESH window's fold, question set and blocks (no model, no network), then the plain baseline's reply. Run once, after the addendum is hashed.
cd "$(dirname "$0")"
P="/Users/mlacy/Library/Application Support/Claude/scratch-workspaces/4bf59fed-b26b-4f7d-a90f-11d28a16ba25/1a7b49f0-7962-48a4-8bfc-8a3bc2e27d2d/scratch-2026-10-25-aa54ca/clones/pins"
export TEXT_RU_OVERRIDE="$PWD/window-text.txt" ALLOW_CLASH=1
export ABSENT_POOL='["Платон Каратаев","Алексей Аракчеев","Фёдор Ростопчин","Адам Чарторижский","Денис Давыдов","Тихон Щербатый","Михаил Кутузов","Василий Курагин"]'
node build-fold.mjs --khora "$P/khora" --janus "$P/janus" > build.out 2>&1 && node build-inputs.mjs --khora "$P/khora" --janus "$P/janus" >> build.out 2>&1
echo "build exit $?" >> build.out
node /Users/mlacy/Downloads/workspace/foldcode-nomodel/answer-plain.mjs --dir "$PWD" --out "$PWD/plain-reply.txt" >> build.out 2>&1
echo "plain exit $?" >> build.out
