import type { BrandDnaData, CreativeStrategy, ContentGoal } from "@/types";
import type { Platform } from "./content-templates";
import { getPlatformAspectRatio } from "./content-templates";
import { buildNanoBananaPrompt, CONTENT_TEMPLATE_CAMERA_PRESETS } from "./prompt-utils";
import { getWinningAds, formatWinningAdsBlock } from "./winning-ads";
import { generateText } from "./llm";

export interface ContentGenerationResult {
  image_prompt: string;
  caption: string;
  caption_note: string;
}

interface ImagePromptJson {
  style: "editorial" | "clean_ad" | "ugc_raw" | "ui_card";
  scene: string;
  subject?: string;
  product_placement?: string;
  composition: string;
  lighting: string;
  camera: string;
  color_palette: string;
  typography?: { headline: string; body?: string };
  text_density: "none" | "low" | "medium" | "high";
  overlay: { allowed: boolean; type?: string };
  mood: string;
  realism: "photorealistic" | "stylized" | "graphic_design";
  grain_noise?: "none" | "slight" | "heavy";
}

const PLATFORM_TONE: Record<Platform, string> = {
  instagram: "aspirational and punchy — 150-200 words max, 15-20 relevant hashtags at the end",
  facebook: "conversational and community-driven — 150-200 words max, 5-8 hashtags at the end",
  linkedin: "professional insight-driven — 200-300 words, 3-5 hashtags at the end, no emojis",
  pinterest: "descriptive and keyword-rich — 100-150 words max, 10-15 hashtags at the end",
};

const STYLE_PREFIX: Record<string, string> = {
  editorial: "Professional editorial photography. Clean composition. Thoughtful styling.",
  clean_ad: "Performance ad visual. Clear subject hierarchy. Brand-consistent colors and layout.",
  ugc_raw: "User-generated content aesthetic. Smartphone camera feel. Natural imperfections. Authentic and candid.",
  ui_card: "Graphic design asset. Typography-led layout. Flat or minimal background. No photography elements.",
};

// Fixed constraints per template — the LLM fills in brand-specific details within these boundaries
const TEMPLATE_SCHEMAS: Record<string, Partial<ImagePromptJson>> = {
  "tips-tricks": {
    style: "ui_card",
    realism: "graphic_design",
    camera: "none (graphic design)",
    text_density: "high",
    overlay: { allowed: true, type: "bold headline at top + 3 numbered tips with icons below, clean list layout" },
    composition: "centered vertical layout with clear section hierarchy",
    lighting: "flat, no shadows — graphic design style",
    mood: "educational and useful",
  },
  "about-brand": {
    style: "editorial",
    realism: "photorealistic",
    camera: "medium telephoto, shallow depth of field",
    text_density: "low",
    overlay: { allowed: true, type: "minimal brand tagline or short headline at bottom" },
    composition: "rule of thirds, subject left or right, breathing room",
    lighting: "soft natural window light or golden hour outdoor",
    mood: "warm, human, and authentic",
  },
  "about-product": {
    style: "clean_ad",
    realism: "photorealistic",
    camera: "studio product shot — overhead or 45-degree angle, sharp focus",
    text_density: "low",
    overlay: { allowed: true, type: "product name + short benefit headline" },
    composition: "centered hero product placement on clean background",
    lighting: "flat studio lighting or soft box — even, no harsh shadows",
    mood: "clean, premium, and confident",
  },
  "using-product": {
    style: "ugc_raw",
    realism: "photorealistic",
    camera: "smartphone handheld — slight motion, natural framing",
    text_density: "none",
    overlay: { allowed: false },
    composition: "action-first — product in hand or in use, mid-scene moment",
    lighting: "natural available light — indoor or outdoor",
    mood: "real, accessible, and relatable",
    grain_noise: "slight",
  },
  "testimonial": {
    style: "ui_card",
    realism: "graphic_design",
    camera: "none (graphic design)",
    text_density: "medium",
    overlay: { allowed: true, type: "quote card — large quote text, customer name/avatar at bottom, brand logo subtle" },
    composition: "centered card layout, generous padding, strong typographic hierarchy",
    lighting: "flat — graphic design style",
    mood: "trustworthy, warm, and credible",
  },
  "lifestyle": {
    style: "editorial",
    realism: "photorealistic",
    camera: "medium telephoto shallow depth of field — cinematic",
    text_density: "none",
    overlay: { allowed: false },
    composition: "scene-first composition — product present but not dominant, environment tells the story",
    lighting: "golden hour or soft diffused natural light",
    mood: "aspirational and effortless",
  },
  "before-after": {
    style: "clean_ad",
    realism: "photorealistic",
    camera: "controlled — consistent angle both sides, studio or neutral environment",
    text_density: "none",
    overlay: { allowed: true, type: "Before / After text labels on respective sides — minimal, clean" },
    composition: "vertical split 50/50 — left=before, right=after, same framing and scale",
    lighting: "matched lighting both sides — flat and even for clarity",
    mood: "transformative and clear",
  },
  "style-choice": {
    style: "editorial",
    realism: "photorealistic",
    camera: "matched angle both panels — consistent framing and distance",
    text_density: "low",
    overlay: { allowed: true, type: "Option A label left panel, Option B label right panel — minimal pill-style labels" },
    composition: "horizontal split 50/50 — left=option A, right=option B, identical framing",
    lighting: "soft studio or natural — matched across both panels",
    mood: "inviting comparison, aspirational, clean",
  },
};

const VARIATION_AXES = ["scene_type", "camera_angle", "lighting", "emotional_tone", "product_placement"];

function serializeImagePromptJson(json: ImagePromptJson, aspectRatio: string): string {
  const parts: string[] = [];

  const stylePrefix = STYLE_PREFIX[json.style];
  if (stylePrefix) parts.push(stylePrefix);

  parts.push(`Canvas: ${aspectRatio} aspect ratio — compose the scene for this format.`);
  parts.push(json.scene);
  if (json.subject) parts.push(`Subject: ${json.subject}.`);
  if (json.product_placement) parts.push(`Product placement: ${json.product_placement}.`);
  parts.push(`Composition: ${json.composition}.`);
  parts.push(`Lighting: ${json.lighting}.`);
  if (json.camera && json.camera !== "none (graphic design)") parts.push(`Camera: ${json.camera}.`);
  parts.push(`Color palette: ${json.color_palette}.`);

  if (json.typography) {
    const typo = `Typography: ${json.typography.headline} headlines${json.typography.body ? `, ${json.typography.body} body text` : ""}.`;
    parts.push(typo);
  }

  if (!json.overlay.allowed) {
    parts.push("No text, no labels, no overlays — purely visual image.");
  } else if (json.overlay.type) {
    parts.push(`Text overlay: ${json.overlay.type}.`);
  }

  parts.push(`Mood: ${json.mood}.`);

  if (json.grain_noise && json.grain_noise !== "none") {
    parts.push(`Film grain/noise: ${json.grain_noise}.`);
  }

  return parts.filter(Boolean).join(" ");
}

function buildStrategyBlock(strategy: CreativeStrategy | null | undefined, angleKey: string | null | undefined, pillarKey: string | null | undefined): string {
  if (!strategy) return "";
  const parts: string[] = ["---", "", "CREATIVE STRATEGY:"];

  if (angleKey) {
    const angle = strategy.creative_angles.find(a => a.key === angleKey);
    if (angle) {
      parts.push(`Active Creative Angle: ${angle.label} — ${angle.description}`);
      parts.push(`Hook frame: ${angle.hook_frame}`);
    }
  }

  if (pillarKey) {
    const pillar = strategy.content_pillars.find(p => p.key === pillarKey);
    if (pillar) {
      parts.push(`Active Content Pillar: ${pillar.label} — ${pillar.description}`);
      parts.push(`Visual note: ${pillar.visual_note}`);
    }
  }

  const matchingHooks = strategy.hook_library.filter(h =>
    (!angleKey || h.angle_key === angleKey) &&
    (!pillarKey || h.pillar_key === pillarKey)
  ).slice(0, 3);

  if (matchingHooks.length > 0) {
    parts.push(`Hook Library (create variants — do not copy verbatim):`);
    matchingHooks.forEach((h, i) => parts.push(`  ${i + 1}. "${h.hook}"${h.performance_note ? ` (${h.performance_note})` : ""}`));
  }

  if (strategy.forbidden_elements.length > 0) {
    parts.push(`FORBIDDEN — never include: ${strategy.forbidden_elements.join(", ")}`);
  }

  parts.push("");
  return parts.join("\n");
}

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
Primary Font: ${dna.primary_font ?? "N/A"} (describe typography STYLE, not font name — e.g. "bold geometric sans-serif")
Secondary Font: ${dna.secondary_font ?? "N/A"} (describe as style — e.g. "elegant high-contrast serif")
Accent Color: ${dna.accent_color ?? "N/A"} ← describe visually in color_palette (e.g. "bright lime green"), NEVER write hex codes
Lettertype Color: ${dna.lettertype_color ?? "N/A"} ← describe visually
Background Color: ${dna.background_color ?? "N/A"} ← describe visually
`.trim();
}

const CONTENT_GOAL_INSTRUCTIONS: Record<ContentGoal, string> = {
  saves: "GOAL — SAVES: Include a genuinely useful tip, list, or reference that people will want to save and come back to. Add a 'save this post' CTA.",
  engagement: "GOAL — ENGAGEMENT: End with a direct, easy-to-answer question that invites comments or votes (e.g. 'A or B? Tell us below ↓'). Make it feel like a conversation starter.",
  reach: "GOAL — REACH: Use a relatable hook that makes people want to tag a friend or share. Frame it as something broadly recognisable.",
  sales: "GOAL — SALES: Include a clear product CTA. Use a specific benefit, anchor the value, and add urgency or social proof. Link in bio CTA.",
  trust: "GOAL — TRUST: Use social proof framing — quote, stat, testimonial, or third-party validation. Build credibility over selling.",
};

export async function generateContentPost({
  brandDna,
  templateName,
  platform,
  productName,
  productDescription,
  topicHint,
  selectedDesire,
  customerQuote,
  variationIndex,
  totalCount,
  creativeStrategy,
  activeAngleKey,
  activePillarKey,
  contentGoal,
  seasonalContext,
}: {
  brandDna: BrandDnaData;
  templateName: string;
  platform: Platform;
  productName?: string | null;
  productDescription?: string | null;
  topicHint?: string | null;
  selectedDesire?: string | null;
  customerQuote?: string | null;
  variationIndex?: number;
  totalCount?: number;
  creativeStrategy?: CreativeStrategy | null;
  activeAngleKey?: string | null;
  activePillarKey?: string | null;
  contentGoal?: ContentGoal | null;
  seasonalContext?: string | null;
}): Promise<ContentGenerationResult> {
  const platformTone = PLATFORM_TONE[platform];
  const aspectRatio = getPlatformAspectRatio(platform);
  const safeZoneNote = aspectRatio === "9:16"
    ? "SAFE ZONE: This is a 9:16 vertical format. ALL critical content (faces, product, key text, logos) MUST be placed in the center 4:5 safe zone — the middle portion of the frame, avoiding the top 12% and bottom 12% of height. Those edges will be cropped in Instagram feed. Compose as if the image is 4:5 but with extra breathing room top and bottom."
    : null;
  const templateSchema = TEMPLATE_SCHEMAS[templateName];
  const schemaJson = templateSchema ? JSON.stringify(templateSchema, null, 2) : "{}";

  // Infer niche from brand target_audience for winning ad matching
  const brandNiche = inferNiche(brandDna.target_audience ?? "");
  const winningAds = getWinningAds(templateName, brandNiche, 2);
  const winningAdsBlock = formatWinningAdsBlock(winningAds);

  const systemPrompt = `You are a social media content strategist and art director specialising in DTC brand content.

Your job: Generate TWO things for a social media post:
1. image_prompt_json — a structured JSON object describing the visual for an AI image generator (kie.ai). Fill in ALL fields based on the brand's visual system and the template schema constraints provided.
2. caption — the full social media caption written in the brand's language. Includes opening hook, body, CTA, and hashtags. Tone and length calibrated to the platform.

IMAGE PROMPT JSON RULES:
- scene: Specific description of what is happening in the image — place, action, objects. Be concrete.
- subject: The primary subject (person, product, arrangement). Specific, not vague.
- product_placement: How the product appears in the frame (skip if no product).
- composition: Exact layout rule — e.g. "centered hero product", "vertical split 50/50", "rule of thirds subject left". Must suit the canvas aspect ratio.
- lighting: Specific lighting type — e.g. "soft window light from left", "flat studio softbox", "golden hour backlight".
- camera: Specific camera description — e.g. "smartphone handheld", "medium telephoto 85mm shallow DOF", "overhead flatlay".
- color_palette: Describe all brand colors VISUALLY — e.g. "warm cream background, deep forest green accents, off-white text". NEVER write hex codes.
- typography.headline: Describe the visual STYLE of the headline type — e.g. "bold geometric sans-serif", "elegant high-contrast serif". Do NOT use font names like Poppins, Inter, or Canela.
- overlay.allowed: Must match the template schema. Do not change this.
- overlay.type: Specific description of what text/design overlay appears (if allowed).
- mood: The feeling the image should evoke. Specific and evocative.
- realism: Must match the template schema. Do not change this.
- grain_noise: Only for ugc_raw style — adds authenticity.

TEMPLATE SCHEMA CONSTRAINTS:
Some fields are pre-set by the template schema. You MUST respect those fixed values (style, realism, camera type, overlay rules, text_density). Fill in scene, subject, product_placement, color_palette, typography, and mood based on the brand.

LANGUAGE RULE:
- caption MUST be written in the language specified in the brand data. Non-negotiable.
- image_prompt_json fields MUST always be in English.

CAPTION STRUCTURE:
- Opening hook (1-2 lines that stop the scroll — Avatar Match + Open Loop + Clear Benefit)
- Body (the substance — tips, story, quote, transformation, etc.)
- CTA (one clear action)
- Hashtags (platform-appropriate quantity)

COPY RULES:
- Every caption opening MUST have: Avatar Match (reader feels "that's me") + Open Loop (question, "how to", incomplete statement) + Clear Benefit (WIIFM obvious before they stop reading)
- Voice and tone must match the brand personality exactly
- Do NOT write generic brand content — make it specific to this brand and their audience

OUTPUT: Valid JSON only. No markdown, no code blocks.

JSON Schema:
{
  "image_prompt_json": {
    "style": "editorial|clean_ad|ugc_raw|ui_card",
    "scene": "...",
    "subject": "...",
    "product_placement": "...",
    "composition": "...",
    "lighting": "...",
    "camera": "...",
    "color_palette": "...",
    "typography": { "headline": "...", "body": "..." },
    "text_density": "none|low|medium|high",
    "overlay": { "allowed": true|false, "type": "..." },
    "mood": "...",
    "realism": "photorealistic|stylized|graphic_design",
    "grain_noise": "none|slight|heavy"
  },
  "caption": "Full caption text with hashtags...",
  "caption_note": "One sentence explaining the angle used"
}`;

  const variationAxis = totalCount && totalCount > 1
    ? VARIATION_AXES[(variationIndex ?? 0) % VARIATION_AXES.length]
    : null;

  const strategyBlock = buildStrategyBlock(creativeStrategy, activeAngleKey, activePillarKey);

  const goalInstruction = contentGoal ? CONTENT_GOAL_INSTRUCTIONS[contentGoal] : null;

  const userMessage = `${brandDnaToText(brandDna)}
${strategyBlock}

---

Template: ${templateName}
Canvas: ${aspectRatio} (${platform}) — composition must suit this aspect ratio
${safeZoneNote ? safeZoneNote + "\n" : ""}Template schema constraints (RESPECT these fixed fields):
${schemaJson}

Platform: ${platform}
Caption tone & length: ${platformTone}
${goalInstruction ? `\nContent Goal: ${goalInstruction}` : ""}
${seasonalContext ? `\nSeasonal Context: ${seasonalContext} — subtly incorporate this seasonal atmosphere into the scene description where appropriate.` : ""}
${productName ? `\nProduct: ${productName}${productDescription ? `\nProduct Description: ${productDescription}` : ""}` : ""}
${selectedDesire ? `\nCustomer Desire to focus on: ${selectedDesire}` : ""}
${topicHint ? `\nTopic / Angle hint from user: ${topicHint}` : ""}
${templateName === "testimonial" && customerQuote ? `\nUse this EXACT customer quote verbatim in the testimonial: "${customerQuote}"` : ""}
${templateName === "testimonial" && !customerQuote ? `\nNo real customer quote provided — generate a plausible one and note in caption_note that it is a placeholder.` : ""}
${templateName === "style-choice" ? `\nFor style-choice: The image must show two distinct aesthetic options side-by-side. The topic hint describes the comparison (e.g. 'Nude vs Zwart'). Each panel should be a complete, beautiful scene in that aesthetic. Label panels A and B.` : ""}

---

Fill in the image_prompt_json using the brand visual system and template schema above.
The caption must be in ${brandDna.language ?? "English"} with ${platformTone}.${
    variationAxis
      ? `\n\nThis is variation ${(variationIndex ?? 0) + 1} of ${totalCount}. Vary specifically along this axis: **${variationAxis}**. Keep all other elements consistent with the template schema. Do not repeat concepts, scenes, or hooks from other variations.`
      : ""
  }${
    winningAdsBlock
      ? `\n\n---\n\n${winningAdsBlock}`
      : ""
  }`;

  const content = await generateText({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.75,
    responseFormat: { type: "json_object" },
  });

  const parsed = JSON.parse(content) as {
    image_prompt_json: ImagePromptJson;
    caption: string;
    caption_note: string;
  };

  if (!parsed.image_prompt_json || !parsed.caption) {
    throw new Error("Invalid content JSON structure returned by the LLM.");
  }

  // Serialize structured JSON → plain English prompt for kie.ai
  const serialized = serializeImagePromptJson(parsed.image_prompt_json, aspectRatio);

  // Apply cinematic camera/lens enhancement for photorealistic nano-banana-2 templates
  const cameraPreset = CONTENT_TEMPLATE_CAMERA_PRESETS[templateName];
  const finalImagePrompt = cameraPreset
    ? buildNanoBananaPrompt(serialized, cameraPreset.camera, cameraPreset.lens, cameraPreset.focal, cameraPreset.aperture)
    : serialized;

  return {
    image_prompt: finalImagePrompt,
    caption: parsed.caption,
    caption_note: parsed.caption_note,
  };
}

// Simple niche inference from target audience text.
// Used to match winning ads by niche — gracefully falls back to "other".
function inferNiche(targetAudience: string): string {
  const text = targetAudience.toLowerCase();
  if (/skin|beauty|face|glow|serum|moistur/.test(text)) return "skincare";
  if (/food|cook|recipe|eat|chef|kitchen|meal/.test(text)) return "food";
  if (/home|interior|decor|furniture|living/.test(text)) return "homewares";
  if (/fashion|style|cloth|wear|outfit|dress/.test(text)) return "fashion";
  if (/supplement|vitamin|health|wellness|nutrition/.test(text)) return "supplements";
  if (/fit|gym|workout|train|sport|exercise/.test(text)) return "fitness";
  if (/tech|software|app|digital|saas|dev/.test(text)) return "tech";
  if (/pet|dog|cat|animal/.test(text)) return "pet";
  if (/beauty|makeup|cosmetic|lipstick/.test(text)) return "beauty";
  return "other";
}
