import OpenAI from "openai";
import type { BrandDnaData } from "@/types";

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const BRAND_RESEARCH_SYSTEM_PROMPT = `
You are a Senior Brand Strategist. Reverse-engineer a brand's visual and verbal identity by searching the web and analyzing their website.

Focus on what you can actually observe: photography style, ad creative approach, positioning, color palette (from visual inspection), and typography if publicly documented.

OUTPUT: Return ONLY valid JSON. No markdown, no code blocks.

RESEARCH STEPS:
1. Search: "[Brand] brand colors palette", "[Brand] font typeface", "[Brand] brand guidelines", "[Brand] Meta Ad Library", "[Brand] photography style", "[Brand] brand story"
2. Fetch and analyze the brand URL — note the visual style, copy tone, photography, colors visible on screen
3. Search 2–3 competitors to understand positioning

Return this exact JSON (use null for fields you genuinely cannot find — do not guess):

{
  "name": "Brand name",
  "tagline": "Brand tagline or null",
  "design_agency": "Agency if publicly known or null",
  "voice_adjectives": ["adj1", "adj2", "adj3", "adj4", "adj5"],
  "positioning": "1-2 sentence positioning or null",
  "competitive_differentiation": "How brand differs from competitors visually/verbally or null",
  "primary_font": "Font name if publicly documented or null",
  "secondary_font": "Font name if publicly documented or null",
  "primary_color": "#hexcode if clearly identifiable or null",
  "secondary_color": "#hexcode or null",
  "accent_color": "#hexcode or null",
  "background_colors": ["#hex1"],
  "cta_color_style": "e.g. Solid black pill, white text or null",
  "lighting": "e.g. Soft natural window light or null",
  "color_grading": "e.g. Warm golden tones, neutral or null",
  "composition": "e.g. Clean minimalist, product centered or null",
  "subject_matter": "e.g. Product in use in kitchen or null",
  "props_and_surfaces": "e.g. Marble countertop, wooden board or null",
  "mood": "e.g. Serene, inviting, premium or null",
  "prompt_modifier": "Write 50-75 words combining the above into a visual style guide for an AI image model. Include any hex colors you found, describe the font style (even if approximate), describe the photography mood and lighting. This will be prepended to every ad prompt to maintain brand consistency."
}
`;

export async function researchBrand(
  brandName: string,
  brandUrl: string,
  manualOverrides?: Partial<BrandDnaData>
): Promise<BrandDnaData> {
  const client = getOpenAIClient();

  const response = await client.responses.create({
    model: "gpt-4o",
    instructions: BRAND_RESEARCH_SYSTEM_PROMPT,
    input: `Research this brand:\n\nBrand Name: ${brandName}\nBrand URL: ${brandUrl}\n\nSearch extensively. Return the JSON only.`,
    tools: [{ type: "web_search_preview" }],
    text: { format: { type: "json_object" } },
  });

  const text = response.output
    .filter((item) => item.type === "message")
    .flatMap((item) => {
      if (item.type === "message") {
        return item.content
          .filter((c) => c.type === "output_text")
          .map((c) => (c.type === "output_text" ? c.text : ""));
      }
      return [];
    })
    .join("");

  if (!text) throw new Error("No response from OpenAI.");

  const aiData = JSON.parse(text) as BrandDnaData;

  if (!Array.isArray(aiData.voice_adjectives)) aiData.voice_adjectives = [];
  if (!Array.isArray(aiData.background_colors)) aiData.background_colors = [];

  // Manual overrides win — user knows their brand better than scraping
  if (manualOverrides) {
    for (const [key, value] of Object.entries(manualOverrides)) {
      if (value !== null && value !== undefined && value !== "" &&
          !(Array.isArray(value) && value.length === 0)) {
        (aiData as unknown as Record<string, unknown>)[key] = value;
      }
    }
  }

  return aiData;
}
