import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { getServerSupabase, uploadToStorage } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateImages } from "@/lib/kie";
import type { SceneScript, VideoSession } from "@/types";

export const maxDuration = 300;

async function generateAllFrames(
  sessionId: string,
  brandId: string,
  scenes: SceneScript[],
  aspectRatio: string,
  productImageUrl: string | null,
  characterRefUrl: string | null,
  environmentRefUrl: string | null,
) {
  const db = getServerSupabase();

  const results = await Promise.allSettled(
    scenes.map(async (scene) => {
      try {
        const refUrls: string[] = [];
        // Character ref for scenes with a person
        if (scene.character_in_frame && characterRefUrl) refUrls.push(characterRefUrl);
        // Environment ref for all scenes (sets the visual backdrop)
        if (environmentRefUrl) refUrls.push(environmentRefUrl);
        // Product ref for scenes where product appears
        if (scene.product_in_frame && productImageUrl) refUrls.push(productImageUrl);

        const urls = await generateImages({
          prompt: scene.nano_prompt,
          aspect_ratio: aspectRatio,
          resolution: "2K",
          num_images: 1,
          model: "nano-banana-2",
          reference_image_urls: refUrls.length > 0 ? refUrls : undefined,
        });
        return { index: scene.index, url: urls[0] ?? null };
      } catch {
        return { index: scene.index, url: null };
      }
    })
  );

  // Build updated scenes with image_urls
  const { data: sessionRow } = await db.from("video_sessions").select("scenes").eq("id", sessionId).single();
  const currentScenes = ((sessionRow?.scenes ?? []) as SceneScript[]);

  const updatedScenes = currentScenes.map((s) => {
    const result = results.find(
      (r) => r.status === "fulfilled" && r.value.index === s.index
    );
    if (result?.status === "fulfilled" && result.value.url) {
      return { ...s, image_url: result.value.url };
    }
    return s;
  });

  await db.from("video_sessions").update({
    scenes: updatedScenes,
    phase: "frames",
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

  // Mark scenes as generating (clear image_urls so UI shows loading)
  const clearScenes = scenes.map(s => ({ ...s, image_url: null }));
  await db.from("video_sessions").update({
    scenes: clearScenes,
    phase: "frames",
    updated_at: new Date().toISOString(),
  }).eq("id", sessionId);

  waitUntil(generateAllFrames(sessionId, brandId, scenes, videoSession.aspect_ratio, productImageUrl, characterRefUrl, environmentRefUrl));

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

  // JSON body — regenerate or adjust single frame
  const body = await req.json() as {
    scene_index: number;
    action: "regenerate" | "adjust";
    adjustment?: string;
    reference_url?: string;
  };

  const scene = scenes.find(s => s.index === body.scene_index);
  if (!scene) return NextResponse.json({ error: "Scene not found" }, { status: 404 });

  let prompt = scene.nano_prompt;
  let refUrls: string[] | undefined;

  if (body.action === "adjust" && body.adjustment) {
    prompt = `${scene.nano_prompt}\n\nAdjustment: ${body.adjustment}`;
    if (body.reference_url) refUrls = [body.reference_url];
  }

  // Clear the frame immediately
  const clearScenes = scenes.map(s => s.index === body.scene_index ? { ...s, image_url: null } : s);
  await db.from("video_sessions").update({ scenes: clearScenes, updated_at: new Date().toISOString() }).eq("id", sessionId);

  // Generate in background
  waitUntil((async () => {
    try {
      const urls = await generateImages({
        prompt,
        aspect_ratio: videoSession.aspect_ratio,
        resolution: "2K",
        num_images: 1,
        model: "nano-banana-2",
        reference_image_urls: refUrls,
      });
      const url = urls[0] ?? null;
      const { data: fresh } = await db.from("video_sessions").select("scenes").eq("id", sessionId).single();
      const freshScenes = ((fresh?.scenes ?? []) as SceneScript[]).map(s =>
        s.index === body.scene_index ? { ...s, image_url: url } : s
      );
      await db.from("video_sessions").update({ scenes: freshScenes, updated_at: new Date().toISOString() }).eq("id", sessionId);
    } catch (err) {
      console.error("Frame regeneration failed:", err);
    }
  })());

  return NextResponse.json({ ok: true });
}
