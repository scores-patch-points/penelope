#!/usr/bin/env node
/**
 * WITNESS PIPELINE v2 — session-log integrated
 *
 * Every model call, result, evaluation, and selection is logged.
 * Context folding: recent verbatim, older compressed.
 * Long evidence blocks get file-processed (pointer in log).
 * All thinking is legible in the console and the log.
 */

const fs = require('fs');
const { SessionLog, EntryType, LONG_THRESHOLD } = require('./session-log');

const OLLAMA = "http://localhost:11434";
const OUT_PATH = "/Users/mlacy/Documents/Default Project/radiation-witness-memo.md";
const SESSION_ID = `witness-${Date.now()}`;

// ── WITNESS MODELS ──

const WITNESS_MODELS = [
  { id: "gemma2:2b", label: "Gemma2 2B", weight: 1.0 },
  { id: "qwen3:30b-a3b", label: "Qwen3 30B", weight: 1.5 },
  { id: "deepseek-r1:8b", label: "DeepSeek R1 8B", weight: 1.2 },
];

const EVALUATOR_MODEL = "qwen3:8b";

// ── LLM CALL (with logging) ──

async function llm(session, model, messages, purpose, maxTokens = 900, temperature = 0.7) {
  const promptPreview = messages.map(m => `[${m.role}] ${m.content.slice(0, 150)}`).join('\n');

  session.ingest(EntryType.MODEL_CALL, {
    model: model.id || model,
    purpose,
    prompt_preview: promptPreview.slice(0, 400),
    tokens: maxTokens,
    temperature,
  });

  const res = await fetch(`${OLLAMA}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model.id || model,
      messages,
      stream: false,
      options: { temperature, num_predict: maxTokens },
    }),
    signal: AbortSignal.timeout(300000),
  });
  if (!res.ok) throw new Error(`Ollama ${model.id || model} ${res.status}`);
  const content = (await res.json()).message?.content || "";

  session.ingest(EntryType.MODEL_RESULT, {
    model: model.id || model,
    content,
    length: content.length,
  });

  return content;
}

// ── REAL SOURCE CORPUS ──

const sources = {
  ICRP: {
    label: "ICRP Publication 103 (2007)",
    position: "LNT — no safe threshold, prudent basis",
    text: `The Commission considers that the linear no-threshold model remains a prudent basis for radiation protection at low doses and low dose rates. The fundamental assumption in cancer induction and heritable effects of a linear dose response, according to which an increase in dose induces a proportional increase in risk even at low doses, continues to provide the basis for the summation of doses from external sources of radiation and from intakes of radionuclides. Although there are recognized exceptions, for the purposes of radiation protection the Commission considers that the weight of evidence on fundamental cellular processes, together with dose response data, supports the view that in the range of at low doses, below about 100 mSv, it is scientifically plausible to assume that the incidence of cancer or heritable effects will grow in direct proportion to the increase in the equivalent dose in the relevant organs and tissues.`,
  },
  Tubiana: {
    label: "Tubiana et al. (Radiology, 2009)",
    position: "LNT is inconsistent with biological and experimental data",
    text: `The LNT relationship implies proportionality between dose and cancer risk. This approach is based on one set of data and two hypotheses: (a) the relationship between dose and DNA damage in vivo seems linear from 1 mGy to 100 Gy; (b) each DNA double-strand break is hypothesized to have the same probability of inducing cell transformation. The advances during the past 2 decades in radiation biology, the understanding of carcinogenesis, and the discovery of defenses against carcinogenesis challenge the LNT model, which appears obsolete. Life developed in a bath of ionizing radiation and created aerobic organisms requiring defenses against metabolically induced reactive oxygen species, DNA repair, and elimination of damaged cells. For low linear energy transfer radiation, experimental animal data show the absence of carcinogenic effects for acute irradiation at doses less than 100 mSv and for chronic irradiation at doses less than 500 mSv. Among humans, there is no evidence of a carcinogenic effect for acute irradiation at doses less than 100 mSv. The fears associated with the concept of LNT and the idea that any dose, even the smallest, is carcinogenic lack scientific justification. The Chernobyl accident showed that overestimating radiation risks could be more detrimental than underestimating them.`,
  },
  BEIR_VII: {
    label: "BEIR VII (National Academies, 2006)",
    position: "LNT supported but with substantial uncertainty",
    text: `A comprehensive review of available biological and biophysical data supports a linear-no-threshold (LNT) risk model — that the risk of cancer proceeds in a linear fashion at lower doses without a threshold and that the smallest dose has the potential to cause a small increase in risk to humans. The report concludes that the current scientific evidence is consistent with the hypothesis that, at the low doses of interest, there is a linear dose-response relationship between exposure to ionizing radiation and the development of solid cancers in humans. It is unlikely that there is a threshold below which cancers are not induced, but at low doses the number of radiation-induced cancers will be small. The report concludes that the preponderance of information indicates that there will be some risk, even at low doses, although the risk is small. The BEIR VII committee has been criticized for erring in the interpretation of its selected literature; specifically, the in vitro data quoted fail to support LNT. Position statements by the Health Physics Society, American Association of Physicists in Medicine, and UNSCEAR support the conclusion that the risk estimates in the BEIR VII report should not be used for estimating cancer risks from low doses of ionizing radiation.`,
  },
  Calabrese: {
    label: "Calabrese (Environmental Research, 2023)",
    position: "Hormesis — low doses are beneficial",
    text: `Professor Edward Calabrese of the University of Massachusetts has published extensively arguing that low-dose ionizing radiation is beneficial, not harmful. His research, spanning over 300 publications, demonstrates that low doses of radiation (below 100 mSv) stimulate cellular repair mechanisms and reduce cancer rates. Calabrese argues that the LNT model is based on flawed statistical analysis of the Atomic Bomb Survivor data, specifically that dose averaging across exposed and unexposed body parts dilutes the true dose-response relationship. When individual organ doses are used instead of averaged whole-body doses, Calabrese claims the data show a threshold below 100 mSv with a hormetic zone below 20 mSv. His 2023 review in Environmental Research identified over 800 peer-reviewed studies supporting radiation hormesis.`,
  },
  Brenner: {
    label: "Brenner & Hall (NEJM, 2007; JNM, 2018)",
    position: "Modified LNT with practical threshold ~10 mSv",
    text: `Professor David Brenner of Columbia University has argued that while the LNT model may overestimate risk at very low doses, there is no reliable evidence that hormesis occurs in humans. Brenner's meta-analysis of lung cancer rates in radon-exposed populations found no evidence of a hormetic zone, even at doses below 50 mSv. Brenner argues that Calabrese's hormesis studies are primarily based on cell cultures and animal models, which may not translate to humans. Brenner acknowledges that the LNT model carries uncertainty but argues that abandoning it would be premature given the absence of definitive human evidence for alternatives. He recommends a modified LNT that includes a practical threshold of approximately 10 mSv below which risk is too small to measure.`,
  },
  INWORKS: {
    label: "INWORKS Occupational Study (Lancet, 2015)",
    position: "Modest cancer risk at occupational doses",
    text: `The INWORKS study pooled data from three large cohorts of nuclear workers in France, the United Kingdom, and the United States who were monitored for external exposure to ionizing radiation. Among 308,297 workers with a mean cumulative registered dose of 16.5 mSv, the study found a significant increase in mortality from all cancers combined. The study supported the LNT model by finding a linear dose-response for solid cancer mortality across the dose range studied. However, the excess risk was small: at 100 mSv cumulative dose, the estimated excess relative risk was approximately 4.7%. The study could not distinguish between a linear model, a linear-quadratic model, or a threshold model at approximately 50-100 mSv.`,
  },
};

// ── DISAGREEMENT AXES ──

const axes = [
  { topic: "Is there a safe threshold?", positions: { no_threshold: ["ICRP"], hormesis_below_20mSv: ["Calabrese"], practical_threshold_100_200mSv: ["Tubiana"], modified_LNT_10mSv: ["Brenner"], consistent_with_LNT: ["BEIR_VII", "INWORKS"] } },
  { topic: "Is low-dose radiation harmful?", positions: { yes_any_dose: ["ICRP", "Brenner"], no_beneficial: ["Calabrese"], no_effect_below_threshold: ["Tubiana"], small_risk: ["BEIR_VII"], negligible: ["INWORKS"] } },
  { topic: "Should the LNT model be replaced?", positions: { no_prudent_basis: ["ICRP", "BEIR_VII"], yes_with_threshold: ["Tubiana"], yes_with_hormesis: ["Calabrese"], modify_to_include_practical_threshold: ["Brenner"] } },
];

// ── AFFORDANCE TABLE ──

const memoAffordances = [
  { section: "Question", label: "1. Question Under Review", keywords: ["risk", "dose", "radiation", "safety", "threshold"], formatRequirement: "One sentence. What decision does this memo inform?", midStride: false },
  { section: "Claims", label: "2. Competing Claims", keywords: ["argues", "claims", "states", "concludes", "found", "demonstrates"], formatRequirement: "Table: Claim | Source | Evidence Type | Confidence. Min 4 rows, 2+ opposing positions.", midStride: true },
  { section: "Agreement", label: "3. Points of Agreement", keywords: ["acknowledges", "notes", "uncertainty", "evidence", "consistent"], formatRequirement: "Bulleted list of what ALL sources agree on.", midStride: true },
  { section: "Disagreement", label: "4. Points of Disagreement", keywords: ["however", "argues", "criticized", "not supported", "flawed"], formatRequirement: "Bulleted list. Each disagreement names the conflicting sources.", midStride: true },
  { section: "Assessment", label: "5. Assessment", keywords: ["methodology", "evidence", "uncertainty", "strength", "limitation"], formatRequirement: "2-3 paragraphs weighing evidence. Identify better-supported claims. Note methodological concerns.", midStride: true },
  { section: "Recommendation", label: "6. Recommendation", keywords: ["recommend", "should", "prudent", "caution", "further research"], formatRequirement: "One paragraph. Acknowledge disagreement. Do not pick a side.", midStride: true },
];

// ── BALANCED SURFACING ──

function surfaceBalanced(af) {
  const surfaced = {};
  for (const [key, src] of Object.entries(sources)) {
    const sentences = src.text.split(/(?<=[.!?])\s+/).filter(s => s.length > 40);
    const scored = sentences.map(s => ({
      text: s, source: key, label: src.label,
      score: af.keywords.reduce((sc, kw) => sc + (s.toLowerCase().includes(kw.toLowerCase()) ? 2 : 0), 0),
    })).filter(c => c.score > 0).sort((a, b) => b.score - a.score);
    if (scored.length > 0) surfaced[key] = scored[0];
  }
  return surfaced;
}

// ── SALIENCE GATE (with logging) ──

async function evaluateSalience(session, output, evidence, formatReq, sectionLabel) {
  const evalPrompt = `You are a salience evaluator for a structured decision memo. Rate this output on 4 dimensions.

OUTPUT TO EVALUATE:
${output.slice(0, 1500)}

SOURCE EVIDENCE:
${evidence.slice(0, 1500)}

FORMAT REQUIREMENT: ${formatReq}

Rate each dimension 1-5:
1. FORMAT_COMPLIANCE: Does it follow the exact format required?
2. EVIDENCE_FIDELITY: Does it accurately represent the source material without distortion?
3. COVERAGE: Does it represent multiple positions fairly, not just one side?
4. REASONING_QUALITY: Does it weigh evidence or just summarize?

Respond in EXACTLY this JSON-like format (no other text):
FORMAT: <1-5>
EVIDENCE: <1-5>
COVERAGE: <1-5>
REASONING: <1-5>
TOTAL: <sum>
NOTES: <one sentence on key strength or weakness>`;

  const result = await llm(session, EVALUATOR_MODEL, [
    { role: "system", content: "You are an objective evaluator. Respond only in the specified format." },
    { role: "user", content: evalPrompt },
  ], `salience_gate:${sectionLabel}`, 200, 0.3);

  const parse = (pattern, fallback) => {
    const m = result.match(pattern);
    return m ? parseInt(m[1]) : fallback;
  };

  const score = {
    format: parse(/FORMAT:\s*(\d)/, 3),
    evidence: parse(/EVIDENCE:\s*(\d)/, 3),
    coverage: parse(/COVERAGE:\s*(\d)/, 3),
    reasoning: parse(/REASONING:\s*(\d)/, 3),
    total: parse(/TOTAL:\s*(\d)/, 12),
    notes: result.match(/NOTES:\s*(.+)/)?.[1]?.trim() || "no notes",
    raw: result,
  };

  session.ingest(EntryType.SALIENCE_EVAL, {
    model: EVALUATOR_MODEL,
    section: sectionLabel,
    ...score,
  });

  return score;
}

// ── CITATION PATTERNS ──

const citePatterns = [
  { p: /linear\s*no.threshold|LNT/i, c: ["ICRP", "BEIR_VII"] },
  { p: /prudent\s*basis/i, c: "ICRP" },
  { p: /tubiana/i, c: "Tubiana" },
  { p: /beir\s*vii|national\s*academies/i, c: "BEIR_VII" },
  { p: /calabrese/i, c: "Calabrese" },
  { p: /hormesis|hormetic/i, c: "Calabrese" },
  { p: /brenner/i, c: "Brenner" },
  { p: /modified\s*LNT/i, c: "Brenner" },
  { p: /inworks/i, c: "INWORKS" },
  { p: /308,?297/i, c: "INWORKS" },
  { p: /chernobyl/i, c: "Tubiana" },
  { p: /practical\s*threshold/i, c: "Tubiana" },
];

function attachCitations(text, session) {
  let result = text;
  const cites = [];
  for (const { p, c } of citePatterns) {
    const match = result.match(p);
    if (match) {
      const idx = result.indexOf('.', match.index);
      if (idx !== -1 && idx - match.index < 400) {
        const tags = (Array.isArray(c) ? c : [c]).map(x => `(${x})`).join('');
        const before = result.slice(Math.max(0, idx - 10), idx + 1);
        if (!before.match(/\(\w+\)\s*$/)) {
          result = result.slice(0, idx + 1) + ' ' + tags + result.slice(idx + 1);
          cites.push(...(Array.isArray(c) ? c : [c]));
        }
      }
    }
  }
  if (cites.length > 0) {
    session.ingest(EntryType.CITATION, { citations: [...new Set(cites)] });
  }
  return result;
}

// ── MODEL TRACKING ──

const modelStats = {};

// ── PIPELINE ──

async function main() {
  const session = new SessionLog(SESSION_ID);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  WITNESS PIPELINE v2 — session ${SESSION_ID}`);
  console.log(`  Models: ${WITNESS_MODELS.map(m => m.label).join(' + ')}`);
  console.log(`  Evaluator: ${EVALUATOR_MODEL}`);
  console.log(`${'='.repeat(60)}\n`);

  session.ingest(EntryType.SESSION_START, {
    models: WITNESS_MODELS.map(m => ({ id: m.id, label: m.label })),
    evaluator: EVALUATOR_MODEL,
  });

  const outputs = [];

  for (let i = 0; i < memoAffordances.length; i++) {
    const af = memoAffordances[i];
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`  SECTION ${i + 1}/${memoAffordances.length}: ${af.label}`);
    console.log(`${'─'.repeat(50)}`);

    // ── SURFACE MATERIAL ──
    const surfaced = surfaceBalanced(af);
    const evidenceLines = Object.entries(surfaced).map(([key, claim]) =>
      `[${claim.label}] ${claim.text}`
    );
    const evidenceBlock = evidenceLines.join('\n\n');

    console.log(`  Surfaced ${Object.keys(surfaced).length} sources:`);
    for (const [key, claim] of Object.entries(surfaced)) {
      console.log(`    ${claim.label}: "${claim.text.slice(0, 80)}..."`);
    }

    session.ingest(EntryType.AFFORDANCE, {
      section: af.section,
      label: af.label,
      material_count: Object.keys(surfaced).length,
      sources: Object.keys(surfaced),
      evidence_length: evidenceBlock.length,
    });

    // Long evidence gets file-processed
    if (evidenceBlock.length > LONG_THRESHOLD) {
      session.ingest(EntryType.USER_FILE, {
        section: af.section,
        summary: `Evidence block for ${af.section}: ${Object.keys(surfaced).join(', ')}`,
      }, { longContent: evidenceBlock });
    }

    // ── BUILD PROMPT ──
    const disagreementContext = axes.map(ax =>
      `${ax.topic}: ${Object.entries(ax.positions).map(([pos, srcs]) => `${pos} (${srcs.join(', ')})`).join(' vs ')}`
    ).join('\n');

    const systemMsg = `You are writing a structured decision memo about low-dose ionizing radiation safety.

FORMAT (you must follow this exactly):
${af.formatRequirement}

MATERIAL (from real published sources — represent each fairly):
${evidenceBlock}

DISAGREEMENT MAP:
${disagreementContext}

Write ONLY the content for this section. Do not write other sections. Do not announce the section number.`;

    let userMsg;
    if (af.midStride && outputs.length > 0) {
      const folded = session.fold();
      userMsg = `MEMO SO FAR (folded context):\n${folded.slice(-600)}\n\nContinue with section ${af.section}.`;
    } else {
      userMsg = `Begin the memo with section: ${af.section}`;
    }

    session.ingest(EntryType.USER_INPUT, {
      content: userMsg,
      section: af.section,
    });

    const messages = [{ role: "system", content: systemMsg }, { role: "user", content: userMsg }];

    // ── SEQUENTIAL GENERATION (Ollama can't handle parallel) ──
    console.log(`\n  Generating with ${WITNESS_MODELS.length} models (sequential)...`);
    const genStart = Date.now();

    const generations = [];
    for (const model of WITNESS_MODELS) {
      const start = Date.now();
      try {
        const prose = await llm(session, model, messages, `generate:${af.section}`, 1200);
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`    ${model.label}: ${elapsed}s, ${prose.length}ch`);
        generations.push({ model, prose, elapsed: parseFloat(elapsed), error: null });
      } catch (err) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`    ${model.label}: ERROR ${err.message}`);
        generations.push({ model, prose: null, elapsed: parseFloat(elapsed), error: err.message });
      }
    }

    const totalGenTime = ((Date.now() - genStart) / 1000).toFixed(1);
    console.log(`  Total generation: ${totalGenTime}s`);

    // ── SALIENCE GATE (all logged) ──
    console.log(`\n  Salience gate (evaluator: ${EVALUATOR_MODEL})...`);
    const evaluations = [];

    for (const gen of generations) {
      if (!gen.prose) {
        evaluations.push({ model: gen.model, score: { total: 0 }, error: gen.error });
        continue;
      }
      const score = await evaluateSalience(session, gen.prose, evidenceBlock, af.formatRequirement, af.label);
      evaluations.push({ model: gen.model, prose: gen.prose, score, elapsed: gen.elapsed });
      console.log(`    ${gen.model.label}:`);
      console.log(`      FORMAT=${score.format} EVIDENCE=${score.evidence} COVERAGE=${score.coverage} REASONING=${score.reasoning} TOTAL=${score.total}`);
      console.log(`      ${score.notes}`);
    }

    // ── SELECT BEST (logged) ──
    const valid = evaluations.filter(e => e.prose && e.score.total > 0);
    valid.sort((a, b) => {
      const scoreA = a.score.total * (a.model.weight || 1);
      const scoreB = b.score.total * (b.model.weight || 1);
      return scoreB - scoreA;
    });

    const winner = valid[0];
    if (winner) {
      console.log(`\n  WINNER: ${winner.model.label} (score: ${winner.score.total})`);

      const cited = attachCitations(winner.prose, session);
      outputs.push(cited);

      if (!modelStats[winner.model.id]) modelStats[winner.model.id] = { wins: 0, sections: {} };
      modelStats[winner.model.id].wins++;
      modelStats[winner.model.id].sections[af.label] = winner.score.total;

      session.ingest(EntryType.SECTION_WIN, {
        model: winner.model.id,
        label: winner.model.label,
        score: winner.score.total,
        section: af.section,
        all_scores: evaluations.map(e => ({
          model: e.model?.id,
          total: e.score?.total || 0,
        })),
      });
    } else {
      console.log(`  NO VALID OUTPUT`);
      outputs.push("");
    }

    console.log();
  }

  // ── ASSEMBLE MEMO ──
  const title = [
    `# Decision Memo: Low-Dose Radiation Risk Assessment`,
    ``,
    `*WITNESS pipeline v2: parallel generation + salience gate*`,
    `*Models: ${WITNESS_MODELS.map(m => m.label).join(', ')}*`,
    `*Evaluator: ${EVALUATOR_MODEL}*`,
    `*Session: ${SESSION_ID}*`,
    `*Log: ${session.logPath}*`,
    ``,
    `---`,
    ``,
  ].join('\n');

  const memo = title + outputs.join("\n\n---\n\n");
  fs.writeFileSync(OUT_PATH, memo);

  // ── FINAL REPORT ──
  console.log(`${'='.repeat(60)}`);
  console.log(`  MODEL PERFORMANCE`);
  console.log(`${'='.repeat(60)}`);
  for (const [modelId, stats] of Object.entries(modelStats)) {
    const avgScore = Object.values(stats.sections).reduce((a, b) => a + b, 0) / Math.max(stats.wins, 1);
    console.log(`  ${modelId}: ${stats.wins} wins, avg score: ${avgScore.toFixed(1)}`);
    for (const [section, score] of Object.entries(stats.sections)) {
      console.log(`    ${section}: ${score}`);
    }
  }

  const logStats = session.getStats();
  console.log(`\n  Session log: ${logStats.totalEntries} entries, ${logStats.foldSize}ch folded, ${logStats.files} files`);
  console.log(`  Memo: ${OUT_PATH}`);
  console.log(`  Log: ${session.logPath}`);

  session.ingest(EntryType.SESSION_END, {
    output: OUT_PATH,
    length: memo.length,
    modelStats,
    logStats,
  });
}

main().catch(console.error);
