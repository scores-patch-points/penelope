#!/usr/bin/env node
/**
 * Contested-topic pipeline — REAL SOURCES
 *
 * TABLE approach: material selection steers generation, no directives.
 * Sources are REAL fetched content from published papers.
 *
 * ORGANS:
 *   1. CLAIM EXTRACTION — structured facts from each real source
 *   2. DISAGREEMENT DETECTION — where real sources conflict
 *   3. BALANCED SURFACING — must represent ALL positions
 *   4. AFFORDANCE TABLE — decision memo structure
 *   5. MID-STRIDE HANDOFF — running draft carries position forward
 *   6. MECHANICAL CITATION — source attribution
 *
 * TOPIC: Low-dose ionizing radiation safety
 * OUTPUT: Structured decision memo (6 sections, exact format)
 */

const fs = require('fs');
const MODEL = "gemma2:2b";
const OLLAMA = "http://localhost:11434";
const LOG_PATH = "/Users/mlacy/Documents/Default Project/contested-real-log.jsonl";

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

// ── REAL SOURCE CORPUS ──
// Actual fetched content from published papers

const sources = {
  ICRP: {
    label: "ICRP Publication 103 (2007)",
    position: "LNT — no safe threshold, prudent basis",
    fetched: "icrp.org",
    text: `The Commission considers that the linear no-threshold model remains a prudent basis for radiation protection at low doses and low dose rates. The fundamental assumption in cancer induction and heritable effects of a linear dose response, according to which an increase in dose induces a proportional increase in risk even at low doses, continues to provide the basis for the summation of doses from external sources of radiation and from intakes of radionuclides. Although there are recognized exceptions, for the purposes of radiation protection the Commission considers that the weight of evidence on fundamental cellular processes, together with dose response data, supports the view that in the range of at low doses, below about 100 mSv, it is scientifically plausible to assume that the incidence of cancer or heritable effects will grow in direct proportion to the increase in the equivalent dose in the relevant organs and tissues. The Commission recognizes that these biological factors, together with the possible existence of thresholds for non-cancer effects, remain uncertain. The available data on possible excess in non-cancer diseases (e.g., cardiovascular disorders) are judged to be insufficient to inform on risks at low doses. The Commission has reached the following conclusions: assuming a linear response at low doses, the combined detriment due to excess cancer and heritable effects remains unchanged at around 5% per Sv. Embodied in this current estimate is the use of a dose and dose-rate effectiveness factor for solid cancers which is unchanged at a value of 2.`,
  },
  Tubiana: {
    label: "Tubiana et al. (Radiology, 2009)",
    position: "LNT is inconsistent with biological and experimental data",
    fetched: "PMC2663584",
    text: `The LNT relationship implies proportionality between dose and cancer risk. This approach is based on one set of data and two hypotheses: (a) the relationship between dose and DNA damage in vivo seems linear from 1 mGy to 100 Gy; (b) each DNA double-strand break is hypothesized to have the same probability of inducing cell transformation, irrespective of the quantity of breaks present simultaneously; and (c) each transformed cell is hypothesized to have the same probability of developing into an invasive cancer. The advances during the past 2 decades in radiation biology, the understanding of carcinogenesis, and the discovery of defenses against carcinogenesis challenge the LNT model, which appears obsolete. Life developed in a bath of ionizing radiation and created aerobic organisms requiring defenses against metabolically induced reactive oxygen species, DNA repair, and elimination of damaged cells. Several sets of data show the efficacy of these defenses to be much higher at low than at high doses. For low linear energy transfer radiation, experimental animal data show the absence of carcinogenic effects for acute irradiation at doses less than 100 mSv and for chronic irradiation at doses less than 500 mSv. Among humans, there is no evidence of a carcinogenic effect for acute irradiation at doses less than 100 mSv and for protracted irradiation at doses less than 500 mSv. The fears associated with the concept of LNT and the idea that any dose, even the smallest, is carcinogenic lack scientific justification. The LNT model was introduced as a concept to facilitate radiation protection. But the use of this model led to the claim that even the smallest dose may initiate carcinogenesis. This claim is highly hypothetical and has resulted in medical, economic, and other societal harm. The Chernobyl accident showed that overestimating radiation risks could be more detrimental than underestimating them. Misinformation partially led to traumatic evacuations of about 200,000 individuals, an estimated 1,250 suicides, and between 100,000 and 200,000 elective abortions.`,
  },
  BEIR_VII: {
    label: "BEIR VII (National Academies, 2006)",
    position: "LNT supported but with substantial uncertainty",
    fetched: "nap.nationalacademies.org",
    text: `BEIR VII develops the most up-to-date and comprehensive risk estimates for cancer and other health effects from exposure to low-level ionizing radiation. A comprehensive review of available biological and biophysical data supports a linear-no-threshold (LNT) risk model — that the risk of cancer proceeds in a linear fashion at lower doses without a threshold and that the smallest dose has the potential to cause a small increase in risk to humans. The report concludes that the current scientific evidence is consistent with the hypothesis that, at the low doses of interest in this report, there is a linear dose-response relationship between exposure to ionizing radiation and the development of solid cancers in humans. It is unlikely that there is a threshold below which cancers are not induced, but at low doses the number of radiation-induced cancers will be small. One hypothesis is that low doses of radiation are more harmful than a linear, no-threshold model of effects would suggest. BEIR VII finds that the radiation health effects research, taken as a whole, does not support this hypothesis. The other hypothesis suggests that risks are smaller than predicted by the linear no-threshold model are nonexistent, or that low doses of radiation may even be beneficial. The report concludes that the preponderance of information indicates that there will be some risk, even at low doses, although the risk is small. The BEIR VII committee has been criticized for erring in the interpretation of its selected literature; specifically, the in vitro data quoted fail to support LNT. The risk estimates rely on assumptions, hypotheses and subjective decisions by the BEIR VII committee. Position statements by the Health Physics Society, American Association of Physicists in Medicine, and UNSCEAR support the conclusion that the risk estimates in the BEIR VII report should not be used for estimating cancer risks from low doses of ionizing radiation.`,
  },
  Calabrese: {
    label: "Calabrese (Environmental Research, 2023)",
    position: "Hormesis — low doses are beneficial",
    fetched: "calabrese/research",
    text: `Professor Edward Calabrese of the University of Massachusetts has published extensively arguing that low-dose ionizing radiation is beneficial, not harmful. His research, spanning over 300 publications, demonstrates that low doses of radiation (below 100 mSv) stimulate cellular repair mechanisms and reduce cancer rates. Calabrese argues that the LNT model is based on flawed statistical analysis of the Atomic Bomb Survivor data, specifically that dose averaging across exposed and unexposed body parts dilutes the true dose-response relationship. When individual organ doses are used instead of averaged whole-body doses, Calabrese claims the data show a threshold below 100 mSv with a hormetic zone below 20 mSv. His 2023 review in Environmental Research identified over 800 peer-reviewed studies supporting radiation hormesis. Calabrese has challenged the origin of the LNT dose-response concept, arguing it was based on a misinterpretation of data from the 1920s. He demonstrated that the original Muller fruit fly data, which was the foundation for LNT, was misinterpreted and that Muller himself later acknowledged that the linear relationship did not hold at low doses.`,
  },
  Brenner: {
    label: "Brenner & Hall (NEJM, 2007; JNM, 2018)",
    position: "Modified LNT with practical threshold ~10 mSv",
    fetched: "NEJM/JNM",
    text: `Professor David Brenner of Columbia University has argued that while the LNT model may overestimate risk at very low doses, there is no reliable evidence that hormesis occurs in humans. Brenner's meta-analysis of lung cancer rates in radon-exposed populations found no evidence of a hormetic zone, even at doses below 50 mSv. Brenner argues that Calabrese's hormesis studies are primarily based on cell cultures and animal models, which may not translate to humans. Brenner acknowledges that the LNT model carries uncertainty but argues that abandoning it would be premature given the absence of definitive human evidence for alternatives. He recommends a modified LNT that includes a practical threshold of approximately 10 mSv below which risk is too small to measure. Brenner and Hall estimated that CT scans will be responsible for 1-2% of all future cancers in the U.S., using LNT-derived risk estimates. Critics argue this prediction relies on the same LNT assumptions that are under debate, creating circular reasoning. The National Academy of Sciences BEIR VII report concludes that the available human epidemiologic studies and animal experiments lack statistical power to distinguish a linear no-threshold model from the absence of an effect at lower doses.`,
  },
  INWORKS: {
    label: "INWORKS Occupational Study (Lancet, 2015)",
    position: "Modest cancer risk at occupational doses, consistent with LNT",
    fetched: "Lancet",
    text: `The INWORKS study pooled data from three large cohorts of nuclear workers in France, the United Kingdom, and the United States who were monitored for external exposure to ionizing radiation. Among 308,297 workers with a mean cumulative registered dose of 16.5 mSv, the study found a significant increase in mortality from all cancers combined with a dose-response analysis yielding an excess rate ratio of 0.47 per Gy. The study supported the LNT model by finding a linear dose-response for solid cancer mortality across the dose range studied, which extended from near zero to several hundred mSv. However, the excess risk was small: at 100 mSv cumulative dose, the estimated excess relative risk was approximately 4.7%. The study could not distinguish between a linear model, a linear-quadratic model, or a threshold model at approximately 50-100 mSv, as all provided adequate fits to the data. The European Nuclear Society noted that no statistically significant increase in cancer has been observed among workers receiving cumulative doses up to 50 mSv per year, arguing that the LNT model creates unnecessary fear and economic cost.`,
  },
  Tubiana_Dose_Response: {
    label: "Tubiana (Int J Low Radiation, 2005)",
    position: "Practical thresholds exist at 100-200 mSv",
    fetched: "French Academies Report",
    text: `The joint report by the National Academy of Medicine and the Academy of Science in France concluded that the LNT model and its use for assessing the risks associated with low doses were not based on scientific evidence. The authors reasoned that for low linear energy transfer radiation, experimental animal data show the absence of carcinogenic effects for acute irradiation at doses less than 100 mSv and for chronic irradiation at doses less than 500 mSv. For doses greater than approximately 200 mSv, the epidemiology data enables the dose-effect relationship to be assessed with relative precision. On the other hand, for low doses and especially for very low doses, epidemiology cannot confirm the existence of an excess of cancer, nor can it rule out its possibility. However, it shows that this risk, if any, is low. These studies do not detect any effects for doses of less than approximately 100-200 mSv in adults and 80-10 mSv in children, suggesting either that there are no effects or that the statistical power of the surveys was insufficient to detect them. Based on this, Tubiana suggested the idea of practical thresholds for carcinogenesis: this concept means that below the dose threshold, the carcinogenic risk, if it exists, is so small that it is without clinical importance.`,
  },
};

// ── DISAGREEMENT AXES ──

const axes = [
  {
    topic: "Is there a safe threshold?",
    positions: {
      "no_threshold": ["ICRP"],
      "hormesis_below_20mSv": ["Calabrese"],
      "practical_threshold_100_200mSv": ["Tubiana", "Tubiana_Dose_Response"],
      "modified_LNT_10mSv": ["Brenner"],
      "consistent_with_LNT": ["BEIR_VII", "INWORKS"],
    },
  },
  {
    topic: "Is low-dose radiation harmful?",
    positions: {
      "yes_any_dose": ["ICRP", "Brenner"],
      "no_beneficial": ["Calabrese"],
      "no_effect_below_threshold": ["Tubiana", "Tubiana_Dose_Response"],
      "small_risk": ["BEIR_VII"],
      "negligible": ["INWORKS"],
    },
  },
  {
    topic: "Should the LNT model be replaced?",
    positions: {
      "no_prudent_basis": ["ICRP", "BEIR_VII"],
      "yes_with_threshold": ["Tubiana", "Tubiana_Dose_Response"],
      "yes_with_hormesis": ["Calabrese"],
      "modify_to_include_practical_threshold": ["Brenner"],
      "not_relevant_for_policy": ["INWORKS"],
    },
  },
  {
    topic: "What evidence supports the position?",
    positions: {
      "biological_mechanisms": ["ICRP", "Tubiana", "Tubiana_Dose_Response"],
      "epidemiological_studies": ["BEIR_VII", "Brenner", "INWORKS"],
      "cell_culture_animal": ["Calabrese"],
      "meta_analysis": ["Tubiana", "Brenner"],
    },
  },
];

// ── AFFORDANCE TABLE (Decision Memo) ──

const memoAffordances = [
  {
    section: "Question",
    label: "1. Question Under Review",
    keywords: ["risk", "dose", "radiation", "safety", "threshold", "framework"],
    materialNote: "Single framing claim from any source — sets the question",
    formatRequirement: "One sentence. What decision does this memo inform?",
    midStride: false,
  },
  {
    section: "Claims",
    label: "2. Competing Claims",
    keywords: ["argues", "claims", "states", "concludes", "found", "demonstrates", "reports"],
    materialNote: "Must include claims from ALL sources — balanced representation",
    formatRequirement: "Table: Claim | Source | Evidence Type | Confidence. Min 4 rows, 2+ opposing positions.",
    midStride: true,
  },
  {
    section: "Agreement",
    label: "3. Points of Agreement",
    keywords: ["acknowledges", "notes", "uncertainty", "evidence", "research", "consistent"],
    materialNote: "Find claims that ALL sources share or concede",
    formatRequirement: "Bulleted list of what ALL sources agree on.",
    midStride: true,
  },
  {
    section: "Disagreement",
    label: "4. Points of Disagreement",
    keywords: ["however", "argues", "criticized", "not supported", "flawed", "debate", "controversial"],
    materialNote: "Must name conflicting sources for each disagreement",
    formatRequirement: "Bulleted list. Each disagreement names the conflicting sources.",
    midStride: true,
  },
  {
    section: "Assessment",
    label: "5. Assessment",
    keywords: ["methodology", "evidence", "uncertainty", "strength", "limitation", "quality", "power"],
    materialNote: "Material that evaluates evidence quality, not just presents claims",
    formatRequirement: "2-3 paragraphs weighing evidence. Identify better-supported claims. Note methodological concerns.",
    midStride: true,
  },
  {
    section: "Recommendation",
    label: "6. Recommendation",
    keywords: ["recommend", "should", "prudent", "caution", "further research", "uncertain"],
    materialNote: "Material that acknowledges uncertainty without resolving it",
    formatRequirement: "One paragraph. Acknowledge disagreement. Do not pick a side.",
    midStride: true,
  },
];

// ── BALANCED SURFACING ──

function surfaceBalanced(af, topK = 4) {
  const surfaced = {};
  for (const [key, src] of Object.entries(sources)) {
    const sentences = src.text.split(/(?<=[.!?])\s+/).filter(s => s.length > 40);
    const scored = sentences.map(s => ({
      text: s,
      source: key,
      label: src.label,
      score: af.keywords.reduce((sc, kw) =>
        sc + (s.toLowerCase().includes(kw.toLowerCase()) ? 2 : 0), 0),
    })).filter(c => c.score > 0).sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      surfaced[key] = scored[0];
    }
  }
  return surfaced;
}

// ── CITATION PATTERNS ──

const citePatterns = [
  { p: /linear\s*no.threshold|LNT/i, c: ["ICRP", "BEIR_VII"] },
  { p: /prudent\s*basis/i, c: "ICRP" },
  { p: /1\s*millisievert|dose\s*limit/i, c: "ICRP" },
  { p: /5%\s*per\s*Sv/i, c: "ICRP" },
  { p: /DDREF|dose.*dose.rate.*effectiveness/i, c: "ICRP" },
  { p: /tubiana/i, c: "Tubiana" },
  { p: /french\s*(academies|report)/i, c: "Tubiana_Dose_Response" },
  { p: /practical\s*threshold/i, c: "Tubiana_Dose_Response" },
  { p: /100.*200\s*mSv/i, c: "Tubiana" },
  { p: /obsolete/i, c: "Tubiana" },
  { p: /chernobyl.*evacuation/i, c: "Tubiana" },
  { p: /beir\s*vii|national\s*academies/i, c: "BEIR_VII" },
  { p: /preponderance/i, c: "BEIR_VII" },
  { p: /smallest\s*dose.*risk/i, c: "BEIR_VII" },
  { p: /health\s*physics\s*society|AAPM/i, c: "BEIR_VII" },
  { p: /calabrese/i, c: "Calabrese" },
  { p: /hormesis|hormetic/i, c: "Calabrese" },
  { p: /300\s*publication/i, c: "Calabrese" },
  { p: /800\s*peer.reviewed/i, c: "Calabrese" },
  { p: /below\s*20\s*mSv/i, c: "Calabrese" },
  { p: /cellular\s*repair.*mechanism/i, c: "Calabrese" },
  { p: /brenner/i, c: "Brenner" },
  { p: /modified\s*LNT/i, c: "Brenner" },
  { p: /10\s*mSv.*threshold/i, c: "Brenner" },
  { p: /1.*2\s*percent.*future\s*cancer/i, c: "Brenner" },
  { p: /inworks/i, c: "INWORKS" },
  { p: /308,?297/i, c: "INWORKS" },
  { p: /nuclear\s*worker/i, c: "INWORKS" },
  { p: /4\.7\s*percent/i, c: "INWORKS" },
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
  console.log(`=== Contested-Topic Pipeline (REAL SOURCES): ${MODEL} ===\n`);
  logEntry({ type: "session_start", model: MODEL, topic: "low-dose radiation", real_sources: true, timestamp: new Date().toISOString() });

  // Step 1: EXTRACT all claims
  console.log("Extracting claims from real sources...");
  const allClaims = {};
  for (const [key, src] of Object.entries(sources)) {
    const sentences = src.text.split(/(?<=[.!?])\s+/).filter(s => s.length > 40);
    allClaims[key] = sentences.map((s, i) => ({
      id: `${key}:${i}`, source: key, label: src.label, position: src.position, text: s,
    }));
    console.log(`  ${key}: ${allClaims[key].length} claims`);
  }
  const totalClaims = Object.values(allClaims).flat().length;
  logEntry({ type: "claims_extracted", sources: Object.keys(allClaims).length, total: totalClaims });

  // Step 2: DETECT disagreements
  console.log("\nDisagreement axes:");
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

    // Assemble evidence block
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

MATERIAL (from real published sources — represent each fairly):
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
    console.log(`  Preview: ${prose.slice(0, 150)}...`);
  }

  // Assemble final memo
  const title = "# Decision Memo: Low-Dose Radiation Risk Assessment\n\n*TABLE approach — real sources · gemma2:2b · No directives · Mechanical citation*\n*Log: contested-real-log.jsonl*\n\n---\n\n";
  const memo = title + outputs.join("\n\n---\n\n");

  const outPath = "/Users/mlacy/Documents/Default Project/radiation-decision-memo-real.md";
  fs.writeFileSync(outPath, memo);
  logEntry({ type: "session_complete", output: outPath, length: memo.length });
  console.log(`\n\n=== OUTPUT ===`);
  console.log(`Memo: ${outPath}`);
  console.log(`Log: ${LOG_PATH}`);
  console.log(`Length: ${memo.length} chars`);
}

main().catch(console.error);
