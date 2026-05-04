import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateVideoScript } from "@/lib/video-script-generator";
import type { VideoStyle, VideoPlatform } from "@/lib/video-script-generator";
import type { BrandDnaData, Product, SceneScript, VideoSession } from "@/types";

export const maxDuration = 60;

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
    scenes?: SceneScript[];  // for save
    notes?: string;           // for regenerate
    includes_person?: boolean;
    product_image_index?: number;
  };

  if (body.action === "save" && body.scenes) {
    // Save manual edits
    const { error } = await db.from("video_sessions").update({
      scenes: body.scenes,
      updated_at: new Date().toISOString(),
    }).eq("id", sessionId);

    if (error) return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    return NextResponse.json({ scenes: body.scenes });
  }

  if (body.action === "regenerate") {
    // Load brand DNA + product for regeneration
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
      includesPerson: body.includes_person ?? true,
      notes: body.notes,
      existingScenes: body.notes ? currentScenes : undefined,
    });

    // Preserve existing image_urls from current scenes
    const mergedScenes = scriptOutput.scenes.map((newScene) => {
      const existing = currentScenes.find(s => s.index === newScene.index);
      return { ...newScene, image_url: existing?.image_url ?? null };
    });

    const { error } = await db.from("video_sessions").update({
      scenes: mergedScenes,
      seedance_prompt: scriptOutput.seedance_prompt,
      updated_at: new Date().toISOString(),
    }).eq("id", sessionId);

    if (error) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    return NextResponse.json({ scenes: mergedScenes, seedance_prompt: scriptOutput.seedance_prompt });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
