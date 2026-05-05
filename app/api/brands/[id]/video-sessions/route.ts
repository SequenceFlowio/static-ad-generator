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
  };

  const { product_id, video_style, platform, num_scenes, duration, includes_person } = body;
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
    phase: "references",
    scenes: [],
    seedance_prompt: null,
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

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Lazy cleanup: delete sessions older than 7 days (fire-and-forget)
  db.from("video_sessions").delete().eq("brand_id", brandId).lt("created_at", cutoff).then(() => {/* no-op */});

  const { data: sessions } = await db.from("video_sessions")
    .select("id, phase, video_style, platform, num_scenes, duration, created_at, video_url, product_id, includes_person, scenes")
    .eq("brand_id", brandId)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false });

  return NextResponse.json(sessions ?? []);
}
