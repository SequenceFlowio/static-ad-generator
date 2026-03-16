import OpenAI from "openai";
import { TEMPLATES } from "./templates";
import type { BrandDnaData, PromptsJson } from "@/types";

const PROMPT_GENERATION_INSTRUCTIONS = `
You are a prompt engineer specializing in AI image generation for DTC brands.

Your job: For each ad template, generate TWO things:
1. background_prompt — the full visual/scene/product-placement prompt for the image generator. This describes the background, scene, product placement, lighting, colors, and brand aesthetic. Does NOT include any text overlay copy.
2. hook_variants — an array of N short text overlay copy strings. Each hook variant contains the headline, optional subtitle, and CTA text that will appear as overlay text in the ad. Each must be meaningfully different in angle, tone, or message — not just synonym swaps.

Critical rules:
- The background_prompt must STRICTLY follow the reference image(s) provided. Do NOT invent props, objects, or surfaces not present in the reference images. If reference images show a specific product, describe ONLY that product exactly.
- hook_variants must reflect the hookIntent provided by the user — use it as the core theme/angle.
- background_prompt must reflect the backgroundIntent provided by the user — use their described scene/props/surfaces as the visual foundation.
- Replace every [BRACKETED PLACEHOLDER] in the template with brand-specific details from the brand data.
- Prepend the brand's prompt_modifier to the START of every background_prompt.
- Keep template_number and template_name exactly as provided.
- Output ONLY valid JSON — no markdown, no code blocks.

JSON Schema:
{
  "prompts": [
    {
      "template_number": 1,
      "template_name": "headline",
      "aspect_ratio": "4:5",
      "needs_product_images": true,
      "notes": "Any notes",
      "background_prompt": "Full visual scene prompt starting with prompt_modifier...",
      "hook_variants": [
        "Headline: [text] | Subtitle: [text] | CTA: [text]",
        "Headline: [different text] | Subtitle: [different text] | CTA: [text]"
      ]
    }
  ]
}
`;

function brandDnaToText(dna: BrandDnaData): string {
  return `
BRAND: ${dna.name}
Tagline: ${dna.tagline ?? "N/A"}
Voice: ${dna.voice_adjectives.join(", ")}
Positioning: ${dna.positioning ?? "N/A"}

VISUAL SYSTEM:
Primary Font: ${dna.primary_font ?? "N/A"}
Secondary Font: ${dna.secondary_font ?? "N/A"}
Primary Color: ${dna.primary_color ?? "N/A"}
Secondary Color: ${dna.secondary_color ?? "N/A"}
Accent Color: ${dna.accent_color ?? "N/A"}
Background Colors: ${dna.background_colors.join(", ") || "N/A"}
CTA Color/Style: ${dna.cta_color_style ?? "N/A"}

PHOTOGRAPHY:
Lighting: ${dna.lighting ?? "N/A"}
Color Grading: ${dna.color_grading ?? "N/A"}
Composition: ${dna.composition ?? "N/A"}
Subject Matter: ${dna.subject_matter ?? "N/A"}
Props & Surfaces: ${dna.props_and_surfaces ?? "N/A"}
Mood: ${dna.mood ?? "N/A"}

PROMPT MODIFIER (prepend to every background_prompt):
${dna.prompt_modifier}
`.trim();
}

export async function generatePrompts(
  brandDna: BrandDnaData,
  productName: string,
  productDescription: string | null,
  brandName: string,
  numVariants: number = 2,
  hookIntent: string | null = null,
  backgroundIntent: string | null = null
): Promise<PromptsJson> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const client = new OpenAI({ apiKey });

  const templatesText = TEMPLATES.map(
    (t) =>
      `Template ${t.template_number} — ${t.template_name}
aspect_ratio: ${t.aspect_ratio}
needs_product_images: ${t.needs_product_images}

${t.prompt_template}`
  ).join("\n\n---\n\n");

  const userMessage = `Brand Data:
${brandDnaToText(brandDna)}

---

Product Name: ${productName}
Product Description: ${productDescription ?? "No description provided"}

---

User Intent:
Hook/Copy intent (what the headline & CTA should communicate): ${hookIntent ?? "Not specified — use brand positioning and product benefits"}
Background/Scene intent (what the visual scene should look like): ${backgroundIntent ?? "Not specified — use brand photography direction and product imagery"}

---

Number of hook variants to generate per template: ${numVariants}

---

Templates to fill:
${templatesText}

---

Generate the prompts JSON for all ${TEMPLATES.length} templates. Each template needs exactly ${numVariants} hook_variants. Output ONLY the JSON object with a "prompts" array.`;

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
