#!/usr/bin/env node
/**
 * Predictive essay generator with processed-memory surfacing.
 *
 * Ingested content is NOT raw text. It gets classified:
 *   - Verbatims: raw chunks
 *   - Structures: extracted entities, facts, relationships
 *   - Significance: what's surprising, novel, contradicts expectations
 *   - Gaps: what's missing from current knowledge
 *
 * When predicting what to generate, we look at:
 *   1. PRIORS (structural/domain background)
 *   2. SURPRISE (what's unexpected in the source material)
 *   3. GAPS (what the source material doesn't cover)
 *   4. STRUCTURES (concrete facts and relationships)
 */

const fs = require('fs');
const MODEL = "gemma2:2b";
const OLLAMA = "http://localhost:11434";
const LOG_PATH = "/Users/mlacy/Documents/Default Project/essay-generation-log.jsonl";

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

// ── PROCESSED MEMORY: not raw text, but classified content ──

const memory = {
  verbatims: [],   // raw chunks
  structures: [],  // extracted facts, entities, relationships
  surprises: [],   // what's unexpected or novel
  gaps: [],        // what's missing
};

function ingest(text, source) {
  // Chunk into verbatims
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.length > 30);
  for (let i = 0; i < sentences.length; i++) {
    memory.verbatims.push({ text: sentences[i], source, id: `${source}:${i}` });
  }

  // Extract structures (entities, facts, numbers)
  const numbers = text.match(/\d[\d,.]*\s*(percent|million|thousand|billion|year|species|egg|feet|pound|piece|countr)/gi) || [];
  const entities = text.match(/(?:Green|Hawksbill|Loggerhead|Leatherback|Olive Ridley|Kemp|Flatback|ESA|CITES|NOAA|TED|IUCN|WWF|USFWS)/gi) || [];
  const facts = sentences.filter(s => /\d/.test(s));

  for (const f of facts) {
    memory.structures.push({ text: f, source, type: "fact" });
  }
  for (const e of [...new Set(entities)]) {
    memory.structures.push({ text: e, source, type: "entity" });
  }
  for (const n of numbers) {
    memory.structures.push({ text: n, source, type: "number" });
  }
}

function evaluateSurprise(text, source, priorExpectations) {
  // What in this text is surprising relative to prior expectations?
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.length > 30);
  const surprising = sentences.filter(s => {
    const lower = s.toLowerCase();
    return lower.includes('however') || lower.includes('despite') ||
           lower.includes('surprisingly') || lower.includes('unexpected') ||
           lower.includes('contrary') || lower.includes('only') ||
           lower.includes('just') || lower.includes('merely') ||
           /\d+\s*percent/.test(s) || /less than|more than|over \d+/.test(s);
  });
  for (const s of surprising) {
    memory.surprises.push({ text: s, source, type: "surprising" });
  }
}

function findGaps(sectionTopic) {
  // What does the current memory NOT cover for this topic?
  const topicWords = sectionTopic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const relevant = memory.verbatims.filter(v => {
    const lower = v.text.toLowerCase();
    return topicWords.some(w => lower.includes(w));
  });
  return {
    topic: sectionTopic,
    hasContent: relevant.length > 0,
    coverage: relevant.length,
    sources: [...new Set(relevant.map(r => r.source))],
  };
}

// ── PRIORS: structural/domain background ──

const priors = {
  essayStructure: "Essays follow: Introduction (context + thesis), Body sections (evidence + analysis), Conclusion (synthesis + forward look). Transitions connect sections.",
  scientificTone: "Scientific writing: specific numbers over vague claims, mechanisms over assertions, named entities over generics.",
  seaTurtleDomain: "Sea turtles are keystone species. Ecology connects to seagrass, coral reefs, jellyfish. K-selected life history: adult survival matters more than juvenile survival.",
  threatFraming: "Threats hierarchy: direct mortality (bycatch, poaching) > habitat loss > systemic (climate, pollution). Statistics make threats concrete.",
  conservationNarrative: "Conservation arc: legal framework → enforcement → community action → measurable outcome. Recovery measured in decades.",
  lifeCycleSequence: "Life cycle is chronological: mating → nesting → incubation → hatching → swim frenzy → lost years → juvenile → maturation → reproduction.",
  conclusionConventions: "Conclusions synthesize, don't introduce new facts, echo the introduction, connect to broader significance.",
};

// ── Surfing: find what's most relevant from processed memory ──

function surfRelevant(topic, topK = 8) {
  const words = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  // Score verbatims
  const scored = memory.verbatims.map(v => ({
    ...v,
    score: words.reduce((s, w) => s + (v.text.toLowerCase().includes(w) ? 2 : 0), 0),
  })).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  // Boost surprises
  const surpriseTexts = memory.surprises
    .filter(s => words.some(w => s.text.toLowerCase().includes(w)))
    .map(s => s.text);

  // Get structures
  const relevantStructures = memory.structures
    .filter(s => words.some(w => s.text.toLowerCase().includes(w.toLowerCase())))
    .map(s => `[${s.type}] ${s.text}`);

  return {
    verbatims: scored.slice(0, topK),
    surprises: surpriseTexts.slice(0, 4),
    structures: relevantStructures.slice(0, 10),
    combinedEvidence: [
      ...surpriseTexts.slice(0, 3),
      ...scored.slice(0, 6).map(s => s.text),
    ].join(' '),
  };
}

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
// Each pattern maps a REGEX to a citation number and a specificity score.
// Higher specificity = more specific claim = higher priority when multiple
// patterns match the same sentence. Entity-only patterns (e.g. "hawksbill")
// are REMOVED — they caused stacking. Only claim-level patterns remain.

const citePatterns = [
  // ── Historical / paleontological ──
  { p: /100\s*(million|000,000)\s*years/i, c: 1, s: 3 },
  { p: /asteroid|dinosaur.*kill|killed.*dinosaur/i, c: 1, s: 3 },
  { p: /toxochely|protosteg/i, c: 1, s: 4 },

  // ── Species overview (only when listing ALL seven) ──
  { p: /seven\s*(species|living)/i, c: 2, s: 3 },
  { p: /all\s*oceans\s*except.*polar/i, c: 2, s: 3 },

  // ── Leatherback physical stats ──
  { p: /6\s*feet.*1,?000\s*pound|1,?000\s*pound.*6\s*feet/i, c: [2, 5], s: 4 },
  { p: /largest\s*species.*leatherback|leatherback.*largest/i, c: [2, 5], s: 3 },
  { p: /leathery\s*(skin|shell|carapace)/i, c: 5, s: 3 },

  // ── Conservation status ──
  { p: /critically\s*endangered/i, c: 3, s: 3 },
  { p: /threatened\s*with\s*extinction/i, c: 3, s: 3 },
  { p: /five\s*of\s*seven/i, c: 3, s: 3 },

  // ── Biology: life cycle (source: oliveridley [7], royalsoc [16]) ──
  { p: /natal\s*homing/i, c: 7, s: 4 },
  { p: /nest.*every.*2.*3\s*year/i, c: 7, s: 4 },
  { p: /80[\s\-]*200\s*egg/i, c: 7, s: 4 },
  { p: /temperature.*sex|sex.*determin.*temperature/i, c: 7, s: 4 },
  { p: /warmer.*femal|cooler.*male/i, c: 7, s: 4 },
  { p: /60\s*day.*incubat|incubat.*60\s*day/i, c: 7, s: 4 },
  { p: /moonlight/i, c: 7, s: 3 },
  { p: /swimming\s*frenzy/i, c: 7, s: 4 },
  { p: /lost\s*years/i, c: 7, s: 4 },
  { p: /caruncle/i, c: 7, s: 4 },
  { p: /50.*year.*matur|matur.*50.*year/i, c: 7, s: 3 },
  { p: /1\s*in\s*1,?000.*survive|1,?000.*1\s*in/i, c: 16, s: 4 },

  // ── Ecological roles (source: coral [9]) ──
  { p: /seagrass.*graz|graz.*seagrass/i, c: 9, s: 4 },
  { p: /sponge.*outcompete|sponge.*coral|hawksbill.*sponge/i, c: 9, s: 4 },
  { p: /jellyfish.*leatherback|leatherback.*jellyfish|consume.*jellyfish/i, c: 9, s: 3 },
  { p: /nitrogen.*phosphorus|nutrient.*waste/i, c: 9, s: 4 },
  { p: /coral\s*larvae.*disper|disper.*coral\s*larvae/i, c: 9, s: 4 },
  { p: /keystone\s*species/i, c: 9, s: 3 },

  // ── Bycatch & fishing (source: bycatch [11b], scienceinsights [11]) ──
  { p: /bycatch/i, c: 11, s: 3 },
  { p: /shrimp\s*trawl/i, c: 11, s: 3 },
  { p: /346,?500/i, c: 11, s: 4 },
  { p: /71,?000.*kill|kill.*71,?000/i, c: 11, s: 4 },
  { p: /137,?800/i, c: 11, s: 4 },
  { p: /90\s*percent.*reduction|reduction.*90\s*percent/i, c: 11, s: 4 },
  { p: /52\s*percent.*plastic|plastic.*52\s*percent/i, c: 11, s: 4 },
  { p: /22\s*percent.*death|death.*22\s*percent/i, c: 11, s: 4 },
  { p: /turtle\s*exclud|TEDs?\s*97/i, c: 11, s: 4 },
  { p: /2025.*least\s*concern/i, c: 11, s: 4 },
  { p: /2040|2050.*adult|matur.*2040|2050/i, c: 11, s: 3 },

  // ── Climate (source: climate [12]) ──
  { p: /temperature.*sex\s*ratio/i, c: 12, s: 4 },
  { p: /sea.level\s*rise|rising\s*sea\s*level/i, c: 12, s: 3 },
  { p: /light\s*pollution|artificial\s*light/i, c: 12, s: 3 },
  { p: /seawall/i, c: 12, s: 4 },

  // ── Trade & poaching (source: trade [13]) ──
  { p: /42\s*countr.*legal|legal.*42\s*countr/i, c: 13, s: 4 },
  { p: /hainan/i, c: 13, s: 4 },
  { p: /hawksbill.*amber|amber.*shell/i, c: 13, s: 3 },

  // ── Legal frameworks (source: esa [14], noaa [2]) ──
  { p: /endangered\s*species\s*act/i, c: 14, s: 4 },
  { p: /CITES/i, c: 14, s: 3 },
  { p: /CMS|inter.american\s*convention/i, c: 14, s: 3 },
  { p: /tortuguero/i, c: 14, s: 4 },
  { p: /cape\s*verde/i, c: 14, s: 4 },
  { p: /fish.*wildlife.*share|shared\s*jurisdiction/i, c: 2, s: 3 },
  { p: /multilateral\s*cooper/i, c: 2, s: 3 },
  { p: /alaskan\s*water/i, c: 2, s: 3 },
  { p: /nesting\s*habit.*erosion|erosion.*construction.*pollution/i, c: 4, s: 3 },
  { p: /slow\s*to\s*mature|long.lived.*migratory/i, c: 4, s: 3 },
];

/**
 * Split text into sentences, preserving markdown bold markers and line structure.
 * Returns array of { text, start, end } where start/end are char offsets.
 */
function splitSentences(text) {
  const sentences = [];
  // Match sentence boundaries: period/exclamation/question followed by space or end,
  // but not after common abbreviations (Dr, Mr, Mrs, Ms, etc.) or within URLs.
  const re = /(?<=[.!?])\s+(?=[A-Z*])|(?<=[.!?])$/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    sentences.push({ text: text.slice(last, m.index + 1).trim(), start: last, end: m.index + 1 });
    last = m.index + 1 + m[0].length - 1;
  }
  if (last < text.length) {
    sentences.push({ text: text.slice(last).trim(), start: last, end: text.length });
  }
  return sentences;
}

/**
 * Attach citations to prose using claim-level pattern matching.
 *
 * Strategy:
 *   1. Split text into sentences.
 *   2. For each sentence, find all matching citePatterns.
 *   3. Score by specificity (higher s = more specific = higher priority).
 *   4. Deduplicate citation numbers per sentence.
 *   5. Limit to max 2 citations per sentence.
 *   6. Validate: if a citation number has no corresponding surfaced span,
 *      remove it (prevents fabricated citations).
 *   7. Reassemble text.
 *
 * @param {string} text - Raw prose from the LLM.
 * @param {Array} surfacedSpans - Spans surfaced for this section [{source, text, score}].
 * @returns {string} Prose with [N] citation tags inserted.
 */
function attachCitations(text, surfacedSpans = []) {
  const sentences = splitSentences(text);
  const MAX_CITES = 2;

  // Map source keys to ref numbers (static lookup matching the refs array)
  const sourceToRef = {
    smithsonian: 1, noaa: 2, wwf: 3, britannica: 4, britannica_lb: 5,
    noaa_ed: 6, oliveridley: 7, fwc: 8, coral: 9, mdpi: 10,
    scienceinsights: 11, noaa_ed2: 12, trade: 13, esa: 14,
    noaa_recovery: 15, royalsoc: 16,
  };

  // For validation: check if a ref number corresponds to a source
  // that was actually surfaced for this section
  const validRefs = new Set();
  for (const span of surfacedSpans) {
    const ref = sourceToRef[span.source];
    if (ref) validRefs.add(ref);
  }
  // If no surfaced spans provided, skip validation (trust all refs)
  const validate = surfacedSpans.length > 0;

  const result = sentences.map(sent => {
    // Find all matching patterns for this sentence
    const matches = [];
    for (const { p, c, s } of citePatterns) {
      if (p.test(sent.text)) {
        const refs = Array.isArray(c) ? c : [c];
        matches.push({ refs, specificity: s || 1 });
      }
    }

    if (matches.length === 0) return sent.text;

    // Sort by specificity descending — most specific matches first
    matches.sort((a, b) => b.specificity - a.specificity);

    // Collect unique citation numbers, respecting MAX_CITES
    const seen = new Set();
    const citeNums = [];
    for (const { refs } of matches) {
      for (const r of refs) {
        if (!seen.has(r)) {
          // Validation: skip refs that don't correspond to any surfaced span
          if (validate && !validRefs.has(r)) continue;
          seen.add(r);
          citeNums.push(r);
          if (citeNums.length >= MAX_CITES) break;
        }
      }
      if (citeNums.length >= MAX_CITES) break;
    }

    if (citeNums.length === 0) return sent.text;

    // Insert citation tags at the end of the sentence, before any trailing whitespace
    const tags = citeNums.map(n => `[${n}]`).join('');
    return sent.text + tags;
  }).join(' ');

  return result;
}

/**
 * Audit: compare surfaced spans against what was actually cited in the prose.
 * Logs warnings for unused spans — these are evidence that was surfaced but
 * never grounded in the essay, which may indicate binding failures.
 *
 * @param {string} prose - The cited prose for a section.
 * @param {Array} surfacedVerbatims - [{source, text, score}] for this section.
 * @param {string} sectionLabel - Section name for logging.
 */
function auditUtilization(prose, surfacedVerbatims, sectionLabel) {
  const citedNumbers = new Set(
    (prose.match(/\[(\d+)\]/g) || []).map(m => parseInt(m.slice(1, -1)))
  );

  const sourceToRef = {
    smithsonian: 1, noaa: 2, wwf: 3, britannica: 4, britannica_lb: 5,
    noaa_ed: 6, oliveridley: 7, fwc: 8, coral: 9, mdpi: 10,
    scienceinsights: 11, noaa_ed2: 12, trade: 13, esa: 14,
    noaa_recovery: 15, royalsoc: 16,
  };

  for (const span of surfacedVerbatims) {
    const ref = sourceToRef[span.source];
    if (ref && !citedNumbers.has(ref)) {
      logEntry({
        type: "utilization_warning",
        section: sectionLabel,
        source: span.source,
        ref,
        span_text: span.text.slice(0, 100),
      });
    }
  }
}

const sections = [
  {
    label: "Introduction", position: "opener",
    topic: "what sea turtles are, 100M-year history, seven species, global distribution, why they matter",
    role: "Establish wonder. Set up the central tension: ancient resilience vs modern threats.",
    tone: "Invitational, curious, slightly awe-struck. You're opening the door.",
    comesAfter: null,
    comesBefore: "Biology & Life Cycle",
  },
  {
    label: "Biology & Life Cycle", position: "body-1",
    topic: "natal homing, nesting, sex determination, incubation, hatchling journey, lost years, maturation, lifespan",
    role: "Ground the reader in how these animals actually work. Build empathy through the gauntlet of survival.",
    tone: "Patient, detailed, building wonder through specifics. The evidence layer begins here.",
    comesAfter: "Introduction",
    comesBefore: "Ecological Roles",
  },
  {
    label: "Ecological Roles", position: "body-2",
    topic: "seagrass grazing, sponge control, jellyfish consumption, nutrient cycling, coral larvae dispersal, keystone species",
    role: "Shift from individual organism to ecosystem. Show that turtles are infrastructure, not just animals.",
    tone: "Systems-thinking. Broader lens. Each sentence should connect turtle → ecosystem.",
    comesAfter: "Biology & Life Cycle",
    comesBefore: "Threats",
  },
  {
    label: "Threats", position: "body-3",
    topic: "bycatch, plastic pollution, climate change, habitat loss, light pollution, illegal trade",
    role: "The turn. Everything we just learned is under siege. Make the reader feel the stakes.",
    tone: "Urgent but factual. Let the numbers do the emotional work. No melodrama.",
    comesAfter: "Ecological Roles",
    comesBefore: "Conservation",
  },
  {
    label: "Conservation", position: "body-4",
    topic: "ESA, CITES, TEDs, community programs, captive-rearing, recovery timeline",
    role: "Response to threats. Show that action works but recovery is generational.",
    tone: "Measured hope. Specific examples. Acknowledge the long timeline honestly.",
    comesAfter: "Threats",
    comesBefore: "Conclusion",
  },
  {
    label: "Conclusion", position: "closer",
    topic: "resilience, effectiveness, long timeline, interconnectedness, call to action",
    role: "Synthesize. Don't introduce new facts. Echo the opener's tension. Leave the reader with responsibility.",
    tone: "Reflective, weighty, forward-looking. You're closing the circle.",
    comesAfter: "Conservation",
    comesBefore: null,
  },
];

async function main() {
  fs.writeFileSync(LOG_PATH, '');
  console.log(`=== Predictive Essay Pipeline: ${MODEL} ===\n`);
  logEntry({ type: "session_start", model: MODEL, timestamp: new Date().toISOString() });

  // Ingest + process all sources
  console.log("Ingesting and processing sources...");
  for (const [key, text] of Object.entries(sources)) {
    ingest(text, key);
    evaluateSurprise(text, key, null);
  }
  logEntry({
    type: "memory_initialized",
    verbatims: memory.verbatims.length,
    structures: memory.structures.length,
    surprises: memory.surprises.length,
  });
  console.log(`  Verbatims: ${memory.verbatims.length}`);
  console.log(`  Structures: ${memory.structures.length}`);
  console.log(`  Surprises: ${memory.surprises.length}\n`);

  const outputs = [];
  const sectionSpans = [];
  const coverageLog = []; // running summary of what's been covered

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const totalSections = sections.length;
    const ordinal = i + 1;
    console.log(`--- [${ordinal}/${totalSections}] ${s.label} ---`);

    // Positional context: where are we in the essay arc?
    const priorSectionSummary = coverageLog.length > 0
      ? `Already covered: ${coverageLog.join('; ')}.`
      : "This is the opening of the essay — nothing has been said yet.";
    const nextSectionHint = s.comesBefore
      ? `After you, the essay moves to "${s.comesBefore}". End in a way that creates momentum toward that topic.`
      : "You are the final section. The essay ends after you.";

    // Step 1: PRIORS → predict structure
    const priorContext = Object.entries(priors).map(([k, v]) => `- ${k}: ${v}`).join('\n');
    const priorPrediction = await llm([
      { role: "system", content: `You are a structural predictor. Given essay conventions and domain knowledge, predict what CONTENT the next section needs.\n\nBACKGROUND:\n${priorContext}` },
      { role: "user", content: `ESSAY SO FAR (last section):\n${(outputs[i - 1] || "(beginning)").slice(0, 500)}\n\nWhat should the "${s.label}" section cover? List 5-8 specific content needs.` }
    ], 250);
    logEntry({ type: "prior_prediction", section: s.label, prediction: priorPrediction });
    console.log(`  Priors → ${priorPrediction.split('\n').length} predictions`);

    // Step 2: SURPRISE → what's unexpected about this topic?
    const surprises = memory.surprises
      .filter(su => s.topic.split(/\s+/).some(w => su.text.toLowerCase().includes(w.toLowerCase())))
      .map(su => su.text);
    logEntry({ type: "surfaces", section: s.label, surprises_found: surprises.length, surprise_texts: surprises.slice(0, 3) });
    console.log(`  Surprises: ${surprises.length}`);

    // Step 3: GAPS → what's missing?
    const gaps = findGaps(s.topic);
    logEntry({ type: "gaps", section: s.label, ...gaps });
    console.log(`  Gaps: coverage=${gaps.coverage} sources=${gaps.sources.join(',') || 'none'}`);

    // Step 4: SURF → get relevant content from processed memory
    const surfaced = surfRelevant(s.topic);
    logEntry({
      type: "content_surfaced",
      section: s.label,
      verbatims: surfaced.verbatims.length,
      structures: surfaced.structures.length,
      surprise_boosts: surfaced.surprises.length,
      evidence_length: surfaced.combinedEvidence.length,
    });
    console.log(`  Surfaced: ${surfaced.verbatims.length} verbatims, ${surfaced.structures.length} structures`);

    // Collect spans for bottom of essay
    sectionSpans.push({
      section: s.label,
      spans: surfaced.verbatims.map(v => ({ source: v.source, text: v.text, score: v.score })),
    });

    // Step 5: ASSEMBLE PROMPT → model sees priors + surprises + evidence, NOT raw corpus
    const evidenceBlock = surfaced.combinedEvidence || "(no direct evidence found — use domain knowledge)";
    const surpriseBlock = surprises.length > 0 ? `\n\nNOTABLE FINDINGS:\n${surprises.slice(0, 3).join('\n')}` : '';
    const gapNote = !gaps.hasContent ? `\n\nNOTE: Source material has limited coverage on this topic. Supplement with domain knowledge.` : '';

    const systemMsg = `You are an expert science writer. Write the "${s.label}" section of a 5-page essay about sea turtles.

SOURCE EVIDENCE (verified, from processed memory):
${evidenceBlock.slice(0, 1000)}${surpriseBlock}${gapNote}

Write engaging, flowing prose. Do NOT include citation markers — those will be added mechanically. Write 400-500 words.`;
    const userMsg = `Write the ${s.label} section. Topic: ${s.topic}`;

    logEntry({
      type: "prompt_assembled",
      section: s.label,
      system_length: systemMsg.length,
      user_message: userMsg,
      full_messages: [{ role: "system", content: systemMsg }, { role: "user", content: userMsg }],
    });

    // Step 6: GENERATE
    const start = Date.now();
    const prose = await llm([{ role: "system", content: systemMsg }, { role: "user", content: userMsg }], 1000);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    logEntry({ type: "generation", section: s.label, time_s: parseFloat(elapsed), length: prose.length, full_output: prose });
    console.log(`  Generated: ${elapsed}s, ${prose.length}ch`);

    // Step 7: CITE (with validation against surfaced spans)
    const cited = attachCitations(prose, surfaced.verbatims);
    const citeCount = (cited.match(/\[\d+\]/g) || []).length;
    logEntry({ type: "citations", section: s.label, count: citeCount, cited_text: cited });
    console.log(`  Citations: ${citeCount}\n`);

    // Utilization audit: flag surfaced spans that weren't cited
    auditUtilization(cited, surfaced.verbatims, s.label);

    outputs.push(cited);
  }

  // Assemble
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

  // Build source spans section
  const spanLines = ["---", "", "## Source Spans", "", "The following verbatim passages were surfaced from processed memory to ground each section.", ""];
  for (const { section, spans } of sectionSpans) {
    spanLines.push(`### ${section}`);
    spanLines.push("");
    for (const span of spans) {
      spanLines.push(`> **${span.source}** (score: ${span.score.toFixed(1)})`);
      spanLines.push(`> ${span.text}`);
      spanLines.push("");
    }
  }

  const title = "# Sea Turtles: Ancient Mariners of the World's Oceans\n\n*Prose: gemma2:2b · Predictive priors · Processed memory surfacing · Mechanical citation*\n*Log: essay-generation-log.jsonl*\n\n---\n\n";
  const essay = title + outputs.join("\n\n---\n\n") + "\n\n" + spanLines.join("\n") + "\n\n" + refs.join("\n");

  const outPath = "/Users/mlacy/Documents/Default Project/sea-turtles-predictive.md";
  fs.writeFileSync(outPath, essay);
  logEntry({ type: "session_complete", output: outPath, length: essay.length });
  console.log(`Essay: ${outPath}`);
  console.log(`Log: ${LOG_PATH}`);
  console.log(`Length: ${essay.length} chars (~${Math.round(essay.length / 3000)} pages)`);
}

main().catch(console.error);
