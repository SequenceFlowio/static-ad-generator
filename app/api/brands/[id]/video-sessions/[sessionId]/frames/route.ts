import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { getServerSupabase, uploadToStorage } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateImages, withRetry } from "@/lib/kie";
import { createImageGenAIPro } from "@/lib/genaipro";
import type { SceneScript, VideoSession } from "@/types";

export const maxDuration = 300;

const FRAME_STAGGER_MS = 600; // stagger between parallel task submissions to avoid burst rate-limit

async function generateFrame(
  scenePrompt: string,
  aspectRatio: string,
  refUrls: string[],
  imageModel: string,
  numImages = 4,
): Promise<string[]> {
  if (imageModel === "nano-banana-pro-genai") {
    return await withRetry(
      () => createImageGenAIPro({
        prompt: scenePrompt,
        aspect_ratio: aspectRatio,
        model: "nano_banana_pro",
        number_of_images: numImages,
        reference_image_urls: refUrls.length > 0 ? refUrls : undefined,
        upscale_resolution: "none",
      }),
      { maxAttempts: 3, baseDelayMs: 3000 }
    );
  }
  // Default: nano-banana-2 via kie.ai
  return await withRetry(
    () => generateImages({
      prompt: scenePrompt,
      aspect_ratio: aspectRatio,
      resolution: "1K",
      num_images: numImages,
      model: "nano-banana-2",
      reference_image_urls: refUrls.length > 0 ? refUrls : undefined,
    }),
    { maxAttempts: 3, baseDelayMs: 3000 }
  );
}

async function generateAllFrames(
  sessionId: string,
  brandId: string,
  scenes: SceneScript[],
  aspectRatio: string,
  productImageUrl: string | null,
  characterRefUrl: string | null,
  environmentRefUrl: string | null,
  imageModel: string = "nano-banana-2",
) {
  const db = getServerSupabase();

  // Clear frame_error on scenes we're about to regenerate
  const { data: currentRow } = await db.from("video_sessions").select("scenes").eq("id", sessionId).single();
  const currentScenes = ((currentRow?.scenes ?? []) as SceneScript[]);
  const clearedScenes = currentScenes.map(s =>
    scenes.find(ms => ms.index === s.index) ? { ...s, frame_error: false } : s
  );
  await db.from("video_sessions").update({ scenes: clearedScenes, updated_at: new Date().toISOString() }).eq("id", sessionId);

  // Generate all frames in parallel with a stagger delay between submissions.
  // Each frame gets up to 3 attempts. After each success/failure, immediately patch DB.
  await Promise.all(scenes.map(async (scene, i) => {
    // Stagger submissions so we don't hit the API with all requests at once
    if (i > 0) await new Promise(r => setTimeout(r, i * FRAME_STAGGER_MS));

    const refUrls: string[] = [];
    if (scene.character_in_frame && characterRefUrl) refUrls.push(characterRefUrl);
    if (environmentRefUrl) refUrls.push(environmentRefUrl);
    if (scene.product_in_frame && productImageUrl) refUrls.push(productImageUrl);

    const scenePrompt = scene.product_in_frame && productImageUrl
      ? `${scene.nano_prompt}\n\nThe last reference image is the product. Render it faithfully but integrated naturally into the scene — maintain the same artistic style, lighting and perspective. Do not paste it as a flat overlay.`
      : scene.nano_prompt;

    try {
      const urls = await generateFrame(scenePrompt, aspectRatio, refUrls, imageModel, 4);

      const primaryUrl = urls[0] ?? null;
      const variants = urls.length > 0 ? urls : null;
      // Re-fetch to merge without overwriting sibling frames
      const { data: fresh } = await db.from("video_sessions").select("scenes").eq("id", sessionId).single();
      const freshScenes = ((fresh?.scenes ?? []) as SceneScript[]).map(s =>
        s.index === scene.index ? { ...s, image_url: primaryUrl, image_url_variants: variants, frame_error: !primaryUrl } : s
      );
      await db.from("video_sessions").update({ scenes: freshScenes, updated_at: new Date().toISOString() }).eq("id", sessionId);
    } catch {
      // Mark this scene as failed so the UI can show a retry button
      const { data: fresh } = await db.from("video_sessions").select("scenes").eq("id", sessionId).single();
      const freshScenes = ((fresh?.scenes ?? []) as SceneScript[]).map(s =>
        s.index === scene.index ? { ...s, image_url: null, frame_error: true } : s
      );
      await db.from("video_sessions").update({ scenes: freshScenes, updated_at: new Date().toISOString() }).eq("id", sessionId);
    }
  }));

  // Advance phase only if ALL frames succeeded
  const { data: finalRow } = await db.from("video_sessions").select("scenes").eq("id", sessionId).single();
  const finalScenes = ((finalRow?.scenes ?? []) as SceneScript[]);
  const allDone = finalScenes.length > 0 && finalScenes.every(s => !!s.image_url && !s.frame_error);

  await db.from("video_sessions").update({
    phase: allDone ? "prompt" : "frames",
    updated_at: new Date().toISOString(),
  }).eq("id", sessionId);
}

// POST — trigger generation of all scene frames
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId, sessionId } = await params;
  const db = getServerSupabase();

  const { data: session } = await db.from("video_sessions")
    .select("*").eq("id", sessionId).eq("brand_id", brandId).single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const videoSession = session as VideoSession;
  const scenes = (videoSession.scenes ?? []) as SceneScript[];

  // Load product image for product-in-frame scenes
  let productImageUrl: string | null = null;
  if (videoSession.product_id) {
    const { data: productRow } = await db.from("products")
      .select("image_urls").eq("id", videoSession.product_id).single();
    const imageUrls = (productRow?.image_urls ?? []) as string[];
    productImageUrl = imageUrls[0] ?? null;
  }

  const characterRefUrl = videoSession.character_ref_url ?? null;
  const environmentRefUrl = videoSession.environment_ref_url ?? null;

  // Only generate scenes that don't already have an image — preserve completed frames
  const missingScenes = scenes.filter(s => !s.image_url);

  await db.from("video_sessions").update({
    phase: "frames",
    updated_at: new Date().toISOString(),
  }).eq("id", sessionId);

  // Fire generation in background — return immediately so the client can start polling.
  // waitUntil keeps the Vercel function alive until all frames complete even after response is sent.
  waitUntil(
    generateAllFrames(sessionId, brandId, missingScenes, videoSession.aspect_ratio, productImageUrl, characterRefUrl, environmentRefUrl, videoSession.image_model ?? "nano-banana-2")
      .catch(err => console.error("generateAllFrames error:", err))
  );

  return NextResponse.json({ ok: true });
}

// PATCH — update a single frame (regenerate or upload)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId, sessionId } = await params;
  const db = getServerSupabase();

  const { data: session } = await db.from("video_sessions")
    .select("*").eq("id", sessionId).eq("brand_id", brandId).single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const videoSession = session as VideoSession;
  const scenes = (videoSession.scenes ?? []) as SceneScript[];

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    // Upload custom image for a scene
    const formData = await req.formData();
    const sceneIndex = parseInt(formData.get("scene_index") as string, 10);
    const file = formData.get("file") as File | null;

    if (!file || isNaN(sceneIndex)) {
      return NextResponse.json({ error: "Missing file or scene_index" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `video-frames/${sessionId}/${sceneIndex}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToStorage("product-images", path, buffer, file.type);

    const updatedScenes = scenes.map(s =>
      s.index === sceneIndex ? { ...s, image_url: url } : s
    );
    await db.from("video_sessions").update({
      scenes: updatedScenes,
      updated_at: new Date().toISOString(),
    }).eq("id", sessionId);

    return NextResponse.json({ url, scene_index: sceneIndex });
  }

  // JSON body — regenerate, adjust, or select a variant
  const body = await req.json() as {
    scene_index: number;
    action: "regenerate" | "adjust" | "select_variant";
    adjustment?: string;
    reference_url?: string;
    variant_url?: string;
  };

  // select_variant: just swap the active image_url without regenerating
  if (body.action === "select_variant" && body.variant_url) {
    const scene = scenes.find(s => s.index === body.scene_index);
    if (!scene) return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    const updatedScenes = scenes.map(s =>
      s.index === body.scene_index ? { ...s, image_url: body.variant_url! } : s
    );
    await db.from("video_sessions").update({ scenes: updatedScenes, updated_at: new Date().toISOString() }).eq("id", sessionId);
    return NextResponse.json({ ok: true, url: body.variant_url });
  }

  const scene = scenes.find(s => s.index === body.scene_index);
  if (!scene) return NextResponse.json({ error: "Scene not found" }, { status: 404 });

  // Load session refs for this scene
  let productImageUrl: string | null = null;
  if (videoSession.product_id) {
    const { data: productRow } = await db.from("products")
      .select("image_urls").eq("id", videoSession.product_id).single();
    const imgs = (productRow?.image_urls ?? []) as string[];
    productImageUrl = imgs[0] ?? null;
  }
  const characterRefUrl = videoSession.character_ref_url ?? null;
  const environmentRefUrl = videoSession.environment_ref_url ?? null;

  const sceneRefs: string[] = [];
  if (scene.character_in_frame && characterRefUrl) sceneRefs.push(characterRefUrl);
  if (environmentRefUrl) sceneRefs.push(environmentRefUrl);
  if (scene.product_in_frame && productImageUrl) sceneRefs.push(productImageUrl);

  const basePrompt = scene.product_in_frame && productImageUrl
    ? `${scene.nano_prompt}\n\nThe last reference image is the product. Render it faithfully but integrated naturally into the scene — maintain the same artistic style, lighting and perspective. Do not paste it as a flat overlay.`
    : scene.nano_prompt;

  let prompt = basePrompt;
  let refUrls: string[] = sceneRefs;

  if (body.action === "adjust" && body.adjustment) {
    prompt = `${basePrompt}\n\nAdjustment: ${body.adjustment}`;
    if (body.reference_url) refUrls = [body.reference_url, ...sceneRefs];
  }

  // Clear the frame immediately
  const clearScenes = scenes.map(s => s.index === body.scene_index ? { ...s, image_url: null } : s);
  await db.from("video_sessions").update({ scenes: clearScenes, updated_at: new Date().toISOString() }).eq("id", sessionId);

  try {
    const urls = await generateFrame(prompt, videoSession.aspect_ratio, refUrls, videoSession.image_model ?? "nano-banana-2", 4);
    const url = urls[0] ?? null;
    const variants = urls.length > 0 ? urls : null;
    const { data: fresh } = await db.from("video_sessions").select("scenes").eq("id", sessionId).single();
    const freshScenes = ((fresh?.scenes ?? []) as SceneScript[]).map(s =>
      s.index === body.scene_index ? { ...s, image_url: url, image_url_variants: variants, frame_error: !url } : s
    );
    await db.from("video_sessions").update({ scenes: freshScenes, updated_at: new Date().toISOString() }).eq("id", sessionId);
    return NextResponse.json({ ok: true, url, variants });
  } catch (err) {
    // Mark as failed so UI shows retry button
    const { data: fresh } = await db.from("video_sessions").select("scenes").eq("id", sessionId).single();
    const freshScenes = ((fresh?.scenes ?? []) as SceneScript[]).map(s =>
      s.index === body.scene_index ? { ...s, image_url: null, frame_error: true } : s
    );
    await db.from("video_sessions").update({ scenes: freshScenes, updated_at: new Date().toISOString() }).eq("id", sessionId);
    console.error("Frame regeneration failed:", err);
    return NextResponse.json({ error: "Frame generation failed" }, { status: 500 });
  }
}
