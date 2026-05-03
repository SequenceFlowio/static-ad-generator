import OpenAI from "openai";
import type { BrandDnaData, Product, SceneScript } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type VideoStyle = "ugc" | "lifestyle" | "product-hero";
export type VideoPlatform = "tiktok" | "instagram-reels" | "youtube-shorts";

export function getVideoAspectRatio(platform: VideoPlatform): string {
  return "9:16"; // all supported platforms are vertical
}

const STYLE_INSTRUCTIONS: Record<VideoStyle, string> = {
  ugc: "UGC (user-generated content). Authentic, handheld, real-person POV. Someone holding the product, talking directly to camera, showing results. Natural home/room lighting. Feels organic, unscripted.",
  lifestyle: "Lifestyle editorial. Clean but real. Product in context of daily life. Person interacting with product naturally in a relatable setting. Warm, aspirational.",
  "product-hero": "Product hero. Cinematic close-ups, elegant reveals, satisfying textures. Can include hands but no face required. Studio or premium location setting.",
};

export interface ScriptGeneratorOutput {
  scenes: SceneScript[];
  seedance_prompt: string;
}

export async function generateVideoScript({
  dna,
  product,
  productImageIndex,
  videoStyle,
  platform,
  numScenes,
  duration,
  includesPerson,
  notes,
  existingScenes,
}: {
  dna: BrandDnaData;
  product: Product;
  productImageIndex: number;
  videoStyle: VideoStyle;
  platform: VideoPlatform;
  numScenes: number;
  duration: number;
  includesPerson: boolean;
  notes?: string;
  existingScenes?: SceneScript[]; // provided when regenerating with refinement
}): Promise<ScriptGeneratorOutput> {
  const aspectRatio = getVideoAspectRatio(platform);
  const durationPerScene = Math.round((duration / numScenes) * 10) / 10;
  const isRefinement = !!existingScenes && !!notes;

  const systemPrompt = `You are a video creative director for DTC brands.

Generate a ${duration}-second ${videoStyle} video script for ${platform} (${aspectRatio} vertical).
The video has exactly ${numScenes} scenes. Each scene is approximately ${durationPerScene} seconds.
Person in video: ${includesPerson ? "Yes — a real creator/user appears in scenes" : "No — product and hands only, no face"}.
Style: ${STYLE_INSTRUCTIONS[videoStyle]}

Brand language: "${dna.language}" — ALL voiceover/caption text MUST be in this language. Scene titles, visual_description, and nano_prompt MUST be in English.

NANO PROMPT RULES (for Nano Banana 2 image generator):
- ${aspectRatio} vertical frame
- Describe visual style, lighting, composition, brand colors by appearance (not hex codes), no font names
- No text overlays in nano_prompt — those live in voiceover only
- Keep consistent visual style and brand aesthetic across all scenes

SEEDANCE PROMPT RULES:
- Reference scenes as @Image1 through @Image${numScenes}
- The product reference photo is always @Image${numScenes + 1} — always include: "@Image${numScenes + 1} is the product reference — render it exactly as shown, do not alter product design or color"
- Describe motion, camera movement, pacing, transitions, overall feel
- Keep concise (under 300 words)
- Voiceover/script text must be embedded as captions or spoken, describe this in the prompt

OUTPUT: Valid JSON only, no markdown.

{
  "scenes": [
    {
      "index": 1,
      "title": "Short scene name",
      "visual_description": "What happens visually in this scene",
      "nano_prompt": "Full Nano Banana 2 prompt for the still frame",
      "voiceover": "Exact spoken words or on-screen caption text (in ${dna.language})",
      "duration_s": ${durationPerScene},
      "image_url": null
    }
  ],
  "seedance_prompt": "Full Seedance 2 prompt with @Image refs..."
}`;

  let userContent = `Brand: ${dna.name}
${dna.tagline ? `Tagline: ${dna.tagline}` : ""}
${dna.target_audience ? `Target audience: ${dna.target_audience}` : ""}
${dna.brand_personality ? `Personality: ${dna.brand_personality}` : ""}
${dna.customer_desires.length > 0 ? `Customer desires: ${dna.customer_desires.join(", ")}` : ""}
Colors: ${[dna.accent_color, dna.background_color, dna.lettertype_color].filter(Boolean).join(", ")}

Product: ${product.name}
${product.description ? `Description: ${product.description}` : ""}`;

  if (isRefinement && existingScenes) {
    userContent += `\n\nEXISTING SCRIPT (refine this based on the notes below):
${existingScenes.map(s => `Scene ${s.index}: ${s.title}\nVisual: ${s.visual_description}\nVoiceover: ${s.voiceover}`).join("\n\n")}

REFINEMENT NOTES FROM USER:
${notes}

Apply these notes while keeping the overall ${numScenes}-scene structure. Only change what the notes ask for.`;
  } else {
    userContent += `\n\nGenerate a fresh ${numScenes}-scene script. Hook immediately — first 2 seconds must stop the scroll.`;
    if (notes) {
      userContent += `\n\nDirectorial notes: ${notes}`;
    }
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw) as ScriptGeneratorOutput;

  // Ensure image_url is null (not undefined) on all scenes
  return {
    scenes: parsed.scenes.map(s => ({ ...s, image_url: s.image_url ?? null })),
    seedance_prompt: parsed.seedance_prompt,
  };
}
