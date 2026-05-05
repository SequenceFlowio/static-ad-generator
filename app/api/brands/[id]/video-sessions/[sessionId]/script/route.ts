import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateVideoScript } from "@/lib/video-script-generator";
import type { VideoStyle, VideoPlatform } from "@/lib/video-script-generator";
import type { BrandDnaData, Product, SceneScript, VideoSession } from "@/types";

export const maxDuration = 60;

// POST — generate initial script (called after references step)
export async function POST(
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

  const videoSession = session as VideoSession & { product_id: string | null };

  const body = await req.json() as {
    product_image_index?: number;
    active_desire?: string;
    awareness_level?: string;
    active_angle_key?: string;
    notes?: string;
    character_ref_prompt?: string;
    environment_ref_prompt?: string;
  };

  const [dnaRes, productRes] = await Promise.all([
    db.from("brand_dna").select("data").eq("brand_id", brandId).single(),
    videoSession.product_id
      ? db.from("products").select("id, name, description, url, image_urls, brand_id, created_at").eq("id", videoSession.product_id).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!dnaRes.data) return NextResponse.json({ error: "Brand DNA not found" }, { status: 404 });
  if (!productRes.data) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const dna = dnaRes.data.data as BrandDnaData;
  const product = productRes.data as Product;

  // Resolve angle description if key provided
  let activeAngleDescription: string | undefined;
  if (body.active_angle_key) {
    const { data: stratRow } = await db.from("creative_strategies")
      .select("creative_angles").eq("brand_id", brandId).single();
    if (stratRow?.creative_angles) {
      const angles = stratRow.creative_angles as Array<{ key: string; label: string; description: string; hook_frame: string }>;
      const angle = angles.find(a => a.key === body.active_angle_key);
      if (angle) activeAngleDescription = `${angle.label}: ${angle.description}. Hook frame: ${angle.hook_frame}`;
    }
  }

  const scriptOutput = await generateVideoScript({
    dna,
    product,
    productImageIndex: body.product_image_index ?? 0,
    videoStyle: videoSession.video_style as VideoStyle,
    platform: videoSession.platform as VideoPlatform,
    numScenes: videoSession.num_scenes,
    duration: videoSession.duration,
    includesPerson: videoSession.includes_person ?? true,
    activeDesire: body.active_desire,
    awarenessLevel: body.awareness_level,
    activeAngleDescription,
    notes: body.notes,
    characterRefDescription: body.character_ref_prompt,
    environmentRefDescription: body.environment_ref_prompt,
  });

  const { error } = await db.from("video_sessions").update({
    phase: "script",
    scenes: scriptOutput.scenes,
    seedance_prompt: scriptOutput.seedance_prompt,
    visual_bible: scriptOutput.visual_bible ?? null,
    updated_at: new Date().toISOString(),
  }).eq("id", sessionId);

  if (error) return NextResponse.json({ error: "Failed to save script" }, { status: 500 });

  return NextResponse.json({
    scenes: scriptOutput.scenes,
    seedance_prompt: scriptOutput.seedance_prompt,
    visual_bible: scriptOutput.visual_bible,
  });
}

// PATCH — update script (save manual edits OR regenerate)
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

  const body = await req.json() as {
    action: "save" | "regenerate";
    scenes?: SceneScript[];
    notes?: string;
    includes_person?: boolean;
    product_image_index?: number;
  };

  if (body.action === "save" && body.scenes) {
    const { error } = await db.from("video_sessions").update({
      scenes: body.scenes,
      updated_at: new Date().toISOString(),
    }).eq("id", sessionId);

    if (error) return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    return NextResponse.json({ scenes: body.scenes });
  }

  if (body.action === "regenerate") {
    const videoSession = session as VideoSession & { product_id: string | null };

    const [dnaRes, productRes] = await Promise.all([
      db.from("brand_dna").select("data").eq("brand_id", brandId).single(),
      videoSession.product_id
        ? db.from("products").select("id, name, description, url, image_urls, brand_id, created_at").eq("id", videoSession.product_id).single()
        : Promise.resolve({ data: null }),
    ]);

    if (!dnaRes.data || !productRes.data) {
      return NextResponse.json({ error: "Brand DNA or product not found" }, { status: 404 });
    }

    const dna = dnaRes.data.data as BrandDnaData;
    const product = productRes.data as Product;
    const currentScenes = (videoSession.scenes ?? []) as SceneScript[];

    const scriptOutput = await generateVideoScript({
      dna,
      product,
      productImageIndex: body.product_image_index ?? 0,
      videoStyle: videoSession.video_style as VideoStyle,
      platform: videoSession.platform as VideoPlatform,
      numScenes: videoSession.num_scenes,
      duration: videoSession.duration,
      includesPerson: body.includes_person ?? videoSession.includes_person ?? true,
      notes: body.notes,
      existingScenes: body.notes ? currentScenes : undefined,
    });

    const mergedScenes = scriptOutput.scenes.map((newScene) => {
      const existing = currentScenes.find(s => s.index === newScene.index);
      return { ...newScene, image_url: existing?.image_url ?? null };
    });

    const { error } = await db.from("video_sessions").update({
      scenes: mergedScenes,
      seedance_prompt: scriptOutput.seedance_prompt,
      visual_bible: scriptOutput.visual_bible ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", sessionId);

    if (error) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    return NextResponse.json({ scenes: mergedScenes, seedance_prompt: scriptOutput.seedance_prompt });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
