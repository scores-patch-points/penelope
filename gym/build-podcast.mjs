// gym/build-podcast.mjs — BUILD A PODCAST LISTENING APP WITH ONLY PROMPTING.
// The engine path (engineRun -> eoreader7 /v1/build -> code-build), not the
// snip box: one ask, a real testCommand, the build verified mechanically.
import { engineRun } from "./weave-build.mjs";
import fs from "node:fs";
import path from "node:path";

const ASK = process.argv[2] || "Build a podcast listening web app: index.html, for a podcast listener, with 3 parts — an episode list (each with title, date, duration, from a JS array), an audio player that plays the clicked episode, and a search box that filters the list by title live. Declared shape: a single self-contained HTML page; the parts are the episode list, the audio player, and the search box; the test is that the page renders episodes, plays on click, and filters on search.";
const OUT = process.env.OUT || "/tmp/podcast-app";
const VERIFY = `node -e "
const fs=require('fs'); const html=fs.readFileSync('index.html','utf8');
const checks=[];
checks.push(['has audio element', html.includes('<audio')||html.includes('<audio ')]); 
checks.push(['has episode data', /\\bepisodes\\b/.test(html)]);
checks.push(['click plays (script calls play)', /\\.play\\(\\)/.test(html)]);
checks.push(['search filters (filter or toLowerCase)', /filter|toLowerCase/i.test(html)]);
const bad=checks.filter(c=>!c[1]); if(bad.length){console.error('FAIL '+bad.map(b=>b[0]).join(',')); process.exit(1);} console.log('PODCAST GREEN');"`;

const t0 = Date.now();
const r = await engineRun({ ask: ASK, testCommand: VERIFY, out: OUT, model: process.env.ER7_BUILD_MODEL || "gemma2:2b" });
const ms = Date.now() - t0;

console.log(`\n════ BUILD PODCAST APP — ${Math.round(ms / 1000)}s ════`);
console.log("ok:", r.ok, "| verified:", r.verified, "| engine:", r.engine, "| draws:", r.draws, "| boxUnits:", r.boxUnits, "| mouthCalls:", r.mouthCalls);
if (r.verifyError) console.log("verifyError:", String(r.verifyError).slice(0, 200));
if (r.out && fs.existsSync(path.join(r.out, "index.html"))) console.log(`\nindex.html: ${fs.statSync(path.join(r.out, "index.html")).size} bytes`);