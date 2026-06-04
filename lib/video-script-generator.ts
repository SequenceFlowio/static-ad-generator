import type { BrandDnaData, Product, SceneScript, VideoVisualBible } from "@/types";
import { generateText } from "./llm";

export type VideoStyle = "ugc" | "lifestyle" | "product-hero" | "animation" | "cinematic";
export type VideoPlatform = "tiktok" | "instagram-reels" | "youtube-shorts";

export function getVideoAspectRatio(): string {
  return "9:16";
}

const STYLE_INSTRUCTIONS: Record<VideoStyle, string> = {
  ugc: "UGC (user-generated content). Authentic, handheld, real-person POV. Smartphone camera feel. Natural home/room lighting. Slightly imperfect framing — feels organic and unscripted.",
  lifestyle: "Lifestyle editorial. Clean but real. Product in context of daily life. Warm natural light. Aspirational but relatable — not overly polished.",
  "product-hero": "Product hero. Cinematic close-ups, elegant reveals, satisfying textures. Studio or premium location. Can include hands but no face required.",
  animation: "Pixar-style 3D CGI animation. Vibrant, expressive 3D characters and environments. Cinematic lighting, rich color grading. Warm, slightly stylized realism — not cartoonish. Character-driven storytelling with exaggerated but believable expressions.",
  cinematic: "Premium cinematic brand film. Ultra-wide or anamorphic lens feel. Dramatic but controlled lighting. Sweeping camera moves. High-contrast, desaturated-warm color grade. Feels like a movie trailer for a product.",
};

const STYLE_CAMERA: Record<VideoStyle, string> = {
  ugc: "smartphone handheld, slight natural shake, close-up POV, 9:16 vertical",
  lifestyle: "medium telephoto shallow DOF, handheld with stabilizer, 9:16 vertical",
  "product-hero": "studio macro / medium shot, locked off or slow push, 9:16 vertical",
  animation: "virtual 3D camera, smooth animated push-ins, expressive close-ups, 9:16 vertical",
  cinematic: "anamorphic wide angle, slow cinematic push or pull, dramatic rack focus, 9:16 vertical",
};

interface SceneNanoPromptJson {
  scene: string;
  character_action?: string;
  product_action?: string;
  camera: string;
  lighting: string;
  focus: string;
  mood: string;
}

interface RawSceneOutput {
  index: number;
  title: string;
  visual_description: string;
  nano_prompt_json: SceneNanoPromptJson;
  voiceover: string;
  duration_s: number;
  product_in_frame: boolean;
  character_in_frame: boolean;
}

interface RawScriptOutput {
  visual_bible: VideoVisualBible;
  scenes: RawSceneOutput[];
  seedance_prompt: string;
}

export interface ScriptGeneratorOutput {
  scenes: SceneScript[];
  seedance_prompt: string;
  visual_bible: VideoVisualBible;
}

function serializeNanoPrompt(
  bible: VideoVisualBible,
  scene: SceneNanoPromptJson,
  style: VideoStyle,
  hasCharacter: boolean,
  hasProduct: boolean,
  productName: string,
): string {
  const parts: string[] = [];

  // Style prefix
  const stylePrefixes: Record<VideoStyle, string> = {
    ugc: "UGC smartphone aesthetic. Authentic handheld video feel. Slightly imperfect framing.",
    lifestyle: "Editorial lifestyle photography. Clean composition. Natural and aspirational.",
    "product-hero": "Cinematic product photography. Elegant, high-detail composition.",
    animation: "Pixar-style 3D CGI animation. Vibrant colors, expressive characters, cinematic lighting.",
    cinematic: "Cinematic film still. Anamorphic lens. Dramatic lighting, premium color grade.",
  };
  parts.push(stylePrefixes[style]);

  // Scene
  parts.push(`Scene: ${scene.scene}.`);

  // Character — always from visual bible for consistency
  if (hasCharacter) {
    parts.push(`Person: ${bible.character}.`);
    if (scene.character_action) parts.push(`Action: ${scene.character_action}.`);
  }

  // Product
  if (hasProduct) {
    parts.push(`Product in frame: ${productName} — render product exactly as reference, do not alter shape, color, or design.`);
    if (scene.product_action) parts.push(`Product action: ${scene.product_action}.`);
  }

  // Environment — always from visual bible for consistency
  parts.push(`Environment: ${bible.environment}.`);

  // Technical
  parts.push(`Camera: ${scene.camera}.`);
  parts.push(`Lighting: ${scene.lighting}.`);
  parts.push(`Focus: ${scene.focus}.`);
  parts.push(`Color palette: ${bible.color_palette}.`);
  parts.push(`Mood: ${scene.mood}.`);

  // Always: no text, high quality
  parts.push("No text overlays, no captions, no watermarks in image.");
  const qualitySuffix: Record<VideoStyle, string> = {
    ugc: "Photorealistic, natural grain, authentic look, 9:16 vertical frame.",
    lifestyle: "Photorealistic, ultra-detailed, clean and aspirational, 9:16 vertical frame.",
    "product-hero": "Photorealistic, ultra-detailed, 8K resolution, 9:16 vertical frame.",
    animation: "Pixar 3D CGI render, ultra-detailed animation, vibrant cinematic lighting, 9:16 vertical frame.",
    cinematic: "Cinematic photorealistic, anamorphic film look, dramatic color grade, 9:16 vertical frame.",
  };
  parts.push(qualitySuffix[style]);

  return parts.join(" ");
}

export async function generateVideoScript({
  dna,
  product,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  productImageIndex,
  videoStyle,
  platform,
  numScenes,
  duration,
  includesPerson,
  voiceoverEnabled = true,
  notes,
  existingScenes,
  activeDesire,
  awarenessLevel,
  activeAngleDescription,
  characterRefDescription,
  environmentRefDescription,
}: {
  dna: BrandDnaData;
  product: Product;
  productImageIndex: number;
  videoStyle: VideoStyle;
  platform: VideoPlatform;
  numScenes: number;
  duration: number;
  includesPerson: boolean;
  voiceoverEnabled?: boolean;
  notes?: string;
  existingScenes?: SceneScript[];
  activeDesire?: string;
  awarenessLevel?: string;
  activeAngleDescription?: string;
  characterRefDescription?: string;
  environmentRefDescription?: string;
}): Promise<ScriptGeneratorOutput> {
  const aspectRatio = getVideoAspectRatio();
  const durationPerScene = Math.round((duration / numScenes) * 10) / 10;
  const isRefinement = !!existingScenes && !!notes;

  const systemPrompt = `You are a video creative director for DTC brands specializing in performance-driven social video.

Generate a ${duration}-second ${videoStyle} video script for ${platform} (${aspectRatio} vertical).
The video has exactly ${numScenes} scenes. Each scene is approximately ${durationPerScene} seconds.
Person in video: ${
    !includesPerson
      ? "No — product and environment only, no person or face."
      : videoStyle === "animation"
        ? "Yes — a 3D animated Pixar-style character (not a real person). Describe character visually for 3D rendering."
        : "Yes — a real creator/user appears in scenes."
  }
Style: ${STYLE_INSTRUCTIONS[videoStyle]}
Camera feel: ${STYLE_CAMERA[videoStyle]}

CRITICAL: The script structure MUST vary based on the awareness level provided. Do not use a fixed template.

GLOBAL FORBIDDEN (every script, no exceptions):
- "premium quality", "high quality", "amazing", "incredible" — filler words, never use
- Forced brand introductions like "Meet [brand]" unless awareness level is product-aware or most-aware
- Unnatural ad tone — voiceover must sound like a real person
- Feature lists without emotional context

CTA RULE: The LAST scene (scene ${numScenes}) must ALWAYS end with a clear, natural CTA that names the brand and/or product. Even in unaware/problem-aware scripts — the final scene is where the brand gets discovered. The CTA voiceover should feel like a natural culmination, not a forced add-on.

Brand language: "${dna.language}" — ALL voiceover/caption text MUST be in this language. All other fields (titles, descriptions, prompts) MUST be in English.

VISUAL CONSISTENCY RULES — this is critical for frame generation:
You must generate a "visual_bible" object FIRST. This defines the visual DNA that stays identical across ALL scenes:
- character: exact person description (age range, hair, skin, outfit — specific enough to generate the same person every scene)
- environment: exact setting (specific room details, furniture, materials, colors — same location every scene)
- lighting: lighting style and quality (same across all scenes)
- color_palette: visual color language (no hex codes — describe appearance)
- camera_feel: camera style that matches the video style

Then for each scene, use nano_prompt_json (structured JSON, NOT a free-form string) with these fields:
- scene: what's happening in the frame (1-2 sentences)
- character_action: what the person is doing (only if character_in_frame: true)
- product_action: how the product appears/is used (only if product_in_frame: true)
- camera: specific shot type and angle for this scene
- lighting: any scene-specific lighting note (or "as visual bible")
- focus: depth of field and focus point
- mood: emotional quality of this specific frame

PRODUCT TIMING — obey the awareness level rules exactly. Set product_in_frame: false for scenes where product is forbidden.

VOICE-OVER: ${voiceoverEnabled ? `YES — write natural spoken voiceover text for each scene. This will be recorded or displayed as captions.` : `NO — set voiceover to "" (empty string) for ALL scenes. Pure visual storytelling only. Do not embed voiceover in the Seedance prompt either.`}

SEEDANCE PROMPT RULES:
- Reference scenes as @Image1 through @Image${numScenes}
- The product reference photo is always @Image${numScenes + 1} — always include: "@Image${numScenes + 1} is the product reference — render it exactly as shown"
- Describe motion, camera movement, pacing, transitions
- Embed voiceover/captions in the prompt
- Keep under 300 words

OUTPUT: Valid JSON only, no markdown.

{
  "visual_bible": {
    "character": "woman, late 20s, medium brown shoulder-length hair, natural makeup, wearing oversized white linen shirt and stone-colored pants",
    "environment": "modern minimal kitchen, warm oak lower cabinets, white marble countertop, large window left side with warm morning light, clean white walls",
    "lighting": "soft natural morning light from left window, warm white balance, diffused — no harsh shadows",
    "color_palette": "warm whites, natural oak tones, soft rose product accents, stone gray",
    "camera_feel": "smartphone UGC, handheld, slight natural movement, close-up-heavy"
  },
  "scenes": [
    {
      "index": 1,
      "title": "Short scene name",
      "visual_description": "What happens visually (shown to user, plain English)",
      "nano_prompt_json": {
        "scene": "frustrated person at cluttered kitchen counter with mismatched tools",
        "character_action": "pulling mismatched spatulas from drawer, expression of annoyance",
        "product_action": null,
        "camera": "close-up smartphone handheld, slight shake, eye-level",
        "lighting": "as visual bible",
        "focus": "hands and drawer, slight background blur",
        "mood": "relatable frustration, chaotic energy"
      },
      "voiceover": "Exact spoken words or caption (in ${dna.language})",
      "duration_s": ${durationPerScene},
      "product_in_frame": false,
      "character_in_frame": true
    }
  ],
  "seedance_prompt": "Full Seedance 2 prompt with @Image refs..."
}`;

  let userContent = `Brand: ${dna.name}
${dna.tagline ? `Tagline: ${dna.tagline}` : ""}
${dna.target_audience ? `Target audience: ${dna.target_audience}` : ""}
${dna.brand_personality ? `Personality: ${dna.brand_personality}` : ""}
Colors: ${[dna.accent_color, dna.background_color, dna.lettertype_color].filter(Boolean).join(", ")}

Product: ${product.name}
${product.description ? `Description: ${product.description}` : ""}`;

  // Reference image anchors — lock visual bible to pre-generated refs
  if (characterRefDescription || environmentRefDescription) {
    userContent += `\n\nREFERENCE IMAGES HAVE BEEN PRE-GENERATED:`;
    if (characterRefDescription) {
      userContent += `\nCharacter reference: "${characterRefDescription}" — your visual_bible.character MUST exactly match this description word-for-word. The frame generator will use this as a reference image.`;
    }
    if (environmentRefDescription) {
      userContent += `\nEnvironment reference: "${environmentRefDescription}" — your visual_bible.environment MUST exactly match this description word-for-word. The frame generator will use this as a reference image.`;
    }
  }

  if (activeDesire) {
    userContent += `\n\nFOCUS DESIRE: "${activeDesire}" — every scene must connect to this desire. Make the viewer feel this desire more acutely and position the product as the answer.`;
  } else if (dna.customer_desires.length > 0) {
    userContent += `\nCustomer desires: ${dna.customer_desires.join(", ")}`;
  }

  // Awareness level — enforced scene-by-scene structure
  if (awarenessLevel) {
    const awarenessBlocks: Record<string, string> = {
      "unaware": `AWARENESS LEVEL: UNAWARE
Goal: trigger curiosity — viewer does NOT know they have a problem.
Required scene structure (${numScenes} scenes, adapt proportionally):
  Scene 1 — Pattern interrupt. Unexpected or striking visual/statement. No context.
  Scene 2 — Curiosity / confusion. Deepen the mystery or tension.
  Scene 3 — Unexpected insight. Reframe their world slightly.
  Scene 4 — Soft reveal. Product appears subtly, almost incidentally.
  Scene ${numScenes} — Natural CTA. Brand discovery feels earned, not forced.
STRICT RULES:
- product_in_frame: false for scenes 1-3.
- No brand name in voiceover until scene 4 at earliest.
- No selling language, no explicit CTAs before final scene.
- Tone: curious, slightly strange, intriguing.`,

      "problem-aware": `AWARENESS LEVEL: PROBLEM AWARE
Goal: recognition + emotional buildup — viewer knows the problem, not the solution.
Required scene structure (${numScenes} scenes, adapt proportionally):
  Scene 1 — Frustration hook. Specific pain point. Make them feel seen immediately.
  Scene 2 — Recognition. Deepen the problem. Specific detail that makes them nod.
  Scene 3 — Failed attempt. Show what they've tried and why it didn't work. Still NO product.
  Scene 4 — Natural product reveal. Subtle, organic. Not a hard intro.
  Scene ${numScenes} — Emotional payoff + CTA. Show the result AND name the brand.
STRICT RULES:
- product_in_frame: false for scenes 1, 2, and 3.
- NEVER write "Meet [brand]" or any forced brand intro.
- No hype. Tone must feel empathetic and real.
- Hook must name the specific frustration.`,

      "solution-aware": `AWARENESS LEVEL: SOLUTION AWARE
Goal: show a better approach — viewer is comparing solutions.
Required scene structure (${numScenes} scenes, adapt proportionally):
  Scene 1 — Problem reminder. Brief, sharp.
  Scene 2 — Solution comparison. Acknowledge what they've probably tried.
  Scene 3 — Why most solutions fail. Specific mechanism.
  Scene 4 — Introduce product as the better way. Mechanism-focused.
  Scene ${numScenes} — Concrete result + CTA. Specific outcome + brand name.
STRICT RULES:
- product_in_frame allowed from scene 3.
- Focus on mechanism and differentiation.
- Tone: informed, confident, peer-to-peer.`,

      "product-aware": `AWARENESS LEVEL: PRODUCT AWARE
Goal: remove doubt — viewer knows the product but hasn't committed.
Required scene structure (${numScenes} scenes, adapt proportionally):
  Scene 1 — Direct product hook. No buildup needed.
  Scene 2 — Key benefit. One specific, concrete thing.
  Scene 3 — Proof or real usage.
  Scene 4 — Reinforcement. Address the main objection or hesitation.
  Scene ${numScenes} — Direct CTA. Low friction. Brand + action.
STRICT RULES:
- product_in_frame: true from scene 1.
- No long storytelling.
- Tone: direct, confident, social-proof-driven.`,

      "most-aware": `AWARENESS LEVEL: MOST AWARE / READY TO BUY
Goal: conversion — get them to act now.
Required scene structure (${numScenes} scenes, adapt proportionally):
  Scene 1 — Lead with the offer, deal, or scarcity hook.
  Scene 2 — Urgency or incentive. Why now.
  Scene 3 — Core benefit reminder. One punchy line.
  Scene 4 — Social proof. Number, result, or person.
  Scene ${numScenes} — Extremely direct CTA. Tell them exactly what to do.
STRICT RULES:
- No storytelling. Every second pushes toward action.
- Short voiceover lines only.
- Tone: urgent, warm but direct.`,
    };

    userContent += `\n\n${awarenessBlocks[awarenessLevel] ?? `AWARENESS LEVEL: ${awarenessLevel}`}`;
  }

  // Creative angle
  if (activeAngleDescription) {
    userContent += `\n\nCREATIVE ANGLE: ${activeAngleDescription}
This angle defines the emotional tone, visual direction, and hook style for every scene.
- Opening hook must be immediately rooted in this angle.
- Visual descriptions AND the visual_bible environment must reflect this angle's aesthetic.
- The arc across all scenes is a natural expression of this angle.
- Do NOT name the angle explicitly in voiceover. Show it, don't say it.`;
  }

  if (isRefinement && existingScenes) {
    userContent += `\n\nEXISTING SCRIPT (refine based on notes below):
${existingScenes.map(s => `Scene ${s.index}: ${s.title}\nVisual: ${s.visual_description}\nVoiceover: ${s.voiceover}`).join("\n\n")}

REFINEMENT NOTES:
${notes}

Apply these notes while keeping the overall ${numScenes}-scene structure and visual_bible consistent. Only change what the notes ask for.`;
  } else {
    userContent += `\n\nGenerate a fresh ${numScenes}-scene script following the awareness level structure above exactly.
Hook immediately — first 2 seconds stop the scroll using the correct hook type for this awareness level.
Do NOT use a generic problem→solution→product arc. The structure above is the law.`;
    if (notes) {
      userContent += `\n\nExtra directorial notes: ${notes}`;
    }
  }

  const raw = await generateText({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.8,
    responseFormat: { type: "json_object" },
  });

  const parsed = JSON.parse(raw) as RawScriptOutput;

  const bible = parsed.visual_bible;

  // Serialize each scene's nano_prompt_json into a rich detailed string
  const scenes: SceneScript[] = parsed.scenes.map(s => ({
    index: s.index,
    title: s.title,
    visual_description: s.visual_description,
    nano_prompt: serializeNanoPrompt(
      bible,
      s.nano_prompt_json,
      videoStyle,
      s.character_in_frame,
      s.product_in_frame,
      product.name,
    ),
    voiceover: s.voiceover,
    duration_s: s.duration_s,
    image_url: null,
    product_in_frame: s.product_in_frame ?? false,
    character_in_frame: s.character_in_frame ?? includesPerson,
  }));

  return {
    scenes,
    seedance_prompt: parsed.seedance_prompt,
    visual_bible: bible,
  };
}
