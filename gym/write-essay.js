#!/usr/bin/env node
/**
 * Essay planner: uses gemma2:2b via Ollama to write a 5-page essay
 * in small, focused steps so the model is never heavily prompted.
 */

const fs = require('fs');

const MODEL = "gemma2:2b";
const OLLAMA_URL = "http://localhost:11434";

async function callModel(messages, maxTokens = 800) {
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

// Each step is a small, self-contained prompt — the model never sees more than ~500 tokens of context
const steps = [
  {
    label: "Introduction",
    system: "You are a science writer. Write the opening section of an essay about sea turtles. Cover: what sea turtles are, their evolutionary history (100+ million years), and the seven species. Write in an engaging, informative tone. Aim for about 400 words.",
    user: "Write the Introduction section of a sea turtle essay."
  },
  {
    label: "Biology & Life Cycle",
    system: "You are a science writer. Write a section about sea turtle biology and life cycle. Cover: anatomy and adaptation to ocean life, nesting behavior, temperature-dependent sex determination, hatchling journey, the 'lost years', maturation age, and lifespan. Write in an engaging, informative tone. Aim for about 400 words.",
    user: "Write the Biology and Life Cycle section of a sea turtle essay."
  },
  {
    label: "Ecological Roles",
    system: "You are a science writer. Write a section about the ecological roles of sea turtles. Cover: Green turtles and seagrass maintenance, Hawksbills and coral reef health, Leatherbacks and jellyfish control, nutrient cycling from nesting beaches, and biological corridors. Write in an engaging, informative tone. Aim for about 400 words.",
    user: "Write the Ecological Roles section of a sea turtle essay."
  },
  {
    label: "Threats",
    system: "You are a science writer. Write a section about threats facing sea turtles. Cover: bycatch in commercial fisheries, coastal development, plastic pollution, climate change effects (sand temperature, sea level rise), and chemical pollution. Write in an engaging, informative tone. Aim for about 400 words.",
    user: "Write the Threats section of a sea turtle essay."
  },
  {
    label: "Conservation",
    system: "You are a science writer. Write a section about sea turtle conservation efforts. Cover: legal protections (Endangered Species Act, CITES), community-based programs like Tortuguero, turtle excluder devices, captive-rearing programs for Kemp's Ridley, and international cooperation. Write in an engaging, informative tone. Aim for about 400 words.",
    user: "Write the Conservation section of a sea turtle essay."
  },
  {
    label: "Conclusion",
    system: "You are a science writer. Write the conclusion of an essay about sea turtles. Tie together the themes of ancient resilience, ecological importance, human-caused threats, and the interconnectedness of ocean health and turtle survival. End with a call to action. Write in an engaging, informative tone. Aim for about 300 words.",
    user: "Write the Conclusion section of a sea turtle essay."
  },
];

async function main() {
  console.log(`=== Sea Turtle Essay Planner: ${MODEL} ===\n`);

  const sections = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`[${i + 1}/${steps.length}] Generating: ${step.label}...`);

    const messages = [
      { role: "system", content: step.system },
      { role: "user", content: step.user },
    ];

    const start = Date.now();
    let response;
    try {
      response = await callModel(messages);
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
      sections.push(`[ERROR generating ${step.label}]`);
      continue;
    }
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  Done in ${elapsed}s — ${response.length} chars`);

    sections.push(response);
  }

  // Assemble the full essay
  const title = "# Sea Turtles: Ancient Mariners of the World's Oceans\n\n---\n\n";
  const essay = title + sections.join("\n\n---\n\n");

  const outPath = "/Users/mlacy/Documents/Default Project/sea-turtles-essay-gemma.md";
  fs.writeFileSync(outPath, essay);
  console.log(`\nEssay written to: ${outPath}`);
  console.log(`Total length: ${essay.length} chars (~${Math.round(essay.length / 3000)} pages)`);
}

main().catch(console.error);
