import OpenAI from "openai";
import { TEMPLATES } from "./templates";
import type { BrandDnaData, PromptsJson } from "@/types";

const PROMPT_GENERATION_INSTRUCTIONS = `
You are a prompt engineer specializing in AI image generation for DTC brands.

Your job: For each ad template, generate TWO things:
1. background_prompt — the full visual/scene/product-placement prompt for the image generator. Describes the background, scene, product placement, lighting, colors, and brand aesthetic. Does NOT include any text overlay copy.
2. hook_variants — an array of N short text overlay copy strings. Each hook variant contains the headline, optional subtitle, and CTA text that will appear as overlay text in the ad. Each must be meaningfully different in angle, tone, or message.

CRITICAL RULES:
- The background_prompt MUST include the brand's font name(s) explicitly — e.g. "typography in Neue Haas Grotesk"
- The background_prompt MUST describe brand colors by their VISUAL APPEARANCE — e.g. "warm off-white background", "deep charcoal text", "bright lime green accent". NEVER write hex codes (#xxxxxx) in the background_prompt — image generators render hex strings as literal text on the image.
- Use the provided hex codes only to determine the color's visual description (e.g. #C7F56F → "bright lime green", #1a1a1a → "near-black charcoal", #FFFFFF → "clean white").
- The background_prompt MUST STRICTLY follow reference images — do NOT invent props, objects, or surfaces not present in the reference images
- hook_variants must reflect the hookIntent provided — use it as the core theme/angle
- background_prompt must reflect the backgroundIntent — use their described scene/props as the visual foundation
- Replace every [BRACKETED PLACEHOLDER] with brand-specific details
- Keep template_number and template_name exactly as provided
- Output ONLY valid JSON — no markdown, no code blocks

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

function brandDnaToText(dna: BrandDnaData): string {
  return `
BRAND: ${dna.name}
Tagline: ${dna.tagline ?? "N/A"}
Brand Story: ${dna.brand_story ?? "N/A"}
Target Audience: ${dna.target_audience ?? "N/A"}
Brand Personality: ${dna.brand_personality ?? "N/A"}
Voice: ${dna.voice_adjectives.join(", ")}
Positioning: ${dna.positioning ?? "N/A"}

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
  templateNumbers: number[] = []
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
${brandDnaToText(brandDna)}

---

Product Name: ${productName}
Product Description: ${productDescription ?? "No description provided"}

---

User Intent:
Hook/Copy intent (what the headline & CTA should communicate): ${hookIntent ?? "Not specified — use brand positioning and product benefits"}
Background/Scene intent (what the visual scene should look like): ${backgroundIntent ?? "Not specified — follow brand colors and typography exactly"}

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
