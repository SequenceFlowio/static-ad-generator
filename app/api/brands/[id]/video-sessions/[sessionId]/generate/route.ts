import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateVideo } from "@/lib/kie";
import { framesToVideoGenAIPro } from "@/lib/genaipro";
import type { SceneScript, VideoSession } from "@/types";

export const maxDuration = 300;

async function runSeedanceGeneration(sessionId: string, seedancePrompt: string, referenceImageUrls: string[], aspectRatio: string, duration: number) {
  const db = getServerSupabase();
  try {
    const videoUrls = await generateVideo({
      prompt: seedancePrompt,
      aspect_ratio: aspectRatio,
      duration,
      reference_image_urls: referenceImageUrls,
    });

    const videoUrl = videoUrls[0] ?? null;
    await db.from("video_sessions").update({
      phase: videoUrl ? "done" : "failed",
      video_url: videoUrl,
      video_clips: videoUrl ? [videoUrl] : [],
      error_msg: videoUrl ? null : "No video URL returned from Seedance 2",
      updated_at: new Date().toISOString(),
    }).eq("id", sessionId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.from("video_sessions").update({
      phase: "failed",
      error_msg: msg,
      updated_at: new Date().toISOString(),
    }).eq("id", sessionId);
  }
}

async function runVeo31Generation(sessionId: string, prompt: string, frames: SceneScript[], aspectRatio: string) {
  const db = getServerSupabase();
  try {
    const validFrames = frames.filter(s => !!s.image_url);
    if (validFrames.length === 0) throw new Error("No frames available for Veo 3.1");

    let clips: string[];

    if (validFrames.length <= 3) {
      // Single clip: first → last frame
      const result = await framesToVideoGenAIPro({
        start_image_url: validFrames[0].image_url!,
        end_image_url: validFrames[validFrames.length - 1].image_url!,
        prompt,
        aspect_ratio: aspectRatio,
        upscale_resolution: "1080p",
      });
      clips = result.slice(0, 1);
    } else {
      // Split into 2 groups: first half + second half → 2× 8s clips
      const mid = Math.ceil(validFrames.length / 2);
      const group1 = validFrames.slice(0, mid);
      const group2 = validFrames.slice(mid);

      const [result1, result2] = await Promise.all([
        framesToVideoGenAIPro({
          start_image_url: group1[0].image_url!,
          end_image_url: group1[group1.length - 1].image_url!,
          prompt,
          aspect_ratio: aspectRatio,
          upscale_resolution: "1080p",
        }),
        framesToVideoGenAIPro({
          start_image_url: group2[0].image_url!,
          end_image_url: group2[group2.length - 1].image_url!,
          prompt,
          aspect_ratio: aspectRatio,
          upscale_resolution: "1080p",
        }),
      ]);
      clips = [result1[0], result2[0]].filter(Boolean) as string[];
    }

    if (clips.length === 0) throw new Error("No clips returned from Veo 3.1");

    await db.from("video_sessions").update({
      phase: "done",
      video_url: clips[0],
      video_clips: clips,
      error_msg: null,
      updated_at: new Date().toISOString(),
    }).eq("id", sessionId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.from("video_sessions").update({
      phase: "failed",
      error_msg: msg,
      updated_at: new Date().toISOString(),
    }).eq("id", sessionId);
  }
}

// POST — kick off video generation (Seedance 2 or Veo 3.1)
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
  const scenes = (videoSession.scenes ?? []) as SceneScript[];
  const videoModel = videoSession.video_model ?? "seedance-2";

  const body = await req.json() as { product_image_url?: string };
  const sceneImageUrls = scenes
    .sort((a, b) => a.index - b.index)
    .map(s => s.image_url)
    .filter(Boolean) as string[];

  if (sceneImageUrls.length === 0) {
    return NextResponse.json({ error: "No scene frames generated yet" }, { status: 400 });
  }

  if (!videoSession.seedance_prompt) {
    return NextResponse.json({ error: "No video prompt set" }, { status: 400 });
  }

  await db.from("video_sessions").update({
    phase: "generating_video",
    updated_at: new Date().toISOString(),
  }).eq("id", sessionId);

  if (videoModel === "veo-3.1") {
    const sortedScenes = scenes.sort((a, b) => a.index - b.index);
    waitUntil(runVeo31Generation(sessionId, videoSession.seedance_prompt, sortedScenes, videoSession.aspect_ratio));
  } else {
    // Seedance 2: pass all scene frames + product image as reference images
    const referenceImageUrls = [
      ...sceneImageUrls,
      ...(body.product_image_url ? [body.product_image_url] : []),
    ].slice(0, 9);

    waitUntil(runSeedanceGeneration(
      sessionId,
      videoSession.seedance_prompt,
      referenceImageUrls,
      videoSession.aspect_ratio,
      videoSession.duration
    ));
  }

  return NextResponse.json({ ok: true });
}
