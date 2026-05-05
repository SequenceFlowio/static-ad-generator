import type { BrandDnaData, CreativeStrategy } from "@/types";
import { generateText } from "./llm";

export interface BatchAdConcept {
  template_name: string;
  product_id: string;
  background_prompt: string;
  hook_text: string;
  angle_description: string;
}

interface ProductInfo {
  id: string;
  name: string;
  description?: string | null;
}

function brandDnaToText(dna: BrandDnaData): string {
  return `
BRAND: ${dna.name}
Tagline: ${dna.tagline ?? "N/A"}
Brand Story: ${dna.brand_story ?? "N/A"}
Target Audience: ${dna.target_audience ?? "N/A"}
Brand Personality: ${dna.brand_personality ?? "N/A"}
Voice: ${(dna.voice_adjectives ?? []).join(", ") || "N/A"}
Positioning: ${dna.positioning ?? "N/A"}
Competitive Differentiation: ${dna.competitive_differentiation ?? "N/A"}
Customer Desires: ${(dna.customer_desires ?? []).join(", ") || "N/A"}
Hook Examples: ${(dna.hook_examples ?? []).join(" | ") || "N/A"}

VISUAL SYSTEM:
Primary Font: ${dna.primary_font ?? "N/A"}
Secondary Font: ${dna.secondary_font ?? "N/A"}
Accent Color: ${dna.accent_color ?? "N/A"} ← describe visually (e.g. "bright lime green"), NEVER write hex codes
Lettertype Color: ${dna.lettertype_color ?? "N/A"} ← describe visually
Background Color: ${dna.background_color ?? "N/A"} ← describe visually
`.trim();
}

export async function generateBatchCampaign({
  brandDna,
  products,
  templateNames,
  batchSize,
  creativeStrategy,
}: {
  brandDna: BrandDnaData;
  products: ProductInfo[];
  templateNames: string[];
  batchSize: number;
  creativeStrategy?: CreativeStrategy | null;
}): Promise<BatchAdConcept[]> {
  const productList = products
    .map((p) => `- ${p.name} (id: ${p.id})${p.description ? `: ${p.description}` : ""}`)
    .join("\n");

  const systemPrompt = `You are an expert performance marketing agent for DTC brands.

Your task: Plan a diverse batch ad campaign of exactly ${batchSize} unique ad concepts.

RULES:
- Each concept MUST have a completely unique angle, opening hook, visual direction, and emotional appeal
- Distribute concepts roughly evenly across the available templates
- Distribute concepts across the available products (use each product at least once if possible)
- No two concepts may share the same core hook angle or visual scene
- hook_text must satisfy: Avatar Match (reader feels "that's me") + Open Loop (question, incomplete, how-to) + Clear Benefit (obvious payoff)
- background_prompt MUST be in English, describe colors visually (never hex), include brand font names
- background_prompt MUST NOT include any text overlays — text comes from hook_text only
- hook_text MUST be in ${brandDna.language ?? "English"}

AVAILABLE TEMPLATES: ${templateNames.join(", ")}

OUTPUT: Valid JSON array of exactly ${batchSize} objects. No markdown, no code blocks.

Schema per object:
{
  "template_name": "<one of the available templates>",
  "product_id": "<the product id this ad is for>",
  "background_prompt": "<full visual scene description in English for kie.ai>",
  "hook_text": "<the ad copy: headline + optional subtitle + CTA, written in brand language>",
  "angle_description": "<one sentence describing the unique angle/emotion>"
}`;

  let strategyAppend = "";
  if (creativeStrategy) {
    const parts: string[] = ["", "---", "CREATIVE STRATEGY:"];
    if (creativeStrategy.creative_angles.length > 0) {
      parts.push(`Available Creative Angles — distribute concepts across these angles:`);
      creativeStrategy.creative_angles.forEach(a => parts.push(`  - ${a.label}: ${a.description} (hook frame: "${a.hook_frame}")`));
    }
    if (creativeStrategy.content_pillars.length > 0) {
      parts.push(`Content Pillars — use each at least once:`);
      creativeStrategy.content_pillars.forEach(p => parts.push(`  - ${p.label}: ${p.description}`));
    }
    if (creativeStrategy.hook_library.length > 0) {
      parts.push(`Hook Library (proven examples — create variants, never copy):`);
      creativeStrategy.hook_library.slice(0, 5).forEach((h, i) => parts.push(`  ${i + 1}. "${h.hook}"`));
    }
    if (creativeStrategy.forbidden_elements.length > 0) {
      parts.push(`FORBIDDEN — never include: ${creativeStrategy.forbidden_elements.join(", ")}`);
    }
    strategyAppend = parts.join("\n");
  }

  const userMessage = `${brandDnaToText(brandDna)}${strategyAppend}

PRODUCTS:
${productList}

Generate exactly ${batchSize} diverse ad concepts. Every concept must have a different angle — no repetition. Cover all customer desires, different emotional appeals, different visual scenes.`;

  const content = await generateText({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.9,
    responseFormat: { type: "json_object" },
  });

  // GPT wraps the array in an object — unwrap it
  const parsed = JSON.parse(content) as { concepts?: BatchAdConcept[] } | BatchAdConcept[];
  const concepts: BatchAdConcept[] = Array.isArray(parsed)
    ? parsed
    : (parsed as { concepts?: BatchAdConcept[] }).concepts ?? [];

  if (!Array.isArray(concepts) || concepts.length === 0) {
    throw new Error("Invalid batch campaign JSON returned by the LLM.");
  }

  return concepts.slice(0, batchSize);
}
