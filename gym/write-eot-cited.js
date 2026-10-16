#!/usr/bin/env node
/**
 * 1. Generate essay prose with gemma2:2b (no citations asked for)
 * 2. Mechanically attach citations by matching claims against a source index
 */

const fs = require('fs');
const MODEL = "gemma2:2b";
const OLLAMA_URL = "http://localhost:11434";

async function callModel(messages, maxTokens = 900) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, stream: false,
      options: { temperature: 0.7, num_predict: maxTokens } }),
    signal: AbortSignal.timeout(300000),
  });
  if (!res.ok) throw new Error(`Ollama error ${res.status}`);
  const data = await res.json();
  return data.message?.content || "";
}

// ── Source index: each entry is a claim pattern + citation ──

const sources = [
  // Evolution / History
  { pattern: /100\s*(million|000,000)\s*years/i, cite: 1 },
  { pattern: /ancient.*(turtle|reptile|lineage|species)/i, cite: 1 },
  { pattern: /dinosaur/i, cite: 1 },
  { pattern: /cretaceous/i, cite: 1 },
  { pattern: /surviv.*(asteroid|extinction|mass)/i, cite: 1 },

  // Species
  { pattern: /seven\s*(species|living)/i, cite: 2 },
  { pattern: /cheloniidae|dermochelyidae/i, cite: 2 },
  { pattern: /green\s*(turtle|sea)/i, cite: 2 },
  { pattern: /hawksbill/i, cite: 2 },
  { pattern: /loggerhead/i, cite: 2 },
  { pattern: /leatherback/i, cite: 2 },
  { pattern: /olive\s*ridley/i, cite: 2 },
  { pattern: /kemp/i, cite: 2 },
  { pattern: /flatback/i, cite: 2 },
  { pattern: /all.*ocean.*except.*polar/i, cite: 2 },
  { pattern: /polar\s*sea/i, cite: 2 },

  // Conservation status
  { pattern: /critically\s*endangered/i, cite: 3 },
  { pattern: /threatened.*extinction/i, cite: 3 },
  { pattern: /five.*seven.*threatened/i, cite: 3 },
  { pattern: /iucn/i, cite: 3 },
  { pattern: /endangered.*species/i, cite: 3 },

  // Size / Leatherback
  { pattern: /6\s*feet|6\s*ft|largest\s*species/i, cite: 5 },
  { pattern: /1,?000\s*pound/i, cite: 5 },
  { pattern: /leathery\s*(shell|carapace|skin)/i, cite: 5 },

  // Nesting
  { pattern: /natal\s*homing/i, cite: 7 },
  { pattern: /return.*beach.*born/i, cite: 7 },
  { pattern: /nest.*every.*2.*3\s*year/i, cite: 7 },
  { pattern: /80.*200\s*egg/i, cite: 7 },
  { pattern: /2.*8\s*nest/i, cite: 7 },
  { pattern: /body\s*pit/i, cite: 7 },

  // Sex determination
  { pattern: /temperature.*sex|sex.*temperature|temperature.dependent/i, cite: 7 },
  { pattern: /warmer.*femal|cooler.*male/i, cite: 7 },

  // Incubation
  { pattern: /60\s*day.*incubat/i, cite: 7 },
  { pattern: /incubat.*60\s*day/i, cite: 7 },

  // Hatchlings
  { pattern: /hatchling.*emerge|emerge.*night/i, cite: 7 },
  { pattern: /moonlight|lunar.*cues/i, cite: 7 },
  { pattern: /swimming\s*frenzy/i, cite: 7 },
  { pattern: /caruncle/i, cite: 7 },

  // Lost years
  { pattern: /lost\s*year/i, cite: 7 },
  { pattern: /drift.*current|oceanic\s*phase/i, cite: 7 },

  // Survival rate
  { pattern: /1\s*in\s*1,?000/i, cite: 8 },
  { pattern: /one\s*in\s*thousand/i, cite: 8 },
  { pattern: /0\.1\s*percent.*surviv/i, cite: 8 },

  // Maturation / lifespan
  { pattern: /10.*30\s*year.*matur/i, cite: 7 },
  { pattern: /sexual\s*matur/i, cite: 7 },
  { pattern: /50.*100\s*year.*live|lifespan/i, cite: 7 },

  // Ecological roles
  { pattern: /seagrass.*graz|graz.*seagrass/i, cite: 9 },
  { pattern: /seagrass.*overgrow|prevent.*overgrow/i, cite: 9 },
  { pattern: /laterally.*grow|grow.*laterally/i, cite: 9 },
  { pattern: /sponge.*coral|coral.*sponge/i, cite: 9 },
  { pattern: /sponge.*outcompete|outcompete.*coral/i, cite: 9 },
  { pattern: /jellyfish.*control|control.*jellyfish/i, cite: 9 },
  { pattern: /nutrient.*cycl|cycl.*nutrient/i, cite: 9 },
  { pattern: /nitrogen.*phosphorus/i, cite: 9 },
  { pattern: /coral\s*larvae.*dispers|dispers.*coral/i, cite: 9 },
  { pattern: /keystone\s*species/i, cite: 10 },

  // Bycatch
  { pattern: /bycatch/i, cite: 11 },
  { pattern: /346,?500|346500/i, cite: 11 },
  { pattern: /71,?000.*kill|kill.*71/i, cite: 11 },
  { pattern: /137,?800/i, cite: 11 },
  { pattern: /4,?600.*death|death.*4,?600/i, cite: 11 },
  { pattern: /90\s*percent.*reduc|reduc.*90\s*percent/i, cite: 11 },
  { pattern: /98\s*percent.*shrimp|shrimp.*98/i, cite: 11 },

  // Plastic
  { pattern: /52\s*percent.*plastic|plastic.*52/i, cite: 11 },
  { pattern: /one\s*piece.*plastic.*death|22\s*percent.*plastic/i, cite: 11 },
  { pattern: /14\s*piece.*50\s*percent/i, cite: 11 },
  { pattern: /226\s*piece.*certain/i, cite: 11 },
  { pattern: /plastic.*bag.*jellyfish|jellyfish.*plastic/i, cite: 11 },

  // Climate change
  { pattern: /temperature.*sex\s*ratio|sex\s*ratio.*temperat/i, cite: 12 },
  { pattern: /sea.level\s*rise/i, cite: 12 },
  { pattern: /sand\s*temperature.*female/i, cite: 12 },

  // Habitat loss
  { pattern: /coastal\s*develop|develop.*coastal/i, cite: 12 },
  { pattern: /artificial\s*light.*hatchl|hatchl.*artificial\s*light/i, cite: 12 },
  { pattern: /light\s*pollution/i, cite: 12 },
  { pattern: /disorient.*hatchl/i, cite: 12 },

  // Illegal trade
  { pattern: /illegal.*hunt|poach|trade.*shell/i, cite: 13 },
  { pattern: /42\s*countr/i, cite: 13 },
  { pattern: /hainan|6,?208.*hawksbill/i, cite: 13 },

  // Conservation - ESA
  { pattern: /endangered\s*species\s*act|ESA/i, cite: 14 },
  { pattern: /1973.*act|act.*1973/i, cite: 14 },
  { pattern: /noaa.*fish.*wild|fish.*wild.*service/i, cite: 14 },

  // International agreements
  { pattern: /CITES/i, cite: 14 },
  { pattern: /inter.american\s*convention/i, cite: 14 },

  // TEDs
  { pattern: /turtle\s*exclud|TED/i, cite: 11 },
  { pattern: /97\s*percent.*effective/i, cite: 11 },
  { pattern: /metal\s*grate.*net/i, cite: 11 },

  // Tortuguero
  { pattern: /tortuguero/i, cite: 14 },

  // Kemp's ridley recovery
  { pattern: /kemp.*ridley.*recover|captive.*rear/i, cite: 15 },

  // Cape Verde
  { pattern: /cape\s*verde/i, cite: 16 },

  // Recovery timeline
  { pattern: /2040|2050.*matur|matur.*2040|2050/i, cite: 11 },
  { pattern: /sustained.*commit|long.term.*commit/i, cite: 11 },

  // Bright spot
  { pattern: /2025.*least\s*concern|least\s*concern.*2025/i, cite: 11 },

  // Supreme Court
  { pattern: /supreme\s*court.*extinction/i, cite: 14 },
];

// ── Step 1: Generate prose ──

async function generateSection(label, topicPrompt) {
  const messages = [
    { role: "system", content: `You are an expert science writer. Write engaging, factual prose about sea turtles. Do NOT include any citations or references — just write naturally.` },
    { role: "user", content: topicPrompt },
  ];
  const start = Date.now();
  const text = await callModel(messages);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`  Generated in ${elapsed}s — ${text.length} chars`);
  return text;
}

// ── Step 2: Mechanical citation pass ──

function attachCitations(text) {
  const cited = new Set();
  let result = text;

  for (const src of sources) {
    const match = result.match(src.pattern);
    if (match && !cited.has(`${src.cite}:${match.index}`)) {
      // Find the sentence containing the match
      const sentenceEnd = result.indexOf('.', match.index);
      if (sentenceEnd !== -1 && sentenceEnd - match.index < 400) {
        const afterPeriod = result[sentenceEnd + 1];
        if (afterPeriod === ' ' || afterPeriod === '\n' || afterPeriod === undefined) {
          const insertAt = sentenceEnd + 1;
          // Check if citation already there
          const before = result.slice(Math.max(0, insertAt - 20), insertAt);
          if (!before.match(/\[\d+\]\s*$/)) {
            result = result.slice(0, insertAt) + ` [${src.cite}]` + result.slice(insertAt);
            cited.add(`${src.cite}:${match.index}`);
          }
        }
      }
    }
  }
  return result;
}

// ── Step 3: Run all sections ──

const prompts = [
  {
    label: "Introduction",
    prompt: "Write the Introduction section of a 5-page essay about sea turtles. Introduce what they are, their evolutionary history spanning 100+ million years, the seven living species (Green, Hawksbill, Loggerhead, Leatherback, Olive Ridley, Kemp's Ridley, Flatback), their global distribution across all oceans except polar seas, and why they matter. Write 400-500 words."
  },
  {
    label: "Biology & Life Cycle",
    prompt: "Write the Biology and Life Cycle section. Cover: natal homing (females return to their birth beach), nesting behavior (every 2-3 years, 80-200 eggs per nest, 2-8 nests per season), temperature-dependent sex determination (warmer = female, cooler = male), 60-day incubation, hatchling emergence at night guided by moonlight, the swimming frenzy, the 'lost years' drifting in ocean currents, maturation at 10-30 years, and lifespan of 50-100+ years. Include the statistic that only 1 in 1,000 hatchlings survive to adulthood. Write 400-500 words."
  },
  {
    label: "Ecological Roles",
    prompt: "Write the Ecological Roles section. Cover: green turtles grazing seagrass and preventing overgrowth (promoting lateral growth), hawksbills controlling sponge populations on reefs (preventing sponges from outcompeting corals), leatherbacks consuming jellyfish and controlling jellyfish blooms, nutrient cycling (nitrogen and phosphorus from turtle waste), coral larvae dispersal through turtle feces, and why sea turtles are keystone species. Write 400-500 words."
  },
  {
    label: "Threats",
    prompt: "Write the Threats section. Cover: bycatch (346,500 caught annually pre-regulation, 71,000 killed; dropped to 137,800 interactions, 4,600 deaths post-regulation; shrimp trawl fishery = 98% of bycatch), plastic ingestion (52% of turtles worldwide, 22% death chance from one piece, 50% at 14 pieces, certain death at 226 pieces), climate change (temperature skewing sex ratios, sea-level rise inundating beaches), coastal development and light pollution disorienting hatchlings, and illegal trade (42 countries with legal hunting, hawksbill shell trade on Hainan Island). Write 400-500 words."
  },
  {
    label: "Conservation",
    prompt: "Write the Conservation section. Cover: the Endangered Species Act of 1973 and its Supreme Court backing, NOAA/USFWS joint jurisdiction, international agreements (CITES, CMS, Inter-American Convention), Turtle Excluder Devices (TEDs: metal grates, 97% effective, 90%+ mortality reduction), Tortuguero community-based conservation, Kemp's Ridley captive-rearing programs, Cape Verde loggerhead recovery, and the long timeline (nesting beaches protected today won't produce adults until the 2040s-2050s). Mention that green turtles were reclassified to Least Concern in 2025. Write 400-500 words."
  },
  {
    label: "Conclusion",
    prompt: "Write the Conclusion. Reflect on sea turtles' 100-million-year resilience, the effectiveness of targeted conservation (90%+ bycatch reduction), the long recovery timeline, green turtles' 2025 Least Concern reclassification as a bright spot, and why protecting keystone species matters for ocean health. End with a forward-looking call to action. Write 300-400 words."
  },
];

const references = [
  "",
  "---",
  "",
  "## References",
  "",
  "[1] Smithsonian National Museum of Natural History. \"Sea Turtles.\" Ocean Portal.",
  "[2] NOAA Fisheries. \"Sea Turtles.\" fisheries.noaa.gov/sea-turtles.",
  "[3] World Wildlife Fund. \"Sea Turtle.\" worldwildlife.org/species/sea-turtle/.",
  "[4] Encyclopaedia Britannica. \"Sea Turtle.\" britannica.com/animal/sea-turtle.",
  "[5] Encyclopaedia Britannica. \"Leatherback Sea Turtle.\"",
  "[6] National Oceanic and Atmospheric Administration. \"Sea Turtles.\" noaa.gov.",
  "[7] Olive Ridley Project. \"Life Cycle of Turtles.\" oliveridleyproject.org.",
  "[8] Florida Fish and Wildlife Conservation Commission. \"Sea Turtle FAQ.\" myfwc.com.",
  "[9] Coral Reef Alliance. \"The Dynamic Connection Between Sea Turtles and Coral Reefs.\" coral.org.",
  "[10] MDPI Diversity. \"A Systematic Review of Population Monitoring Studies of Sea Turtles.\" 2024.",
  "[11] ScienceInsights. \"How Are Sea Turtles Endangered? Status and Top Threats.\" 2026.",
  "[12] NOAA Education. \"Sea Turtles.\" noaa.gov/education.",
  "[13] Smithsonian Ocean Portal. \"Sea Turtles\"; Wikipedia. \"Endangered Sea Turtles.\"",
  "[14] NOAA Fisheries; Wikipedia. \"Endangered Species Act.\"",
  "[15] NOAA Fisheries. \"Kemp's Ridley Sea Turtle Recovery.\"",
  "[16] Royal Society Publishing. \"Sea turtle hatchling survival.\" 2026.",
];

async function main() {
  console.log(`=== Cited Sea Turtle Essay: ${MODEL} (EOT citation pass) ===\n`);

  const sections = [];

  for (const p of prompts) {
    console.log(`[${prompts.indexOf(p) + 1}/${prompts.length}] ${p.label}...`);
    const raw = await generateSection(p.label, p.prompt);
    const cited = attachCitations(raw);
    console.log(`  Citations attached: ${(cited.match(/\[\d+\]/g) || []).length}`);
    sections.push(cited);
  }

  const title = "# Sea Turtles: Ancient Mariners of the World's Oceans\n\n*A 5-page essay — prose generated by gemma2:2b, citations mechanically attached*\n\n---\n\n";
  const essay = title + sections.join("\n\n---\n\n") + "\n\n" + references.join("\n");

  const outPath = "/Users/mlacy/Documents/Default Project/sea-turtles-eot-cited.md";
  fs.writeFileSync(outPath, essay);
  console.log(`\nEssay written to: ${outPath}`);
  console.log(`Total length: ${essay.length} chars (~${Math.round(essay.length / 3000)} pages)`);
}

main().catch(console.error);
