import OpenAI from "openai";
import type { BrandDnaData } from "@/types";

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const BRAND_RESEARCH_SYSTEM_PROMPT = `
You are a Senior Brand Strategist. Your job is to reverse-engineer a brand's complete visual and verbal identity by searching the web and analyzing their website.

OUTPUT: Return ONLY a valid JSON object. No markdown, no code blocks, no extra text — just the JSON.

RESEARCH STEPS (execute all):

1. Search the web for:
   - "[Brand] brand colors hex codes palette"
   - "[Brand] font typeface typography"
   - "[Brand] brand guidelines style guide press kit"
   - "[Brand] design agency rebrand"
   - "[Brand] packaging design"
   - "[Brand] Meta Ad Library" to understand ad creative styles
   - "[Brand] brand story mission founding"
   - 2–3 direct competitors for context

2. Fetch and analyze the brand URL:
   - Read hero copy, About page, product descriptions → extract voice adjectives
   - Note exact colors used (try to get hex codes from CSS/design)
   - Note fonts used for headlines vs body
   - Note photography style, lighting, mood
   - Note packaging if shown

3. Output this exact JSON schema (use null for fields you cannot find, never guess):

{
  "name": "Brand name",
  "tagline": "Brand tagline or null",
  "design_agency": "Agency name or null",
  "voice_adjectives": ["adj1", "adj2", "adj3", "adj4", "adj5"],
  "positioning": "1-2 sentence positioning statement or null",
  "competitive_differentiation": "How brand differs visually from competitors or null",
  "primary_font": "Font name or null",
  "secondary_font": "Font name or null",
  "primary_color": "#hexcode or null",
  "secondary_color": "#hexcode or null",
  "accent_color": "#hexcode or null",
  "background_colors": ["#hex1", "#hex2"],
  "cta_color_style": "e.g. Solid black pill, white text or null",
  "lighting": "e.g. Soft natural window light or null",
  "color_grading": "e.g. Warm golden tones or null",
  "composition": "e.g. Clean minimalist, product centered or null",
  "subject_matter": "e.g. Product in use in kitchen setting or null",
  "props_and_surfaces": "e.g. Marble countertop, wooden cutting board or null",
  "mood": "e.g. Serene, inviting, premium or null",
  "physical_description": "What the product looks like or null",
  "label_logo_placement": "Where logo appears on product or null",
  "distinctive_features": "Unique visual details or null",
  "packaging_system": "e.g. Matte black box with gold foil or null",
  "typical_ad_formats": "e.g. Product hero, lifestyle UGC or null",
  "text_overlay_style": "e.g. Minimal sans-serif, white text on dark or null",
  "photo_vs_illustration": "e.g. 90% photography, 10% illustration or null",
  "ugc_usage": "e.g. Heavy UGC on social, polished studio for paid or null",
  "offer_presentation": "e.g. Percentage discount, bundle offers or null",
  "prompt_modifier": "Write a 50-75 word paragraph combining all the above into a style guide for an image generation model. Include hex colors, font style, lighting, mood, and photography direction. This is prepended to every ad prompt."
}
`;

export async function researchBrand(
  brandName: string,
  brandUrl: string
): Promise<BrandDnaData> {
  const client = getOpenAIClient();

  const userMessage = `Research this brand completely and return the JSON:

Brand Name: ${brandName}
Brand URL: ${brandUrl}

Search the web extensively. Only include what you actually find — use null for unknowns.`;

  const response = await client.responses.create({
    model: "gpt-4o",
    instructions: BRAND_RESEARCH_SYSTEM_PROMPT,
    input: userMessage,
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

  const parsed = JSON.parse(text) as BrandDnaData;

  // Ensure arrays are arrays
  if (!Array.isArray(parsed.voice_adjectives)) parsed.voice_adjectives = [];
  if (!Array.isArray(parsed.background_colors)) parsed.background_colors = [];

  return parsed;
}
