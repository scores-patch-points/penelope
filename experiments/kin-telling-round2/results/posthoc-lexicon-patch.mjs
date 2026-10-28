// POST-HOC DIAGNOSTIC (changes no bar; the registered fresh score is in fresh-run-console.txt and FAILED R1, R2, R3, R10).
// NOTE (correction, PIPELINE-LOG g1-3-composer-12): the sole cause of those failures was NOT a missing lexicon row. The lexicon holds those forms spelled with ё and stress marks; the checker compared tokens as written
// (round 3 folds the orthography on both sides). This script adds the two forms spelled as the text spells them, which has the same effect for the two entries the fold lists among its 65 unbound statements. Here the same frozen composer and
// checker are run on the same fresh window with those two forms added to the lexicon IN MEMORY (-> "сестра", which the lexicon holds as a headword).
import { loadWindow } from "../../../gym/kin-telling-lib.mjs";
import { runWindow } from "../../../gym/kin-telling-run.mjs";
const S = loadWindow({ name: "fresh-ix-xiv-posthoc", dir: process.argv[2], plain: process.argv[3] }, { janus: process.env.JANUS_HOME });
if (!S.lexicon.russian["сестра"]) throw new Error("the lexicon has no headword сестра");
S.lexicon.russian_forms["сестрам"] = "сестра"; S.lexicon.russian_forms["сестер"] = "сестра";
const run = await runWindow(S, { noWeave: true });
const b = run.report.bars;
const line = (k, ok, t) => console.log(`${k} ${ok ? "pass" : "FAIL"}  ${t}`);
line("R1", b.R1.pass, `${b.R1.sentences} sentences, checker failures ${b.R1.checkerFailures}, with an addressed ru/ask segment ${b.R1.withAddressedSource}, extent-only ${b.R1.extentOnly}; seamReport mouthShare ${b.R1.seam.mouthShare}, sentences without a source segment ${b.R1.seam.sentencesWithoutSource}`);
line("R2", b.R2.pass, `in-scope answerable ${b.R2.inScopeComposed}/${b.R2.inScopeAnswerable}; all answerable ${b.R2.allAnswerableComposed}/${b.R2.allAnswerable}`);
line("R3", b.R3.pass, `expected-gap ${b.R3.a.composedAsGap}/${b.R3.a.expectedGapQuestions}; gaps ${b.R3.b.stated}/${b.R3.b.gaps}; cells ${b.R3.b.named}/${b.R3.b.gapCells}`);
line("R4", b.R4.pass, `S1 ${b.R4.S1.rejectedFactSentences}/${b.R4.S1.changedFactSentences}; S2 ${b.R4.S2.rejectedFactSentences}/${b.R4.S2.changedFactSentences}`);
line("R5", b.R5.pass, `mutants ${b.R5.killed}/${b.R5.made} (${Object.entries(b.R5.byOperator).map(([k, o]) => `${k} ${o.killed}/${o.made}`).join(", ")})`);
line("R7", b.R7.pass, `recall ${b.R7.composerHits}/${b.R7.items} vs plain ${b.R7.plainHits}/${b.R7.items}`);
line("R8", b.R8.pass, `${b.R8.invariant}/${b.R8.documents}`);
line("R10", b.R10.pass, `${b.R10.exact}/${b.R10.paragraphsWithCount} paragraphs list exactly the fold's ${b.R10.foldUnbound} unbound statements`);
