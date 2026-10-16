#!/usr/bin/env node
/**
 * Contested-topic pipeline: navigates disagreement, produces structured output.
 *
 * ORGANS:
 *   1. CLAIM EXTRACTION — structured facts from each source
 *   2. DISAGREEMENT DETECTION — where sources conflict
 *   3. BALANCED SURFACING — must represent all positions
 *   4. AFFORDANCE TABLE — decision memo structure, not essay flow
 *   5. MID-STRIDE HANDOFF — running draft carries position forward
 *   6. MECHANICAL CITATION — source attribution
 *
 * TOPIC: Low-dose ionizing radiation safety
 * OUTPUT: Structured decision memo (6 sections, exact format)
 */

const fs = require('fs');
const MODEL = "gemma2:2b";
const OLLAMA = "http://localhost:11434";
const LOG_PATH = "/Users/mlacy/Documents/Default Project/contested-test-log.jsonl";

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

// ── SOURCE CORPUS ──

const sources = {
  ICRP: {
    label: "ICRP (Regulatory Consensus)",
    position: "LNT — no safe threshold",
    text: `The International Commission on Radiological Protection recommends a dose limit of 1 millisievert per year for the public above natural background. This recommendation is based on the linear no-threshold (LNT) model, which assumes that any dose of ionizing radiation, no matter how small, carries some risk of cancer. The LNT model extrapolates from observed effects at high doses (above 100 mSv) using a straight line to zero. ICRP states that there is no identified threshold below which radiation is completely safe. The model is precautionary: it assumes worst-case risk at low doses to protect public health. ICRP acknowledges that the LNT model is a simplification and that actual risk at low doses may be lower, but argues that the uncertainty justifies caution rather than relaxation.`,
  },
  Calabrese: {
    label: "Calabrese (Hormesis Research)",
    position: "Hormesis — low doses are beneficial",
    text: `Professor Edward Calabrese of the University of Massachusetts has published extensively arguing that low-dose ionizing radiation is beneficial, not harmful. His research, spanning over 300 publications, demonstrates that low doses of radiation (below 100 mSv) stimulate cellular repair mechanisms and reduce cancer rates. Calabrese argues that the LNT model is based on flawed statistical analysis of the Atomic Bomb Survivor data, specifically that dose averaging across exposed and unexposed body parts dilutes the true dose-response relationship. When individual organ doses are used instead of averaged whole-body doses, Calabrese claims the data show a threshold below 100 mSv with a hormetic zone below 20 mSv. His 2023 review in Environmental Research identified over 800 peer-reviewed studies supporting radiation hormesis.`,
  },
  BEIR_VII: {
    label: "BEIR VII (National Academies)",
    position: "LNT with acknowledged uncertainty",
    text: `The National Academies' Biological Effects of Ionizing Radiation VII report (2006) reaffirmed the LNT model as the most suitable basis for radiation protection. The committee reviewed over 800 studies and concluded that the preponderance of evidence supports the LNT model at low doses. However, the report explicitly acknowledges that the LNT model has significant uncertainties at doses below 100 mSv, and that the actual risk could be zero, could follow a threshold, or could even show hormesis. The report states: "The committee concludes that the balance of evidence is consistent with a linear response at low doses, but notes that this conclusion carries substantial uncertainty." The BEIR VII committee recommended continued research but declined to adopt alternative models.`,
  },
  ENS: {
    label: "ENS (Nuclear Industry)",
    position: "Negligible risk, conservative regulation",
    text: `The European Nuclear Society argues that low-dose radiation poses negligible risk and that regulatory limits are unnecessarily conservative. Citing occupational exposure data from nuclear workers (the INWORKS study), ENS notes that no statistically significant increase in cancer has been observed among workers receiving cumulative doses up to 50 mSv per year. ENS argues that the LNT model creates unnecessary fear and economic cost, and that resources would be better spent on proven health risks like air pollution and smoking. ENS does not endorse hormesis but argues that the practical risk of low-dose radiation is effectively zero for policy purposes.`,
  },
  Brenner: {
    label: "Brenner (Epidemiological Uncertainty)",
    position: "Modified LNT with practical threshold ~10 mSv",
    text: `Professor David Brenner of Columbia University has argued that while the LNT model may overestimate risk at very low doses, there is no reliable evidence that hormesis occurs in humans. Brenner's meta-analysis of lung cancer rates in radon-exposed populations found no evidence of a hormetic zone, even at doses below 50 mSv. Brenner argues that Calabrese's hormesis studies are primarily based on cell cultures and animal models, which may not translate to humans. Brenner acknowledges that the LNT model carries uncertainty but argues that abandoning it would be premature given the absence of definitive human evidence for alternatives. He recommends a "modified LNT" that includes a practical threshold of approximately 10 mSv below which risk is too small to measure.`,
  },
  Tubiana: {
    label: "Tubiana (French Academy Meta-Analysis)",
    position: "Threshold at 100-200 mSv, not LNT",
    text: `Maurice Tubiana, former president of the French Academy of Sciences, published a comprehensive meta-analysis arguing that the LNT model is not supported by the data at doses below 200 mSv. Tubiana reviewed 46 cohorts comprising over 1 million subjects and found no statistically significant increase in cancer below 200 mSv. Tubiana argued that the few positive results at low doses are confounded by healthy-worker effects, dose estimation errors, and selection biases. Tubiana did not endorse hormesis but concluded that the LNT model should be replaced with a threshold model at approximately 100-200 mSv. Tubiana's analysis was criticized for methodological choices regarding dose averaging and statistical methods.`,
  },
};

// ── ORGAN 1: CLAIM EXTRACTION ──

function extractClaims(sourceKey) {
  const src = sources[sourceKey];
  const sentences = src.text.split(/(?<=[.!?])\s+/).filter(s => s.length > 30);
  return sentences.map((s, i) => ({
    id: `${sourceKey}:${i}`,
    source: sourceKey,
    label: src.label,
    position: src.position,
    text: s,
    hasNumber: /\d/.test(s),
    hasQualifier: /however|argues|acknowledges|claims|states|notes|concludes/i.test(s),
  }));
}

// ── ORGAN 2: DISAGREEMENT DETECTION ──

function detectDisagreements(allClaims) {
  const disagreements = [];

  // Key disagreement axes
  const axes = [
    {
      topic: "Is there a safe threshold?",
      positions: {
        "no_threshold": ["ICRP"],
        "hormesis_below_20mSv": ["Calabrese"],
        "threshold_10mSv": ["Brenner"],
        "threshold_100_200mSv": ["Tubiana"],
        "negligible_risk": ["ENS"],
        "uncertain_but_LNT": ["BEIR_VII"],
      },
    },
    {
      topic: "Is low-dose radiation beneficial?",
      positions: {
        yes: ["Calabrese"],
        no: ["ICRP", "Brenner", "BEIR_VII"],
        irrelevant: ["ENS"],
        not_endorsed: ["Tubiana"],
      },
    },
    {
      topic: "Should the LNT model be replaced?",
      positions: {
        no: ["ICRP", "BEIR_VII", "Brenner"],
        yes_with_threshold: ["Tubiana"],
        yes_with_hormesis: ["Calabrese"],
        not_relevant: ["ENS"],
      },
    },
    {
      topic: "What evidence type supports the position?",
      positions: {
        epidemiological: ["ICRP", "BEIR_VII", "Brenner", "ENS"],
        mechanistic_cell: ["Calabrese"],
        meta_analysis: ["Tubiana", "Brenner"],
      },
    },
  ];

  return axes;
}

// ── ORGAN 3: BALANCED SURFACING ──

function surfaceBalanced(sectionAffordance, topK = 4) {
  // Must surface from ALL positions, not just the majority
  const sourceKeys = Object.keys(sources);
  const surfaced = {};

  for (const key of sourceKeys) {
    const claims = extractClaims(key);
    // Score by relevance to section
    const scored = claims.map(c => ({
      ...c,
      score: sectionAffordance.keywords.reduce((s, kw) =>
        s + (c.text.toLowerCase().includes(kw.toLowerCase()) ? 2 : 0), 0),
    })).filter(c => c.score > 0).sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      surfaced[key] = scored[0]; // best match from each source
    }
  }

  return surfaced;
}

// ── ORGAN 4: AFFORDANCE TABLE (Decision Memo) ──

const memoAffordances = [
  {
    section: "Question",
    label: "1. Question Under Review",
    keywords: ["risk", "dose", "radiation", "safety", "threshold"],
    materialNote: "Single framing claim from any source — sets the question",
    formatRequirement: "One sentence. What decision does this memo inform?",
    midStride: false, // starts fresh
  },
  {
    section: "Claims",
    label: "2. Competing Claims",
    keywords: ["argues", "claims", "states", "concludes", "demonstrates", "found"],
    materialNote: "Must include claims from ALL sources — balanced representation",
    formatRequirement: "Table: Claim | Source | Evidence Type | Confidence. Min 4 rows, 2+ opposing positions.",
    midStride: true,
  },
  {
    section: "Agreement",
    label: "3. Points of Agreement",
    keywords: ["acknowledges", "notes", "uncertainty", "evidence", "research"],
    materialNote: "Find claims that ALL sources share or concede",
    formatRequirement: "Bulleted list of what ALL sources agree on.",
    midStride: true,
  },
  {
    section: "Disagreement",
    label: "4. Points of Disagreement",
    keywords: ["however", "argues", "criticized", "not supported", "flawed", "debate"],
    materialNote: "Must name conflicting sources for each disagreement",
    formatRequirement: "Bulleted list. Each disagreement names the conflicting sources.",
    midStride: true,
  },
  {
    section: "Assessment",
    label: "5. Assessment",
    keywords: ["methodology", "evidence", "uncertainty", "strength", "limitation"],
    materialNote: "Material that evaluates evidence quality, not just presents claims",
    formatRequirement: "2-3 paragraphs weighing evidence. Identify better-supported claims. Note methodological concerns.",
    midStride: true,
  },
  {
    section: "Recommendation",
    label: "6. Recommendation",
    keywords: ["recommend", "should", "prudent", "caution", "further research"],
    materialNote: "Material that acknowledges uncertainty without resolving it",
    formatRequirement: "One paragraph. Acknowledge disagreement. Do not pick a side.",
    midStride: true,
  },
];

// ── ORGAN 5: CITATION (contested corpus) ──

const citePatterns = [
  // ICRP
  { p: /1\s*millisievert|1\s*mSv/i, c: "ICRP" },
  { p: /linear\s*no.threshold|LNT/i, c: ["ICRP", "BEIR_VII"] },
  { p: /no.*threshold.*safe/i, c: "ICRP" },
  { p: /precautionary/i, c: "ICRP" },

  // Calabrese
  { p: /calabrese/i, c: "Calabrese" },
  { p: /hormesis|hormetic/i, c: "Calabrese" },
  { p: /300\s*publication/i, c: "Calabrese" },
  { p: /800\s*peer.reviewed/i, c: "Calabrese" },
  { p: /below\s*20\s*mSv/i, c: "Calabrese" },
  { p: /cellular\s*repair/i, c: "Calabrese" },
  { p: /dose\s*averaging.*flawed/i, c: "Calabrese" },

  // BEIR VII
  { p: /beir\s*vii|national\s*academies/i, c: "BEIR_VII" },
  { p: /preponderance\s*of\s*evidence/i, c: "BEIR_VII" },
  { p: /balance\s*of\s*evidence/i, c: "BEIR_VII" },
  { p: /substantial\s*uncertainty/i, c: "BEIR_VII" },

  // ENS
  { p: /european\s*nuclear|ens/i, c: "ENS" },
  { p: /inworks/i, c: "ENS" },
  { p: /50\s*mSv.*year/i, c: "ENS" },
  { p: /negligible\s*risk/i, c: "ENS" },
  { p: /unnecessarily\s*conservative/i, c: "ENS" },

  // Brenner
  { p: /brenner/i, c: "Brenner" },
  { p: /modified\s*LNT/i, c: "Brenner" },
  { p: /10\s*mSv.*threshold/i, c: "Brenner" },
  { p: /radon.*meta.analysis/i, c: "Brenner" },
  { p: /cell\s*cultures.*animal.*model/i, c: "Brenner" },

  // Tubiana
  { p: /tubiana/i, c: "Tubiana" },
  { p: /french\s*academy/i, c: "Tubiana" },
  { p: /46\s*cohort/i, c: "Tubiana" },
  { p: /1\s*million\s*subject/i, c: "Tubiana" },
  { p: /200\s*mSv/i, c: "Tubiana" },
  { p: /healthy.worker\s*effect/i, c: "Tubiana" },
  { p: /100.*200\s*mSv/i, c: "Tubiana" },
];

function attachCitations(text) {
  let result = text;
  for (const { p, c } of citePatterns) {
    const match = result.match(p);
    if (match) {
      const idx = result.indexOf('.', match.index);
      if (idx !== -1 && idx - match.index < 400) {
        const tags = (Array.isArray(c) ? c : [c]).map(x => `(${x})`).join('');
        const before = result.slice(Math.max(0, idx - 10), idx + 1);
        if (!before.match(/\(\w+\)\s*$/)) {
          result = result.slice(0, idx + 1) + ' ' + tags + result.slice(idx + 1);
        }
      }
    }
  }
  return result;
}

// ── PIPELINE ──

async function main() {
  fs.writeFileSync(LOG_PATH, '');
  console.log(`=== Contested-Topic Pipeline: ${MODEL} ===\n`);
  logEntry({ type: "session_start", model: MODEL, topic: "low-dose radiation", timestamp: new Date().toISOString() });

  // Step 1: EXTRACT all claims
  console.log("Extracting claims from all sources...");
  const allClaims = {};
  const allClaimsFlat = [];
  for (const key of Object.keys(sources)) {
    allClaims[key] = extractClaims(key);
    allClaimsFlat.push(...allClaims[key]);
    console.log(`  ${key}: ${allClaims[key].length} claims`);
  }
  logEntry({ type: "claims_extracted", sources: Object.keys(allClaims).length, total: allClaimsFlat.length });

  // Step 2: DETECT disagreements
  console.log("\nDetecting disagreements...");
  const axes = detectDisagreements(allClaimsFlat);
  for (const ax of axes) {
    const posCount = Object.keys(ax.positions).length;
    console.log(`  ${ax.topic}: ${posCount} positions`);
  }
  logEntry({ type: "disagreements_detected", axes: axes.map(a => ({ topic: a.topic, positions: Object.keys(a.positions).length })) });

  // Step 3: GENERATE each section
  const outputs = [];

  for (let i = 0; i < memoAffordances.length; i++) {
    const af = memoAffordances[i];
    console.log(`\n--- [${i + 1}/${memoAffordances.length}] ${af.label} ---`);

    // Surface balanced material from ALL sources
    const surfaced = surfaceBalanced(af);
    const sourceCount = Object.keys(surfaced).length;
    console.log(`  Surfaced from ${sourceCount}/${Object.keys(sources).length} sources`);

    // Assemble evidence block — must include all positions
    const evidenceLines = Object.entries(surfaced).map(([key, claim]) =>
      `[${claim.label}] ${claim.text}`
    );

    // Include disagreement context
    const disagreementContext = axes.map(ax =>
      `${ax.topic}: ${Object.entries(ax.positions).map(([pos, srcs]) => `${pos} (${srcs.join(', ')})`).join(' vs ')}`
    ).join('\n');

    // Build prompt — format directive is the ONE allowed directive
    const systemMsg = `You are writing a structured decision memo about low-dose ionizing radiation safety.

FORMAT (you must follow this exactly):
${af.formatRequirement}

MATERIAL (from all positions — represent each fairly):
${evidenceLines.join('\n\n') || "(no material surfaced for this section)"}

DISAGREEMENT MAP:
${disagreementContext}

Write ONLY the content for this section. Do not write other sections. Do not announce the section number.`;

    // Mid-stride handoff
    let userMsg;
    if (af.midStride && outputs.length > 0) {
      userMsg = `MEMO SO FAR:\n${outputs.join('\n\n').slice(-600)}\n\nContinue with section ${af.section}.`;
    } else {
      userMsg = `Begin the memo with section: ${af.section}`;
    }

    logEntry({
      type: "prompt_assembled",
      section: af.section,
      label: af.label,
      sources_represented: Object.keys(surfaced),
      system_length: systemMsg.length,
      user_message: userMsg,
      full_messages: [{ role: "system", content: systemMsg }, { role: "user", content: userMsg }],
    });

    // Generate
    const start = Date.now();
    const prose = await llm([{ role: "system", content: systemMsg }, { role: "user", content: userMsg }], 1200);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    // Citations
    const cited = attachCitations(prose);

    logEntry({
      type: "generation",
      section: af.section,
      time_s: parseFloat(elapsed),
      length: prose.length,
      full_output: prose,
      cited_output: cited,
    });

    outputs.push(cited);
    console.log(`  Generated: ${elapsed}s, ${prose.length}ch`);
    console.log(`  Preview: ${prose.slice(0, 120)}...`);
  }

  // Assemble final memo
  const title = "# Decision Memo: Low-Dose Radiation Risk Assessment\n\n*Contested-topic pipeline · gemma2:2b · Balanced surfacing · Mechanical citation*\n*Log: contested-test-log.jsonl*\n\n---\n\n";
  const memo = title + outputs.join("\n\n---\n\n");

  const outPath = "/Users/mlacy/Documents/Default Project/radiation-decision-memo.md";
  fs.writeFileSync(outPath, memo);
  logEntry({ type: "session_complete", output: outPath, length: memo.length });

  console.log(`\n\n=== OUTPUT ===`);
  console.log(`Memo: ${outPath}`);
  console.log(`Log: ${LOG_PATH}`);
  console.log(`Length: ${memo.length} chars`);
}

main().catch(console.error);
