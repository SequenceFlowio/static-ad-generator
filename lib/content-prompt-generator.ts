import OpenAI from "openai";
import type { BrandDnaData } from "@/types";
import type { Platform } from "./content-templates";

export interface ContentGenerationResult {
  image_prompt: string;
  caption: string;
  caption_note: string;
}

const PLATFORM_TONE: Record<Platform, string> = {
  instagram: "aspirational and punchy — 150-200 words max, 15-20 relevant hashtags at the end",
  facebook: "conversational and community-driven — 150-200 words max, 5-8 hashtags at the end",
  linkedin: "professional insight-driven — 200-300 words, 3-5 hashtags at the end, no emojis",
  pinterest: "descriptive and keyword-rich — 100-150 words max, 10-15 hashtags at the end",
};

// These templates produce purely visual images — NO text, labels, or overlays
const NO_TEXT_TEMPLATES = new Set(["lifestyle", "using-product", "behind-scenes", "seasonal-trend"]);

const TEMPLATE_INSTRUCTIONS: Record<string, string> = {
  "tips-tricks": "Create an educational post sharing 3 specific, actionable tips related to the brand's niche. Each tip should feel genuinely useful, not promotional. The image shows a clean, typographic layout with the tips presented visually.",
  "about-brand": "Tell the brand's story, values, or mission in a way that feels human and relatable. Focus on why the brand exists, not just what it sells. The image is warm, brand-aesthetic, with minimal text overlay.",
  "about-product": "Spotlight the product — what it is, what makes it different, and why it matters. Be specific. The image is a clean product hero shot or lifestyle placement that shows the product clearly.",
  "using-product": "Show the product in action — a how-to moment, a daily routine, or a specific use case. Make it feel real and accessible. The image shows the product being used naturally. IMAGE MUST BE PURELY VISUAL — absolutely no text, labels, captions, or overlays of any kind in the image.",
  "testimonial": "Feature a compelling customer result or quote. Keep it specific and believable — a real outcome, not generic praise. The image is a clean quote card with brand styling.",
  "lifestyle": "Place the brand or product in an aspirational but relatable scene. The focus is on the feeling and lifestyle, not the product itself. The image is beautiful, editorial, scene-first. IMAGE MUST BE PURELY VISUAL — absolutely no text, labels, captions, or overlays of any kind in the image.",
  "before-after": "Show the transformation the brand enables — the before state (pain or frustration) and the after state (result or relief). Make both states vivid. The image uses a split or contrast layout.",
  "behind-scenes": "Pull back the curtain — show the team, the process, the sourcing, or the craft behind the brand. Build trust through authenticity. The image feels candid and real. IMAGE MUST BE PURELY VISUAL — absolutely no text, labels, captions, or overlays of any kind in the image.",
  "seasonal-trend": "Connect the brand to a current season, moment, or cultural trend in a way that feels natural and on-brand. The image reflects the seasonal or trend aesthetic clearly. IMAGE MUST BE PURELY VISUAL — absolutely no text, labels, captions, or overlays of any kind in the image.",
};

function brandDnaToText(dna: BrandDnaData): string {
  return `
BRAND: ${dna.name}
Caption Language: ${dna.language ?? "English"} ← write the ENTIRE caption in this language
Tagline: ${dna.tagline ?? "N/A"}
Brand Story: ${dna.brand_story ?? "N/A"}
Target Audience: ${dna.target_audience ?? "N/A"}
Brand Personality: ${dna.brand_personality ?? "N/A"}
Voice: ${(dna.voice_adjectives ?? []).join(", ") || "N/A"}
Positioning: ${dna.positioning ?? "N/A"}
Competitive Differentiation: ${dna.competitive_differentiation ?? "N/A"}

VISUAL SYSTEM:
Primary Font: ${dna.primary_font ?? "N/A"}
Secondary Font: ${dna.secondary_font ?? "N/A"}
Accent Color: ${dna.accent_color ?? "N/A"} ← describe visually in image_prompt (e.g. "bright lime green"), NEVER write hex codes
Lettertype Color: ${dna.lettertype_color ?? "N/A"} ← describe visually
Background Color: ${dna.background_color ?? "N/A"} ← describe visually
`.trim();
}

export async function generateContentPost({
  brandDna,
  templateName,
  platform,
  productName,
  productDescription,
  topicHint,
  selectedDesire,
}: {
  brandDna: BrandDnaData;
  templateName: string;
  platform: Platform;
  productName?: string | null;
  productDescription?: string | null;
  topicHint?: string | null;
  selectedDesire?: string | null;
}): Promise<ContentGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const client = new OpenAI({ apiKey });

  const templateInstruction = TEMPLATE_INSTRUCTIONS[templateName] ?? "Create engaging brand content.";
  const platformTone = PLATFORM_TONE[platform];

  const systemPrompt = `You are a social media content strategist specialising in DTC brand content.

Your job: Generate TWO things for a social media post:
1. image_prompt — a full visual scene description in English for an AI image generator (kie.ai). Describes the scene, mood, lighting, composition, and brand aesthetic. Does NOT include caption copy. MUST include brand font name(s) explicitly. MUST describe colors visually (e.g. "warm cream background") — NEVER write hex codes.
2. caption — the full social media caption written in the brand's language. Includes opening hook, body, CTA, and hashtags. Tone and length calibrated to the platform.

LANGUAGE RULE:
- caption MUST be written in the language specified in the brand data. Non-negotiable.
- image_prompt MUST always be in English (technical prompt, not customer-facing).

CAPTION STRUCTURE:
- Opening hook (1-2 lines that stop the scroll — use avatar match + open loop + clear benefit)
- Body (the substance — tips, story, quote, transformation, etc.)
- CTA (one clear action)
- Hashtags (platform-appropriate quantity)

COPY RULES:
- Every caption opening MUST have: Avatar Match (reader feels "that's me") + Open Loop (question, "how to", incomplete statement) + Clear Benefit (WIIFM obvious before they stop reading)
- Voice and tone must match the brand personality exactly
- Do NOT write generic brand content — make it specific to this brand and their audience

NO-TEXT TEMPLATES RULE:
For the following templates: lifestyle, using-product, behind-scenes, seasonal-trend — the image_prompt MUST end with the sentence: "No text, no labels, no overlays — purely visual image." These images will never have any text on them. Do not include any typography, captions, headlines, or text elements in image_prompt for these templates.

OUTPUT: Valid JSON only. No markdown, no code blocks.

JSON Schema:
{
  "image_prompt": "Full visual scene description in English...",
  "caption": "Full caption text with hashtags...",
  "caption_note": "One sentence explaining the angle used"
}`;

  const isNoText = NO_TEXT_TEMPLATES.has(templateName);

  const userMessage = `${brandDnaToText(brandDna)}

---

Template: ${templateName}
Instructions: ${templateInstruction}
${isNoText ? "⚠️ NO TEXT IN IMAGE: This template must produce a purely visual image. The image_prompt must NOT include any text, labels, headlines, or overlays. End image_prompt with: \"No text, no labels, no overlays — purely visual image.\"" : ""}

Platform: ${platform}
Caption tone & length: ${platformTone}
${productName ? `\nProduct: ${productName}${productDescription ? `\nProduct Description: ${productDescription}` : ""}` : ""}
${selectedDesire ? `\nCustomer Desire to focus on: ${selectedDesire}` : ""}
${topicHint ? `\nTopic / Angle hint from user: ${topicHint}` : ""}

---

Generate the image_prompt and caption. The image_prompt must reflect the brand visual system (fonts, colors described visually). The caption must be in ${brandDna.language ?? "English"} with ${platformTone}.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.75,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No content returned from OpenAI.");

  const parsed = JSON.parse(content) as ContentGenerationResult;
  if (!parsed.image_prompt || !parsed.caption) {
    throw new Error("Invalid content JSON structure returned by OpenAI.");
  }

  return parsed;
}
