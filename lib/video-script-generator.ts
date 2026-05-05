import OpenAI from "openai";
import type { BrandDnaData, Product, SceneScript } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type VideoStyle = "ugc" | "lifestyle" | "product-hero";
export type VideoPlatform = "tiktok" | "instagram-reels" | "youtube-shorts";

export function getVideoAspectRatio(): string {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  productImageIndex,
  videoStyle,
  platform,
  numScenes,
  duration,
  includesPerson,
  notes,
  existingScenes,
  activeDesire,
  awarenessLevel,
  activeAngleDescription,
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
  existingScenes?: SceneScript[];
  activeDesire?: string;
  awarenessLevel?: string;
  activeAngleDescription?: string;
}): Promise<ScriptGeneratorOutput> {
  const aspectRatio = getVideoAspectRatio();
  const durationPerScene = Math.round((duration / numScenes) * 10) / 10;
  const isRefinement = !!existingScenes && !!notes;

  const systemPrompt = `You are a video creative director for DTC brands specializing in performance-driven social video.

Generate a ${duration}-second ${videoStyle} video script for ${platform} (${aspectRatio} vertical).
The video has exactly ${numScenes} scenes. Each scene is approximately ${durationPerScene} seconds.
Person in video: ${includesPerson ? "Yes — a real creator/user appears in scenes" : "No — product and hands only, no face"}.
Style: ${STYLE_INSTRUCTIONS[videoStyle]}

CRITICAL: The script structure MUST vary based on the awareness level provided. Do not use a fixed template. Each awareness level has its own required scene order and rules. Follow them exactly.

GLOBAL FORBIDDEN (apply to every script regardless of awareness level):
- "premium quality", "high quality", "amazing", "incredible" — these are filler words, never use them
- Forced brand introductions like "Meet [brand]" or "Introducing [product]" unless awareness level is product-aware or most-aware
- Unnatural ad tone — voiceover must sound like a real person, not a commercial script
- Listing features without emotional context — every benefit needs to connect to a feeling or outcome

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
Colors: ${[dna.accent_color, dna.background_color, dna.lettertype_color].filter(Boolean).join(", ")}

Product: ${product.name}
${product.description ? `Description: ${product.description}` : ""}`;

  // Focused desire — use specific desire over full list
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
  Scene 1 — Pattern interrupt. Unexpected or striking visual/statement. No context given.
  Scene 2 — Curiosity / confusion. Deepen the mystery or tension.
  Scene 3 — Unexpected insight. Reframe their world slightly.
  Scene 4 — Soft reveal. Product appears subtly, almost incidentally.
  Scene 5 — Open loop or intrigue. Leave them wanting more.
STRICT RULES:
- Product must NOT be mentioned or shown before scene 4.
- No brand name in voiceover until scene 4 at earliest.
- No selling language, no CTAs, no benefits listed.
- Tone: curious, slightly strange, intriguing.`,

      "problem-aware": `AWARENESS LEVEL: PROBLEM AWARE
Goal: recognition + emotional buildup — viewer knows the problem, not the solution.
Required scene structure (${numScenes} scenes, adapt proportionally):
  Scene 1 — Frustration hook. Open with the specific pain point. Make them feel seen immediately.
  Scene 2 — Recognition. Deepen the problem. Specific detail that makes them nod.
  Scene 3 — Micro-solution attempt (show what they've tried and why it failed). Still NO product.
  Scene 4 — Product appears for the first time. Subtle, natural reveal. Not a hard intro.
  Scene 5 — Payoff. Show the emotional result, not just the functional one.
STRICT RULES:
- Product is FORBIDDEN in scenes 1, 2, and 3.
- NEVER write "Meet [brand]" or any forced brand introduction.
- No hype or superlatives. Tone must feel empathetic and real.
- Hook must name the specific frustration, not a generic problem.`,

      "solution-aware": `AWARENESS LEVEL: SOLUTION AWARE
Goal: show a better approach — viewer is comparing solutions.
Required scene structure (${numScenes} scenes, adapt proportionally):
  Scene 1 — Problem reminder. Brief, sharp. They already know it.
  Scene 2 — Solution comparison. Acknowledge what they've probably tried.
  Scene 3 — Why most solutions fail. Be specific about the mechanism, not vague criticism.
  Scene 4 — Introduce product as the better way. Focus on the mechanism that makes it different.
  Scene 5 — Result. Concrete, believable outcome.
STRICT RULES:
- Product allowed from scene 3 onward.
- Focus on mechanism and differentiation, NOT hype or vague claims.
- No "premium quality" or generic benefit language.
- Tone: informed, confident, peer-to-peer.`,

      "product-aware": `AWARENESS LEVEL: PRODUCT AWARE
Goal: remove doubt — viewer knows the product but hasn't committed.
Required scene structure (${numScenes} scenes, adapt proportionally):
  Scene 1 — Direct hook about the product. No buildup needed.
  Scene 2 — Key benefit. One specific, concrete thing.
  Scene 3 — Proof or real usage. Show it working, not just existing.
  Scene 4 — Reinforcement. Address the unspoken objection or hesitation.
  Scene 5 — CTA. Clear, direct, low-friction.
STRICT RULES:
- Product can and should appear immediately in scene 1.
- No long storytelling or problem buildup.
- Every scene must earn trust or reduce friction.
- Tone: direct, confident, social-proof-driven.`,

      "most-aware": `AWARENESS LEVEL: MOST AWARE / READY TO BUY
Goal: conversion — get them to act now.
Required scene structure (${numScenes} scenes, adapt proportionally):
  Scene 1 — Lead with the offer, deal, or scarcity hook.
  Scene 2 — Urgency or incentive. Why now, not later.
  Scene 3 — Core benefit reminder. One line, max impact.
  Scene 4 — Social proof. Real signal (number, result, person).
  Scene 5 — CTA. Extremely direct. Tell them exactly what to do.
STRICT RULES:
- No storytelling. No slow buildup. Every second must push toward action.
- Short voiceover lines only — punchy, imperative.
- Tone: urgent, warm but direct.`,
    };

    userContent += `\n\n${awarenessBlocks[awarenessLevel] ?? `AWARENESS LEVEL: ${awarenessLevel}`}`;
  }

  // Creative angle
  if (activeAngleDescription) {
    userContent += `\n\nCREATIVE ANGLE: ${activeAngleDescription}
This angle defines the emotional tone, visual direction, and hook style for every scene.
- The opening hook must be rooted in this angle — make it immediately recognizable.
- Visual descriptions must reflect this angle's aesthetic (chaos vs calm, mismatch vs harmony, etc.).
- The arc across all scenes must feel like a natural expression of this angle, not a bolt-on label.
- Do NOT name the angle explicitly in voiceover. Let it come through the visuals and language.`;
  }

  if (isRefinement && existingScenes) {
    userContent += `\n\nEXISTING SCRIPT (refine this based on the notes below):
${existingScenes.map(s => `Scene ${s.index}: ${s.title}\nVisual: ${s.visual_description}\nVoiceover: ${s.voiceover}`).join("\n\n")}

REFINEMENT NOTES FROM USER:
${notes}

Apply these notes while keeping the overall ${numScenes}-scene structure. Only change what the notes ask for.`;
  } else {
    userContent += `\n\nGenerate a fresh ${numScenes}-scene script following the awareness level structure above exactly.
Hook immediately — first 2 seconds must stop the scroll based on the correct hook type for this awareness level.
Do NOT default to a generic problem→solution→product arc. The structure is defined above — follow it.`;
    if (notes) {
      userContent += `\n\nExtra directorial notes: ${notes}`;
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
