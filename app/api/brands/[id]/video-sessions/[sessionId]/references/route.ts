import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateImages, withRetry } from "@/lib/kie";

export const maxDuration = 120;

// POST — generate a character or environment reference image via Nano Banana 2
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId, sessionId } = await params;
  const db = getServerSupabase();

  const { data: session } = await db.from("video_sessions")
    .select("id, brand_id, video_style").eq("id", sessionId).eq("brand_id", brandId).single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    type: "character" | "environment";
    prompt: string;
  };

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const isAnimation = session.video_style === "animation";

  // Build nano banana prompt for the reference type
  let fullPrompt: string;
  if (body.type === "character") {
    fullPrompt = isAnimation
      ? `3D character reference sheet. Pixar-style CGI animated character. ${body.prompt}. Neutral expression, front-facing pose, clean neutral background. Vibrant colors, expressive 3D design, cinematic Pixar lighting. No text, no logos.`
      : `Portrait reference photo. ${body.prompt}. Neutral expression, looking slightly off-camera. Natural lighting, clean neutral background. Full upper body visible. Photorealistic, ultra-detailed, 8K, 9:16 vertical frame. No text, no logos.`;
  } else {
    fullPrompt = isAnimation
      ? `3D environment concept art. Pixar-style CGI animated setting. ${body.prompt}. No people. Vibrant colors, warm cinematic lighting, playful depth. Pixar render quality. No text, no logos.`
      : `Environment reference photo. ${body.prompt}. No people, no faces. Clean empty space. Natural or studio lighting. Photorealistic, ultra-detailed, 8K, 9:16 vertical frame. No text, no logos.`;
  }

  let urls: string[];
  try {
    urls = await withRetry(
      () => generateImages({ prompt: fullPrompt, aspect_ratio: "9:16", resolution: "1K", num_images: 1, model: "nano-banana-2" }),
      { maxAttempts: 3, baseDelayMs: 2000 }
    );
  } catch {
    return NextResponse.json({ error: "Generation failed after 3 attempts — please try again." }, { status: 500 });
  }

  const url = urls[0] ?? null;
  if (!url) return NextResponse.json({ error: "Generation failed — no image returned." }, { status: 500 });

  // Save to session
  const column = body.type === "character" ? "character_ref_url" : "environment_ref_url";
  await db.from("video_sessions").update({
    [column]: url,
    updated_at: new Date().toISOString(),
  }).eq("id", sessionId);

  return NextResponse.json({ url });
}

// PATCH — save an uploaded reference image URL
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId, sessionId } = await params;
  const db = getServerSupabase();

  const { data: session } = await db.from("video_sessions")
    .select("id").eq("id", sessionId).eq("brand_id", brandId).single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const { uploadToStorage } = await import("@/lib/supabase");
    const formData = await req.formData();
    const type = formData.get("type") as "character" | "environment";
    const file = formData.get("file") as File | null;

    if (!file || !type) return NextResponse.json({ error: "Missing file or type" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `video-refs/${sessionId}/${type}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToStorage("product-images", path, buffer, file.type);

    const column = type === "character" ? "character_ref_url" : "environment_ref_url";
    await db.from("video_sessions").update({
      [column]: url,
      updated_at: new Date().toISOString(),
    }).eq("id", sessionId);

    return NextResponse.json({ url });
  }

  // JSON body — clear a reference
  const body = await req.json() as { type: "character" | "environment"; url: string | null };
  const column = body.type === "character" ? "character_ref_url" : "environment_ref_url";
  await db.from("video_sessions").update({
    [column]: body.url,
    updated_at: new Date().toISOString(),
  }).eq("id", sessionId);

  return NextResponse.json({ ok: true });
}
