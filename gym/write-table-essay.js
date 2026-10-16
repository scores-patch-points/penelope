#!/usr/bin/env node
/**
 * TABLE approach: material selection steers generation, no directives.
 *
 * PRINCIPLE (from design doc):
 *   "Do not tell the model which move to make.
 *    Arrange the material so that move is the only one available,
 *    then let it complete."
 *
 * PRINCIPLE (from design doc):
 *   "A directive competes with the model's priors.
 *    Material removes the alternatives."
 *
 * PRINCIPLE (from design doc):
 *   "Hand back the running draft and let it continue rather than
 *    asking for a paragraph. A continuation has a determined next
 *    move where a request does not."
 *
 * WHAT CHANGES vs BASELINE:
 *   - No "Write the Introduction section" in the prompt
 *   - No section labels sent to the model
 *   - Material is selected by affordance: what moves are available
 *     at this position in the essay arc
 *   - The model sees the running draft and continues it
 *   - Priors shape material selection, not the prompt
 *
 * LOG records everything for comparison.
 */

const fs = require('fs');
const MODEL = "gemma2:2b";
const OLLAMA = "http://localhost:11434";
const LOG_PATH = "/Users/mlacy/Documents/Default Project/essay-table-log.jsonl";

const log = [];
function logEntry(entry) { log.push(entry); fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n'); }

async function llm(messages, maxTokens = 900) {
  const res = await fetch(`${OLLAMA}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, stream: false,
      options: { temperature: 0.7, num_predict: maxTokens } }),
    signal: AbortSignal.timeout(300000),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  return (await res.json()).message?.content || "";
}

// ── PROCESSED MEMORY ──

const memory = { verbatims: [], structures: [], surprises: [] };

function ingest(text, source) {
  text.split(/(?<=[.!?])\s+/).filter(s => s.length > 30).forEach((s, i) => {
    memory.verbatims.push({ text: s, source, id: `${source}:${i}` });
  });
  const facts = text.split(/(?<=[.!?])\s+/).filter(s => s.length > 30 && /\d/.test(s));
  for (const f of facts) memory.structures.push({ text: f, source, type: "fact" });
  const surprising = text.split(/(?<=[.!?])\s+/).filter(s => {
    const l = s.toLowerCase();
    return l.includes('however') || l.includes('despite') || l.includes('only') ||
           l.includes('just') || /\d+\s*percent/.test(s) || /less than|more than/.test(s);
  });
  for (const s of surprising) memory.surprises.push({ text: s, source });
}

function surfRelevant(topic, topK = 8) {
  const words = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const scored = memory.verbatims.map(v => ({
    ...v,
    score: words.reduce((s, w) => s + (v.text.toLowerCase().includes(w) ? 2 : 0), 0),
  })).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, topK);
  const surpriseTexts = memory.surprises
    .filter(su => words.some(w => su.text.toLowerCase().includes(w)))
    .map(su => su.text);
  return {
    verbatims: scored,
    combinedEvidence: [...surpriseTexts.slice(0, 3), ...scored.map(s => s.text)].join(' '),
  };
}

// ── AFFORDANCE TABLE ──
// What moves are available at each position?
// Material selection removes alternatives.

const affordances = [
  {
    // Introduction: nothing has been stated yet. Only move is to introduce.
    // Material should be: what things ARE (entities, taxonomy, overview)
    // Material should NOT be: analysis, arguments, conclusions
    label: "Introduction",
    move: "INTRODUCE",
    materialQuery: "sea turtle species taxonomy overview what are they",
    excludeFromEvidence: /however|despite|therefore|in conclusion|this shows/i,
    includeEntities: true,
    includeNumbers: true,
    includeAnalysis: false,
    priorNote: "No claims exist yet. The only available act is to state what exists.",
  },
  {
    // Body section 1: a claim has been introduced. Only move is to unpack it.
    // Material should be: evidence, mechanisms, specific facts
    // Material should NOT be: more overview, conclusions
    label: "Body: Biology",
    move: "ELABORATE",
    materialQuery: "nesting reproduction lifecycle mechanism how",
    excludeFromEvidence: /in conclusion|therefore|this shows/i,
    includeEntities: true,
    includeNumbers: true,
    includeAnalysis: false,
    priorNote: "Claims exist. The only available act is to elaborate them with evidence.",
  },
  {
    // Body section 2: another dimension of the topic. Only move is to expand scope.
    // Material should be: relationships, ecological connections, broader context
    // Material should NOT be: restating what was said, concluding
    label: "Body: Ecology",
    move: "EXPAND",
    materialQuery: "ecology role relationship ecosystem interaction",
    excludeFromEvidence: /in conclusion|therefore|we have seen/i,
    includeEntities: true,
    includeNumbers: true,
    includeAnalysis: true,
    priorNote: "One dimension covered. The only available act is to expand to related dimensions.",
  },
  {
    // Body section 3: complications and problems. Only move is to complicate.
    // Material should be: threats, problems, statistics, harms
    // Material should NOT be: solutions (that's conservation), conclusions
    label: "Body: Threats",
    move: "COMPLICATE",
    materialQuery: "threat danger harm loss impact death killed caught",
    excludeFromEvidence: /in conclusion|therefore|we have seen|conservation|recovery/i,
    includeEntities: true,
    includeNumbers: true,
    includeAnalysis: true,
    priorNote: "Positive dimensions covered. The only available act is to introduce problems.",
  },
  {
    // Body section 4: responses to problems. Only move is to respond.
    // Material should be: conservation actions, legal frameworks, successes
    // Material should NOT be: restating threats, new problems
    label: "Body: Conservation",
    move: "RESPOND",
    materialQuery: "conservation protection law agreement recovery success",
    excludeFromEvidence: /in conclusion|therefore|we have seen|only 1 in|threatened/i,
    includeEntities: true,
    includeNumbers: true,
    includeAnalysis: true,
    priorNote: "Problems stated. The only available act is to address them.",
  },
  {
    // Conclusion: all dimensions covered. Only move is to gather.
    // Material should be: synthesis cues, broader significance, forward-looking
    // Material should NOT be: new facts, new arguments
    label: "Conclusion",
    move: "GATHER",
    materialQuery: "future hope resilience significance why matters",
    excludeFromEvidence: /\d+\s*percent|only 1 in|before regulation|now:/i,
    includeEntities: false,
    includeNumbers: false,
    includeAnalysis: true,
    priorNote: "All dimensions covered. The only available act is to gather them into a whole.",
  },
];

// ── Source data ──

const sources = {
  smithsonian: `Sea turtles have roamed Earth's oceans for over 100 million years. They survived the asteroid event that killed the dinosaurs 66 million years ago. There are seven living species: Green (Chelonia mydas), Hawksbill (Eretmochelys imbricata), Loggerhead (Caretta caretta), Leatherback (Dermochelys coriacea), Olive Ridley (Lepidochelys olivacea), Kemp's Ridley (Lepidochelys kempii), and Flatback (Natator depressus). Sea turtles are found in all oceans except the polar seas. The Leatherback is the largest species, growing up to 6 feet and over 1,000 pounds. Its carapace is covered with tough, leathery skin. Many species in the Toxochelyidae and Protostegidae families went extinct during the asteroid event, but ancestors of modern sea turtles survived.`,
  noaa: `NOAA Fisheries and the U.S. Fish and Wildlife Service share jurisdiction for sea turtle recovery. NOAA leads in marine environments; USFWS on nesting beaches. Major threats include habitat damage, accidental capture, entanglement in marine debris, and vessel strikes. Recovery requires multilateral cooperation. Some species range into Alaskan waters.`,
  wwf: `Five of seven sea turtle species are threatened with extinction. Two are Critically Endangered. WWF works for recovery. Sea turtles range 2 to 6 feet. Habitats include open water and coasts.`,
  britannica: `The leatherback lacks scales and a hard shell. Most sea turtles are carnivorous and prefer warm coastal waters. The leatherback inhabits pelagic environments. They are slow to mature, long-lived, and migratory. Minimum time from hatching to first reproduction is about 10 to 15 years. Nesting habitats threatened by erosion, construction, pollution, traffic, and rising sea levels.`,
  oliveridley: `Females exhibit natal homing, returning to their birth beach. Nesting every 2-3 years, 80-200 eggs per nest, 2-8 nests per season. Nesting takes 45 minutes to 5 hours. Sex determined by sand temperature: warmer = female, cooler = male. Incubation takes about 60 days. Hatchlings use caruncle to break shells. They emerge at night guided by moonlight. Enter a multi-day swimming frenzy. The lost years: 1-10 years drifting in currents. Only 1 in 1,000 survive to adulthood. Can take up to 50 years to reach sexual maturity.`,
  scienceinsights: `Six of seven species threatened. Hawksbill and Kemp's ridley critically endangered. Loggerheads and olive ridleys vulnerable. Leatherback vulnerable but East Pacific subpopulation declined 80% in 40 years. Green turtles reclassified Least Concern in 2025. Before regulation: 346,500 caught annually in U.S., 71,000 killed. Now: 137,800 interactions, 4,600 deaths (90%+ reduction). Shrimp trawl = 98% of bycatch. 52% of turtles worldwide ingested plastic. 22% death from one piece; 50% at 14 pieces; certain at 226. TEDs 97% effective. Protected beaches won't produce adults until 2040s-2050s.`,
  coral: `Green turtles graze seagrass, preventing overgrowth that shades corals. Grazing promotes lateral seagrass growth. Hawksbills control sponge populations, preventing sponges from outcompeting corals. Create cleared areas for coral larvae. Leatherbacks consume jellyfish. Turtles supply nitrogen and phosphorus through waste. Disperse coral larvae through feces. Keystone species.`,
  bycatch: `Bycatch: incidental capture in fishing gear. Hundreds of thousands caught annually in shrimp trawls, longlines, gillnets. Drown when caught. Loggerhead and hawksbill especially vulnerable. TEDs are metal grates in trawl nets. NOAA evaluating trawl bycatch since late 1980s.`,
  climate: `Climate change alters sand temperatures affecting hatchling sex ratios. Rising sea levels inundate nesting beaches. Artificial lights draw hatchlings inland. Seawalls block nesting access.`,
  trade: `Despite CITES, turtles hunted for shells, meat, eggs. Hawksbill targeted for amber shell. In 2014, 42 countries had legal hunting. 2019 survey found 6,208 hawksbill products in 9 Hainan Island cities.`,
  esa: `Endangered Species Act signed December 28, 1973 by Nixon. Supreme Court: intent was to halt and reverse species extinction whatever the cost. Administered by NOAA and USFWS. International agreements: CITES, CMS, Inter-American Convention. Cape Verde: conservation actions led to massive loggerhead increase, now world's largest rookery. Kemp's Ridley uses captive-rearing. Tortuguero: model community conservation.`,
  royalsoc: `Only 1 in 1,000 hatchlings survive to adulthood — supported by empirical data. Conservation can increase adult survival. Population trajectories vary widely across species and populations.`,
};

// ── Citation patterns ──

const citePatterns = [
  { p: /100\s*(million|000,000)\s*years/i, c: 1 },
  { p: /dinosaur/i, c: 1 },
  { p: /seven\s*(species|living)/i, c: 2 },
  { p: /green\s*(turtle|sea\s*turtle)/i, c: 2 },
  { p: /hawksbill/i, c: 2 },
  { p: /loggerhead/i, c: 2 },
  { p: /leatherback/i, c: [2, 5] },
  { p: /olive\s*ridley/i, c: 2 },
  { p: /kemp/i, c: 2 },
  { p: /flatback/i, c: 2 },
  { p: /critically\s*endangered/i, c: 3 },
  { p: /threatened.*extinction/i, c: 3 },
  { p: /6\s*feet|largest\s*species/i, c: 5 },
  { p: /1,?000\s*pound/i, c: 5 },
  { p: /natal\s*homing/i, c: 7 },
  { p: /nest.*every.*2.*3\s*year/i, c: 7 },
  { p: /80.*200\s*egg/i, c: 7 },
  { p: /temperature.*sex|sex.*temperature/i, c: 7 },
  { p: /warmer.*femal|cooler.*male/i, c: 7 },
  { p: /60\s*day/i, c: 7 },
  { p: /moonlight/i, c: 7 },
  { p: /swimming\s*frenzy/i, c: 7 },
  { p: /lost\s*year/i, c: 7 },
  { p: /1\s*in\s*1,?000/i, c: 8 },
  { p: /50.*100\s*year/i, c: 7 },
  { p: /seagrass.*graz|graz.*seagrass/i, c: 9 },
  { p: /sponge.*coral/i, c: 9 },
  { p: /jellyfish.*control/i, c: 9 },
  { p: /nitrogen.*phosphorus/i, c: 9 },
  { p: /coral\s*larvae/i, c: 9 },
  { p: /keystone/i, c: 10 },
  { p: /bycatch/i, c: 11 },
  { p: /346,?500/i, c: 11 },
  { p: /71,?000/i, c: 11 },
  { p: /137,?800/i, c: 11 },
  { p: /90\s*percent/i, c: 11 },
  { p: /52\s*percent.*plastic/i, c: 11 },
  { p: /22\s*percent.*death/i, c: 11 },
  { p: /temperature.*sex\s*ratio/i, c: 12 },
  { p: /sea.level\s*rise/i, c: 12 },
  { p: /light\s*pollution/i, c: 12 },
  { p: /42\s*countr/i, c: 13 },
  { p: /endangered\s*species\s*act/i, c: 14 },
  { p: /CITES/i, c: 14 },
  { p: /turtle\s*exclud|TED/i, c: 11 },
  { p: /97\s*percent/i, c: 11 },
  { p: /tortuguero/i, c: 14 },
  { p: /cape\s*verde/i, c: 16 },
  { p: /2025.*least\s*concern/i, c: 11 },
  { p: /2040|2050.*matur/i, c: 11 },
];

function attachCitations(text) {
  let result = text;
  for (const { p, c } of citePatterns) {
    const match = result.match(p);
    if (match) {
      const idx = result.indexOf('.', match.index);
      if (idx !== -1 && idx - match.index < 400) {
        const tags = (Array.isArray(c) ? c : [c]).map(x => `[${x}]`).join('');
        const before = result.slice(Math.max(0, idx - 5), idx + 1);
        if (!before.match(/\[\d+\]/)) {
          result = result.slice(0, idx + 1) + tags + result.slice(idx + 1);
        }
      }
    }
  }
  return result;
}

// ── Source spans for bottom of essay ──

const sectionSpans = [];

async function main() {
  fs.writeFileSync(LOG_PATH, '');
  console.log(`=== TABLE Approach: ${MODEL} — material steers, no directives ===\n`);
  logEntry({ type: "session_start", model: MODEL, approach: "TABLE", timestamp: new Date().toISOString() });

  // Ingest
  for (const [key, text] of Object.entries(sources)) ingest(text, key);
  logEntry({ type: "memory_initialized", verbatims: memory.verbatims.length, structures: memory.structures.length, surprises: memory.surprises.length });
  console.log(`Memory: ${memory.verbatims.length}v ${memory.structures.length}s ${memory.surprises.length}surp\n`);

  let runningDraft = "";

  for (let i = 0; i < affordances.length; i++) {
    const af = affordances[i];
    console.log(`--- [${i + 1}/${affordances.length}] ${af.label} (move: ${af.move}) ---`);

    // Step 1: AFFORDANCE → what material belongs on the table?
    // The affordance determines what we search for, not what we tell the model.
    const surfaced = surfRelevant(af.materialQuery);

    // Filter by affordance: exclude material that affords wrong moves
    let filteredEvidence = surfaced.combinedEvidence;
    if (af.excludeFromEvidence) {
      const sentences = filteredEvidence.split(/(?<=[.!?])\s+/);
      filteredEvidence = sentences.filter(s => !af.excludeFromEvidence.test(s)).join(' ');
    }

    logEntry({
      type: "affordance",
      section: af.label,
      move: af.move,
      priorNote: af.priorNote,
      materialQuery: af.materialQuery,
      rawSurfaced: surfaced.verbatims.length,
      filteredEvidence_length: filteredEvidence.length,
    });
    console.log(`  Affordance: ${af.move} — ${af.priorNote}`);
    console.log(`  Material: ${surfaced.verbatims.length} surfaced, ${filteredEvidence.length}ch after filter`);

    // Step 2: ASSEMBLE PROMPT → mid-stride handoff
    // No directive. No section label. Just: here is what exists, continue it.
    const systemMsg = `You are writing a long-form essay about sea turtles. The following is source material that has been surfaced from processed memory. Continue the essay using this material as your factual basis. Write naturally, as if continuing a draft already in progress. Do NOT include citation markers. Do NOT announce what section you are writing. Just write.`;

    // Mid-stride handoff: give the running draft, let it continue
    const handoff = runningDraft.length > 0
      ? `\n\nESSAY SO FAR:\n${runningDraft.slice(-800)}\n\nContinue the essay from where it left off.`
      : `\n\nBegin the essay.`;

    const evidenceMsg = filteredEvidence.length > 0
      ? `\n\nSOURCE MATERIAL:\n${filteredEvidence.slice(0, 1000)}`
      : '';

    const userMsg = `${handoff}${evidenceMsg}`;

    logEntry({
      type: "prompt_assembled",
      section: af.label,
      approach: "TABLE",
      hasRunningDraft: runningDraft.length > 0,
      draftLength: runningDraft.length,
      system_length: systemMsg.length,
      user_message_preview: userMsg.slice(0, 200),
      full_messages: [{ role: "system", content: systemMsg }, { role: "user", content: userMsg }],
    });

    // Step 3: GENERATE → model continues, doesn't start fresh
    const start = Date.now();
    const prose = await llm([{ role: "system", content: systemMsg }, { role: "user", content: userMsg }], 1000);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    // Step 4: APPEND to running draft (mid-stride handoff)
    runningDraft += (runningDraft.length > 0 ? "\n\n" : "") + prose;

    logEntry({
      type: "generation",
      section: af.label,
      move: af.move,
      time_s: parseFloat(elapsed),
      length: prose.length,
      draftLengthAfter: runningDraft.length,
      full_output: prose,
    });
    console.log(`  Generated: ${elapsed}s, ${prose.length}ch (draft: ${runningDraft.length}ch)`);

    // Step 5: CITE
    const cited = attachCitations(prose);
    const citeCount = (cited.match(/\[\d+\]/g) || []).length;
    logEntry({ type: "citations", section: af.label, count: citeCount, cited_text: cited });
    console.log(`  Citations: ${citeCount}`);

    // Collect spans
    sectionSpans.push({
      section: af.label,
      move: af.move,
      spans: surfaced.verbatims.map(v => ({ source: v.source, text: v.text, score: v.score })),
    });
    console.log();
  }

  // Assemble
  const spanLines = ["---", "", "## Source Spans", "", "Verbatim passages surfaced from processed memory. Material selection was governed by the affordance table — what moves were available at each position in the essay arc.", ""];
  for (const { section, move, spans } of sectionSpans) {
    spanLines.push(`### ${section} (move: ${move})`);
    spanLines.push("");
    for (const span of spans) {
      spanLines.push(`> **${span.source}** (score: ${span.score.toFixed(1)})`);
      spanLines.push(`> ${span.text}`);
      spanLines.push("");
    }
  }

  const refs = [
    "", "---", "",
    "## References", "",
    "[1] Smithsonian National Museum of Natural History. \"Sea Turtles.\" Ocean Portal.",
    "[2] NOAA Fisheries. \"Sea Turtles.\" fisheries.noaa.gov/sea-turtles.",
    "[3] World Wildlife Fund. \"Sea Turtle.\" worldwildlife.org/species/sea-turtle/.",
    "[4] Encyclopaedia Britannica. \"Sea Turtle.\" britannica.com/animal/sea-turtle.",
    "[5] Encyclopaedia Britannica. \"Leatherback Sea Turtle.\"",
    "[6] NOAA Education. \"Sea Turtles.\" noaa.gov/education.",
    "[7] Olive Ridley Project. \"Life Cycle of Turtles.\" oliveridleyproject.org.",
    "[8] Florida Fish and Wildlife Conservation Commission. \"Sea Turtle FAQ.\" myfwc.com.",
    "[9] Coral Reef Alliance. \"The Dynamic Connection Between Sea Turtles and Coral Reefs.\" coral.org.",
    "[10] MDPI Diversity. \"A Systematic Review of Population Monitoring Studies of Sea Turtles.\" 2024.",
    "[11] ScienceInsights. \"How Are Sea Turtles Endangered? Status and Top Threats.\" 2026.",
    "[12] NOAA Education. \"Sea Turtles.\" noaa.gov.",
    "[13] Smithsonian Ocean Portal; Wikipedia. \"Endangered Sea Turtles.\"",
    "[14] NOAA Fisheries; Wikipedia. \"Endangered Species Act.\"",
    "[15] NOAA Fisheries. \"Kemp's Ridley Sea Turtle Recovery.\"",
    "[16] Royal Society Publishing. \"Sea turtle hatchling survival.\" 2026.",
  ];

  const title = "# Sea Turtles: Ancient Mariners of the World's Oceans\n\n*TABLE approach: material selection steers generation, no directives*\n*Prose: gemma2:2b · Affordance-based surfacing · Mechanical citation*\n*Log: essay-table-log.jsonl*\n\n---\n\n";
  const essay = title + attachCitations(runningDraft) + "\n\n" + spanLines.join("\n") + "\n\n" + refs.join("\n");

  const outPath = "/Users/mlacy/Documents/Default Project/sea-turtles-table.md";
  fs.writeFileSync(outPath, essay);
  logEntry({ type: "session_complete", output: outPath, length: essay.length, approach: "TABLE" });
  console.log(`Essay: ${outPath}`);
  console.log(`Log: ${LOG_PATH}`);
  console.log(`Length: ${essay.length} chars (~${Math.round(essay.length / 3000)} pages)`);
}

main().catch(console.error);
