#!/usr/bin/env node
/**
 * Cited essay planner: feeds sourced facts to gemma2:2b in small batches.
 * Each section gets a source事实 packet and must cite them inline as [1], [2], etc.
 */

const fs = require('fs');

const MODEL = "gemma2:2b";
const OLLAMA_URL = "http://localhost:11434";

async function callModel(messages, maxTokens = 900) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      options: { temperature: 0.7, num_predict: maxTokens },
    }),
    signal: AbortSignal.timeout(300000),
  });
  if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.message?.content || "";
}

const sections = [
  {
    label: "Introduction",
    system: `You are writing an essay about sea turtles. Use ONLY the source facts provided. Cite sources inline as [1], [2], etc. Write 400-500 words in an engaging, informative tone.`,
    sources: `[1] Sea turtles have roamed Earth's oceans for over 100 million years, surviving the asteroid event that killed the dinosaurs (Smithsonian Ocean, ocean.si.edu). [2] There are seven living species: Green (Chelonia mydas), Hawksbill (Eretmochelys imbricata), Loggerhead (Caretta caretta), Leatherback (Dermochelys coriacea), Olive Ridley (Lepidochelys olivacea), Kemp's Ridley (Lepidochelys kempii), and Flatback (Natator depressus) (NOAA Fisheries, fisheries.noaa.gov/sea-turtles). [3] Five of seven species are threatened with extinction, with Hawksbill and Kemp's Ridley classified as Critically Endangered by the IUCN (WWF, worldwildlife.org/species/sea-turtle). [4] Sea turtles are found in all of the world's oceans except the polar seas (Smithsonian Ocean). [5] The Leatherback is the largest species, growing up to 6 feet in length and weighing over 1,000 pounds (Britannica, britannica.com/animal/sea-turtle).`,
    prompt: "Write the Introduction section. Introduce sea turtles, their ancient lineage, the seven species, and why they matter. Use the source facts and cite them."
  },
  {
    label: "Biology & Life Cycle",
    system: `You are writing an essay about sea turtles. Use ONLY the source facts provided. Cite sources inline as [1], [2], etc. Write 400-500 words.`,
    sources: `[1] Female sea turtles exhibit natal homing—they return to the beach where they were born to lay eggs (Olive Ridley Project, oliveridleyproject.org/sea-turtles-of-the-world/life-cycle-of-turtles). [2] Females nest every 2-3 years, laying 80-200 eggs per nest depending on species, and make 2-8 nests per season (Olive Ridley Project). [3] Sex is determined by sand temperature during incubation: warmer temperatures produce females, cooler produce males (Olive Ridley Project). [4] Incubation takes approximately 60 days (Olive Ridley Project). [5] Hatchlings emerge at night, guided by moonlight, and enter a multi-day "swimming frenzy" to reach deep water (Olive Ridley Project). [6] The "lost years" refers to the period hatchlings spend drifting in ocean currents for 1-10 years before moving to coastal foraging areas (Olive Ridley Project). [7] Only about 1 in 1,000 hatchlings survive to adulthood (FWC, myfwc.com; Royal Society Publishing, royalsocietypublishing.org). [8] Sea turtles take 10-30 years to reach sexual maturity depending on species (Britannica). [9] Adult sea turtles can live 50-100+ years (ScienceInsights, scienceinsights.org).`,
    prompt: "Write the Biology and Life Cycle section. Cover nesting, sex determination, hatchling journey, lost years, maturation, and lifespan. Use the source facts and cite them."
  },
  {
    label: "Ecological Roles",
    system: `You are writing an essay about sea turtles. Use ONLY the source facts provided. Cite sources inline as [1], [2], etc. Write 400-500 words.`,
    sources: `[1] Green turtles graze on seagrass beds, preventing overgrowth and promoting healthier growth. This grazing encourages seagrass to grow laterally, creating more habitat (EPA ReefLink, archive.epa.gov; Coral Reef Alliance, coral.org). [2] In tropical seagrass systems, green turtle grazing alleviates negative effects of eutrophication by stimulating seagrass production and nutrient uptake (ResearchGate, Alcoverro et al. 2013). [3] Hawksbill turtles control sponge populations on coral reefs by consuming sponges, preventing them from outcompeting corals for space (Coral Reef Alliance). [4] Hawksbills create cleared areas on reef substrate, providing surfaces for coral larvae to settle (Coral Reef Alliance). [5] Leatherback turtles consume vast quantities of jellyfish, helping control jellyfish populations that can disrupt marine food chains (Smithsonian Ocean). [6] Sea turtles supply vital nutrients (nitrogen and phosphorus) to reef ecosystems through their waste (Coral Reef Alliance). [7] Sea turtles disperse coral larvae through their feces after consuming coral polyps (Coral Reef Alliance). [8] Sea turtles are considered keystone species in marine environments (MDPI Diversity journal, 2024).`,
    prompt: "Write the Ecological Roles section. Cover seagrass maintenance, coral reef health, jellyfish control, nutrient cycling, and why turtles are keystone species. Use the source facts and cite them."
  },
  {
    label: "Threats",
    system: `You are writing an essay about sea turtles. Use ONLY the source facts provided. Cite sources inline as [1], [2], etc. Write 400-500 words.`,
    sources: `[1] Before mandatory bycatch reduction, an estimated 346,500 sea turtles were caught in U.S. fisheries each year, killing roughly 71,000 annually (ScienceInsights). [2] Current estimates show interactions dropped to about 137,800 per year, and annual deaths fell by more than 90% to around 4,600 (ScienceInsights). [3] The Southeast and Gulf of Mexico shrimp trawl fishery alone accounted for up to 98% of pre-regulation bycatch (ScienceInsights). [4] An estimated 52% of all sea turtles worldwide have ingested plastic debris (ScienceInsights). [5] Research found a 22% chance of death from swallowing just one piece of plastic; at 14 pieces, mortality reaches 50%; at 226 pieces, death is essentially certain (ScienceInsights). [6] Rising sand temperatures from climate change skew sex ratios toward females, potentially leading to populations with too few males (NOAA Education, noaa.gov). [7] Sea-level rise inundates low-lying nesting beaches (NOAA Education). [8] Artificial lighting from coastal development disorients hatchlings, drawing them inland (NY DEC, dec.ny.gov). [9] In 2014, 42 countries still had legal sea turtle hunting (Smithsonian Ocean). [10] Hawksbills are particularly targeted for their shells—a 2019 survey found 6,208 hawksbill products for sale in 9 cities on China's Hainan Island (ScienceInsights).`,
    prompt: "Write the Threats section. Cover bycatch, plastic pollution, climate change, habitat loss, and illegal trade. Use the source facts and cite them."
  },
  {
    label: "Conservation",
    system: `You are writing an essay about sea turtles. Use ONLY the source facts provided. Cite sources inline as [1], [2], etc. Write 400-500 words.`,
    sources: `[1] The Endangered Species Act (ESA) of 1973 protects sea turtles in the U.S.; NOAA Fisheries and U.S. Fish and Wildlife Service share jurisdiction—NOAA for marine environments, USFWS for nesting beaches (NOAA Fisheries; Wikipedia). [2] International agreements include CITES (Convention on International Trade in Endangered Species), CMS (Convention on Conservation of Migratory Species), and the Inter-American Convention for Protection of Sea Turtles (Smithsonian Ocean). [3] Turtle Excluder Devices (TEDs) are metal grates fitted into trawl nets that allow turtles to escape; modern TEDs are 97% effective (ScienceInsights). [4] TEDs contributed to a 90%+ reduction in bycatch mortality in U.S. waters (ScienceInsights). [5] Tortuguero National Park in Costa Rica is a model for community-based conservation—researchers and locals have established successful breeding programs (Smithsonian Ocean). [6] The Kemp's Ridley recovery program uses captive-rearing to bolster the most endangered sea turtle species (NOAA Fisheries). [7] In Cape Verde, conservation actions to reduce harvesting have been implicated in a massive increase in loggerhead nesting, making it the world's largest loggerhead rookery (Royal Society Publishing). [8] The ESA was signed into law by President Nixon on December 28, 1973, and the Supreme Court found its "plain intent...was to halt and reverse the trend toward species extinction, whatever the cost" (Wikipedia).`,
    prompt: "Write the Conservation section. Cover legal protections, international agreements, TEDs, community programs, and captive-rearing. Use the source facts and cite them."
  },
  {
    label: "Conclusion",
    system: `You are writing the conclusion of an essay about sea turtles. Use ONLY the source facts provided. Cite sources inline as [1], [2], etc. Write 300-400 words with a reflective, forward-looking tone.`,
    sources: `[1] Sea turtles have survived for 100+ million years, including the asteroid that killed the dinosaurs (Smithsonian Ocean). [2] The dramatic 90%+ reduction in bycatch mortality from TEDs shows that targeted interventions work, but full population benefits are still unfolding (ScienceInsights). [3] A nesting beach protected today won't produce mature breeding adults until the 2040s or 2050s, making sustained commitment essential (ScienceInsights). [4] Green turtles were reclassified to "Least Concern" globally in 2025, a rare bright spot, though some subpopulations remain endangered (ScienceInsights). [5] Sea turtles are keystone species—when they thrive, it signals functional marine ecosystems; when they decline, it warns of broader ecological unraveling (MDPI Diversity; EPA ReefLink).`,
    prompt: "Write the Conclusion. Reflect on sea turtle resilience, the effectiveness of conservation, the long timeline for recovery, and why protecting turtles matters for ocean health. Use the source facts and cite them."
  },
];

async function main() {
  console.log(`=== Cited Sea Turtle Essay: ${MODEL} ===\n`);

  const sections_out = [];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    console.log(`[${i + 1}/${sections.length}] ${s.label}...`);

    const messages = [
      { role: "system", content: s.system + "\n\nSOURCE FACTS:\n" + s.sources },
      { role: "user", content: s.prompt },
    ];

    const start = Date.now();
    let response;
    try {
      response = await callModel(messages);
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
      sections_out.push(`[ERROR generating ${s.label}]`);
      continue;
    }
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  Done in ${elapsed}s — ${response.length} chars`);
    sections_out.push(response);
  }

  // Build references section
  const references = [
    "## References",
    "",
    "[1] Smithsonian National Museum of Natural History. \"Sea Turtles.\" Ocean Portal, ocean.si.edu/ocean-life/reptiles/sea-turtles.",
    "[2] NOAA Fisheries. \"Sea Turtles.\" fisheries.noaa.gov/sea-turtles.",
    "[3] World Wildlife Fund. \"Sea Turtle.\" worldwildlife.org/species/sea-turtle/.",
    "[4] Encyclopaedia Britannica. \"Sea Turtle.\" britannica.com/animal/sea-turtle.",
    "[5] Olive Ridley Project. \"Life Cycle of Turtles.\" oliveridleyproject.org/sea-turtles-of-the-world/life-cycle-of-turtles.",
    "[6] ScienceInsights. \"How Are Sea Turtles Endangered? Status and Top Threats.\" scienceinsights.org, 2026.",
    "[7] Royal Society Publishing. \"Is it really 1 in 1000 sea turtle hatchlings that survive to adulthood?\" Royal Society Open Science, 2026.",
    "[8] NOAA Education. \"Sea Turtles.\" noaa.gov/education/resource-collections/marine-life/sea-turtles.",
    "[9] Coral Reef Alliance. \"The Dynamic Connection Between Sea Turtles and Coral Reefs.\" coral.org, 2023.",
    "[10] Florida Fish and Wildlife Conservation Commission. \"Sea Turtle FAQ.\" myfwc.com.",
    "[11] New York State DEC. \"Sea Turtles.\" dec.ny.gov/nature/animals-fish-plants/sea-turtles.",
    "[12] EPA ReefLink Database. \"Sea Turtles.\" archive.epa.gov.",
    "[13] MDPI Diversity. \"A Systematic Review of Population Monitoring Studies of Sea Turtles.\" 2024.",
    "[14] Wikipedia. \"Endangered Sea Turtles.\" en.wikipedia.org.",
    "[15] Alcoverro, T. et al. \"Seagrass systems under nutrient loads, hydrodynamics & green turtle grazing.\" ResearchGate, 2013.",
  ];

  const title = "# Sea Turtles: Ancient Mariners of the World's Oceans\n\n*A 5-page essay with sourced citations — generated by gemma2:2b*\n\n---\n\n";
  const essay = title + sections_out.join("\n\n---\n\n") + "\n\n---\n\n" + references.join("\n");

  const outPath = "/Users/mlacy/Documents/Default Project/sea-turtles-cited.md";
  fs.writeFileSync(outPath, essay);
  console.log(`\nEssay written to: ${outPath}`);
  console.log(`Total length: ${essay.length} chars (~${Math.round(essay.length / 3000)} pages)`);
}

main().catch(console.error);
