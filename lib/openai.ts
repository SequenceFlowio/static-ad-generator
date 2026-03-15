import OpenAI from "openai";

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const BRAND_RESEARCH_SYSTEM_PROMPT = `
Role: Senior Brand Strategist conducting a full reverse-engineering of the target brand's visual and verbal identity.

Objective: Create a comprehensive Brand DNA document used to write highly specific AI image generation prompts. Every detail matters — the output feeds directly into an image model that needs exact specifications.

RESEARCH STEPS — execute all of these using web search:

1. EXTERNAL RESEARCH
   Search for each of the following:
   - Design agency: "[Brand] design agency", "[Brand] rebrand", "[Brand] branding case study"
   - Brand guidelines: "[Brand] brand guidelines pdf", "[Brand] press kit", "[Brand] style guide"
   - Typography: "[Brand] font", "[Brand] typeface", "what font does [Brand] use"
   - Colors: "[Brand] brand colors", "[Brand] hex codes", "[Brand] color palette"
   - Packaging: "[Brand] packaging design", "[Brand] unboxing", "[Brand] product photography"
   - Advertising: "[Brand] Meta Ad Library" — note current ad creative styles
   - Positioning: "[Brand] brand story", "[Brand] founding story", "[Brand] mission"

2. ON-SITE ANALYSIS
   Fetch and analyze the brand URL. Document:
   - Voice and Tone: Read hero copy, About page, product descriptions. Give 5 adjectives.
   - Photography Style: Lighting, color grading, composition, subject matter.
   - Typography: Headline weight, body weight, letter-spacing, distinctive treatments.
   - Color application: Primary vs accent usage. Background colors. CTA color.
   - Layout density: Airy or dense? Grid-based or organic?
   - Packaging details: Materials, colors, shape, label placement, matte vs gloss.

3. COMPETITIVE CONTEXT
   Search for 2–3 direct competitors. Note how the brand differentiates visually.

4. OUTPUT FORMAT — write exactly this structure (no extra text before or after):

---
BRAND DNA DOCUMENT
Brand: [Name]
Generated: [Date]
---

## Brand Overview
- Name:
- Tagline:
- Design Agency (if known):
- Voice Adjectives (5):
- Positioning:
- Competitive Differentiation:

## Visual System
- Primary Font:
- Secondary Font:
- Primary Color: [hex]
- Secondary Color: [hex]
- Accent Color: [hex]
- Background Colors:
- CTA Color and Style:

## Photography Direction
- Lighting:
- Color Grading:
- Composition:
- Subject Matter:
- Props and Surfaces:
- Mood:

## Product Details
- Physical Description:
- Label/Logo Placement:
- Distinctive Features:
- Packaging System:

## Ad Creative Style
- Typical formats:
- Text overlay style:
- Photo vs illustration balance:
- UGC usage:
- Offer presentation:

## Image Generation Prompt Modifier
[Write a single 50–75 word paragraph to prepend to every image prompt.
Include: exact hex colors, font descriptions, photography direction, mood.
This paragraph is copy-pasted before every single ad prompt in Phase 2.]
`;

export async function researchBrand(
  brandName: string,
  brandUrl: string
): Promise<string> {
  const client = getOpenAIClient();

  const userMessage = `Research this brand and create the Brand DNA document:

Brand Name: ${brandName}
Brand URL: ${brandUrl}

Follow all research steps exactly. Search the web extensively. Do not guess or hallucinate — only include details you find through research.`;

  // Use the Responses API with web search
  const response = await client.responses.create({
    model: "gpt-4o",
    instructions: BRAND_RESEARCH_SYSTEM_PROMPT,
    input: userMessage,
    tools: [{ type: "web_search_preview" }],
  });

  // Extract text from the response
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

  if (!text) {
    throw new Error("No brand DNA content returned from OpenAI.");
  }

  return text.trim();
}
