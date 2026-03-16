import OpenAI from "openai";
import { TEMPLATES } from "./templates";
import type { BrandDnaData, PromptsJson } from "@/types";

const PROMPT_GENERATION_INSTRUCTIONS = `
You are a prompt engineer specializing in AI image generation for DTC brands.

Your job: For each ad template, generate TWO things:
1. background_prompt — the full visual/scene/product-placement prompt for the image generator. Describes the background, scene, product placement, lighting, colors, and brand aesthetic. Does NOT include any text overlay copy.
2. hook_variants — an array of N short text overlay copy strings. Each hook variant contains the headline, optional subtitle, and CTA text that will appear as overlay text in the ad. Each must be meaningfully different in angle, tone, or message.

LANGUAGE RULE:
- ALL hook_variants MUST be written in the language specified in the brand data. This is non-negotiable.
- The background_prompt MUST always be written in English regardless of language — it is a technical prompt for an image generator, not customer-facing copy.

CRITICAL RULES — VISUAL:
- The background_prompt MUST include the brand's font name(s) explicitly — e.g. "typography in Neue Haas Grotesk"
- The background_prompt MUST describe brand colors by their VISUAL APPEARANCE — e.g. "warm off-white background", "deep charcoal text", "bright lime green accent". NEVER write hex codes (#xxxxxx) in the background_prompt — image generators render hex strings as literal text on the image.
- Use the provided hex codes only to determine the color's visual description (e.g. #C7F56F → "bright lime green", #1a1a1a → "near-black charcoal", #FFFFFF → "clean white").
- The background_prompt MUST STRICTLY follow reference images — do NOT invent props, objects, or surfaces not present in the reference images
- background_prompt must reflect the backgroundIntent — use their described scene/props as the visual foundation
- Replace every [BRACKETED PLACEHOLDER] with brand-specific details
- Keep template_number and template_name exactly as provided
- Output ONLY valid JSON — no markdown, no code blocks

CRITICAL RULES — COPY (hook_variants):
Every hook_variant MUST satisfy all three elements:
1. AVATAR MATCH — name the specific situation, frustration, or identity the customer desire describes. The reader must feel "that's me."
2. OPEN LOOP — use a question, "how to", a surprising fact, or a statement that is incomplete without reading further. No closed statements.
3. CLEAR BENEFIT — what's in it for them must be obvious before they finish reading the hook. Do not bury the payoff.

DESIRE RULE: When a customer desire is provided, every hook_variant MUST be built around that desire and nothing else. The desire is the emotional core — the hook should make the reader feel that desire more acutely, then position the product as the answer. Do not blend in other desires or generic brand messaging.

Bad hook: "Improve your kitchen with Noctis cookware" (no curiosity, no avatar, generic)
Good hook (desire = "look like a pro at home"): "Why home cooks are quietly ditching their old knives for this one set" (avatar = home cook wanting pro results, loop = "quietly" + why, benefit = implied upgrade)

Calibrate hook intensity to the awareness level:
- unaware: pattern interrupt, no product mention, pure curiosity — the reader doesn't know they have a problem yet
- problem-aware: lead with pain or frustration the ICP knows well — they know the problem, not the solution
- solution-aware: focus on why this solution beats alternatives — they know solutions exist
- product-aware: proof, specific results, social validation — they know the product, need convincing
- most-aware: direct offer, urgency, concrete deal — they're ready to buy

Each hook_variant must be a meaningfully different angle — different sentence structure, different emotional trigger, different way into the same desire. Never rephrase the same idea twice.

JSON Schema:
{
  "prompts": [
    {
      "template_number": 1,
      "template_name": "headline",
      "aspect_ratio": "3:4",
      "needs_product_images": true,
      "notes": "Any notes",
      "background_prompt": "Full visual prompt with explicit font names and color hex values...",
      "hook_variants": [
        "Headline: [text] | Subtitle: [text] | CTA: [text]",
        "Headline: [different text] | Subtitle: [different text] | CTA: [text]"
      ]
    }
  ]
}
`;

function brandDnaToText(dna: BrandDnaData, selectedDesire: string | null): string {
  const hookExamples = (dna.hook_examples ?? []);

  return `
BRAND: ${dna.name}
Ad Copy Language: ${dna.language ?? "English"} ← write ALL hook_variants in this language
Tagline: ${dna.tagline ?? "N/A"}
Brand Story: ${dna.brand_story ?? "N/A"}
Target Audience: ${dna.target_audience ?? "N/A"}
Brand Personality: ${dna.brand_personality ?? "N/A"}
Voice: ${dna.voice_adjectives.join(", ")}
Positioning: ${dna.positioning ?? "N/A"}

COPY STRATEGY:
Customer Desire for this generation: ${selectedDesire ?? "None selected — use brand positioning and product benefits to infer the strongest desire"}
${hookExamples.length > 0 ? `Hook Examples — create VARIANTS of these (same angle, new phrasing):
${hookExamples.map((h, i) => `${i + 1}. "${h}"`).join("\n")}` : "Hook Examples: none provided — generate original hooks from the framework"}

VISUAL SYSTEM (font names MUST appear in background_prompt; colors must be described visually — NO hex codes in background_prompt):
Primary Font: ${dna.primary_font ?? "N/A"} ← use this font name explicitly
Secondary Font: ${dna.secondary_font ?? "N/A"}
Accent Color: ${dna.accent_color ?? "N/A"} ← describe visually (e.g. "bright lime green"), never write the hex
Lettertype Color: ${dna.lettertype_color ?? "N/A"} ← describe visually
Background Color: ${dna.background_color ?? "N/A"} ← describe visually
`.trim();
}

export async function generatePrompts(
  brandDna: BrandDnaData,
  productName: string,
  productDescription: string | null,
  brandName: string,
  numVariants: number = 2,
  hookIntent: string | null = null,
  backgroundIntent: string | null = null,
  templateNumbers: number[] = [],
  awarenessLevel: string = "problem-aware",
  selectedDesire: string | null = null
): Promise<PromptsJson> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const client = new OpenAI({ apiKey });

  // Filter to only selected templates; default to all if none specified
  const selectedTemplates = templateNumbers.length > 0
    ? TEMPLATES.filter((t) => templateNumbers.includes(t.template_number))
    : TEMPLATES;

  const templatesText = selectedTemplates.map(
    (t) =>
      `Template ${t.template_number} — ${t.template_name}
aspect_ratio: ${t.aspect_ratio}
needs_product_images: ${t.needs_product_images}

${t.prompt_template}`
  ).join("\n\n---\n\n");

  const userMessage = `Brand Data:
${brandDnaToText(brandDna, selectedDesire)}

---

Product Name: ${productName}
Product Description: ${productDescription ?? "No description provided"}

---

User Intent:
Hook/Copy intent (what the headline & CTA should communicate): ${hookIntent ?? "Not specified — use brand positioning and product benefits"}
Background/Scene intent (what the visual scene should look like): ${backgroundIntent ?? "Not specified — follow brand colors and typography exactly"}

---

Awareness Level: ${awarenessLevel}
Calibrate hook intensity accordingly:
- unaware: pattern interrupt, no product mention, pure curiosity
- problem-aware: lead with pain/frustration the ICP knows well
- solution-aware: focus on why this solution beats alternatives
- product-aware: proof, specific results, social validation
- most-aware: direct offer, urgency, concrete deal

---

Number of hook variants to generate per template: ${numVariants}

---

Templates to fill:
${templatesText}

---

Generate the prompts JSON for all ${selectedTemplates.length} templates. Each template needs exactly ${numVariants} hook_variants. Remember: background_prompt MUST include font names explicitly AND describe brand colors visually — do NOT write any hex codes (#xxxxxx) in background_prompt. Output ONLY the JSON object with a "prompts" array.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: PROMPT_GENERATION_INSTRUCTIONS },
      { role: "user", content: userMessage },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No content returned from OpenAI.");

  const parsed = JSON.parse(content) as { prompts: PromptsJson["prompts"] };
  if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
    throw new Error("Invalid prompts JSON structure returned by OpenAI.");
  }

  return {
    brand: brandName,
    product: productName,
    generated_at: new Date().toISOString(),
    num_variants: numVariants,
    hook_intent: hookIntent,
    background_intent: backgroundIntent,
    prompts: parsed.prompts,
  };
}
