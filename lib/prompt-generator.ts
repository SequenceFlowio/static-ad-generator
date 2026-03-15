import OpenAI from "openai";
import { TEMPLATES } from "./templates";
import type { PromptsJson } from "@/types";

const PROMPT_GENERATION_INSTRUCTIONS = `
You are a prompt engineer specializing in AI image generation for DTC brands.

Your job: Take a Brand DNA document and fill all template placeholders with brand-specific details to create production-ready image generation prompts.

Rules:
1. Replace every [BRACKETED PLACEHOLDER] with brand-specific details from the Brand DNA
2. Prepend the "Image Generation Prompt Modifier" section from the Brand DNA to the START of every prompt
3. Keep template_number and template_name exactly as provided
4. Set aspect_ratio from the template specification
5. Set needs_product_images from the template specification
6. Make the copy specific and compelling — not generic filler
7. Output ONLY valid JSON matching the schema below, no markdown code blocks, no extra text

JSON Schema:
{
  "brand": "Brand Name",
  "product": "Specific Product Name",
  "generated_at": "ISO timestamp",
  "prompts": [
    {
      "template_number": 1,
      "template_name": "headline",
      "prompt": "Full completed prompt text starting with the Image Generation Prompt Modifier...",
      "aspect_ratio": "4:5",
      "needs_product_images": true,
      "notes": "Any generation notes"
    }
  ]
}
`;

export async function generatePrompts(
  brandDna: string,
  productName: string,
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

  const userMessage = `Brand DNA Document:
${brandDna}

---

Product Name: ${productName}

---

Templates to fill:
${templatesText}

---

Generate the prompts JSON for all ${TEMPLATES.length} templates using this brand's DNA. Output ONLY the JSON object.`;

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

  // Ensure required fields
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
