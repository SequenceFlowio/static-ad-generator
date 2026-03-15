import OpenAI from "openai";
import { TEMPLATES } from "./templates";
import type { BrandDnaData, PromptsJson } from "@/types";

const PROMPT_GENERATION_INSTRUCTIONS = `
You are a prompt engineer specializing in AI image generation for DTC brands.

Your job: Take structured brand data and a product, fill all template placeholders with brand-specific details to create production-ready image generation prompts.

Rules:
1. Replace every [BRACKETED PLACEHOLDER] with brand-specific details from the brand data
2. Prepend the prompt_modifier from the brand data to the START of every prompt
3. Keep template_number and template_name exactly as provided
4. Make the copy specific and compelling — not generic filler
5. Output ONLY valid JSON — no markdown, no code blocks

JSON Schema:
{
  "brand": "Brand Name",
  "product": "Product Name",
  "generated_at": "ISO timestamp",
  "prompts": [
    {
      "template_number": 1,
      "template_name": "headline",
      "prompt": "Full prompt starting with prompt_modifier...",
      "aspect_ratio": "4:5",
      "needs_product_images": true,
      "notes": "Any notes"
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

PRODUCT:
Physical Description: ${dna.physical_description ?? "N/A"}
Label/Logo Placement: ${dna.label_logo_placement ?? "N/A"}
Distinctive Features: ${dna.distinctive_features ?? "N/A"}
Packaging: ${dna.packaging_system ?? "N/A"}

AD CREATIVE STYLE:
Typical Formats: ${dna.typical_ad_formats ?? "N/A"}
Text Overlay: ${dna.text_overlay_style ?? "N/A"}
UGC Usage: ${dna.ugc_usage ?? "N/A"}
Offer Presentation: ${dna.offer_presentation ?? "N/A"}

PROMPT MODIFIER (prepend to every prompt):
${dna.prompt_modifier}
`.trim();
}

export async function generatePrompts(
  brandDna: BrandDnaData,
  productName: string,
  productDescription: string | null,
  brandName: string
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

Templates to fill:
${templatesText}

---

Generate prompts JSON for all ${TEMPLATES.length} templates. Output ONLY the JSON object.`;

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

  const parsed = JSON.parse(content) as PromptsJson;
  if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
    throw new Error("Invalid prompts JSON structure returned by OpenAI.");
  }

  return {
    brand: brandName,
    product: productName,
    generated_at: new Date().toISOString(),
    prompts: parsed.prompts,
  };
}
