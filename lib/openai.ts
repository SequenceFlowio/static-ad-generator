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

Focus on what you can actually observe: brand story, target audience, positioning, color palette (from visual inspection), and typography if publicly documented.

OUTPUT: Return ONLY valid JSON. No markdown, no code blocks.

RESEARCH STEPS:
1. Search: "[Brand] brand story", "[Brand] brand colors palette", "[Brand] font typeface", "[Brand] brand guidelines", "[Brand] target audience", "[Brand] about us"
2. Fetch and analyze the brand URL — note the visual style, copy tone, colors visible on screen, who they seem to be speaking to
3. Search 2–3 competitors to understand positioning

Return this exact JSON (use null for fields you genuinely cannot find — do not guess):

{
  "name": "Brand name",
  "tagline": "Brand tagline or null",
  "brand_story": "1-2 sentence brand origin or mission story, or null",
  "target_audience": "Who the brand is for — demographics, lifestyle, needs. e.g. 'Health-conscious women 25-40 who value clean ingredients' or null",
  "brand_personality": "Brand personality in 1-2 sentences — how it acts, speaks, feels. e.g. 'Premium but approachable, speaks to aspirational simplicity' or null",
  "voice_adjectives": ["adj1", "adj2", "adj3", "adj4", "adj5"],
  "positioning": "1-2 sentence positioning or null",
  "competitive_differentiation": "How this brand differs from competitors or null",
  "customer_desires": ["3-5 short phrases describing what the ICP deeply wants — emotional/functional desires, not product features. e.g. 'effortless kitchen', 'look like a pro at home', 'save time on weeknights'"],
  "primary_font": "Font name if publicly documented or null",
  "secondary_font": "Secondary font name or null",
  "accent_color": "#hexcode for brand accent/CTA color or null",
  "lettertype_color": "#hexcode for primary text/font color or null",
  "background_color": "#hexcode for primary background color or null"
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

  // Strip markdown code fences if model wrapped the JSON anyway
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const aiData = JSON.parse(cleaned) as BrandDnaData;

  if (!Array.isArray(aiData.voice_adjectives)) aiData.voice_adjectives = [];
  if (!Array.isArray(aiData.customer_desires)) aiData.customer_desires = [];
  if (!Array.isArray(aiData.hook_examples)) aiData.hook_examples = [];

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
