import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { getVideoAspectRatio } from "@/lib/video-script-generator";
import type { VideoStyle, VideoPlatform } from "@/lib/video-script-generator";

export const maxDuration = 30;

// POST — create session (phase: references — script generated in separate step)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const db = getServerSupabase();

  const { data: brand } = await db.from("brands").select("id").eq("id", brandId).eq("user_id", user.id).single();
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const body = await req.json() as {
    product_id: string;
    video_style: VideoStyle;
    platform: VideoPlatform;
    num_scenes: number;
    duration: number;
    includes_person: boolean;
    image_model?: string;
    video_model?: string;
    voiceover_enabled?: boolean;
  };

  const { product_id, video_style, platform, num_scenes, duration, includes_person, image_model, video_model, voiceover_enabled } = body;
  const aspectRatio = getVideoAspectRatio();

  const { data: session, error } = await db.from("video_sessions").insert({
    brand_id: brandId,
    product_id,
    video_style,
    platform,
    aspect_ratio: aspectRatio,
    num_scenes,
    duration,
    includes_person,
    image_model: image_model ?? "nano-banana-2",
    video_model: video_model ?? "seedance-2",
    voiceover_enabled: voiceover_enabled ?? false,
    phase: "references",
    scenes: [],
    seedance_prompt: null,
    video_clips: [],
  }).select("*").single();

  if (error || !session) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  return NextResponse.json({ session });
}

// GET — list sessions for brand (last 7 days, lazy cleanup of older sessions)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const db = getServerSupabase();

  const { data: sessions } = await db.from("video_sessions")
    .select("id, phase, video_style, platform, num_scenes, duration, created_at, video_url, product_id, includes_person, scenes")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  return NextResponse.json(sessions ?? []);
}
