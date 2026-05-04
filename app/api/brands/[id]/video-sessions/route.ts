import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateVideoScript, getVideoAspectRatio } from "@/lib/video-script-generator";
import type { VideoStyle, VideoPlatform } from "@/lib/video-script-generator";
import type { BrandDnaData, Product } from "@/types";

export const maxDuration = 60;

// POST — create session + generate initial script
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
    product_image_index: number;
    notes?: string;
  };

  const { product_id, video_style, platform, num_scenes, duration, includes_person, product_image_index, notes } = body;

  // Load brand DNA + product
  const [dnaRes, productRes] = await Promise.all([
    db.from("brand_dnas").select("data").eq("brand_id", brandId).single(),
    db.from("products").select("id, name, description, url, image_urls, brand_id, created_at").eq("id", product_id).single(),
  ]);

  if (!dnaRes.data) return NextResponse.json({ error: "Brand DNA not found" }, { status: 404 });
  if (!productRes.data) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const dna = dnaRes.data.data as BrandDnaData;
  const product = productRes.data as Product;
  const aspectRatio = getVideoAspectRatio();

  // Generate script
  const scriptOutput = await generateVideoScript({
    dna,
    product,
    productImageIndex: product_image_index,
    videoStyle: video_style,
    platform,
    numScenes: num_scenes,
    duration,
    includesPerson: includes_person,
    notes,
  });

  // Create session
  const { data: session, error } = await db.from("video_sessions").insert({
    brand_id: brandId,
    product_id,
    video_style,
    platform,
    aspect_ratio: aspectRatio,
    num_scenes,
    duration,
    phase: "script",
    scenes: scriptOutput.scenes,
    seedance_prompt: scriptOutput.seedance_prompt,
  }).select("*").single();

  if (error || !session) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  return NextResponse.json({ session });
}

// GET — list sessions for brand
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const db = getServerSupabase();

  const { data: sessions } = await db.from("video_sessions")
    .select("id, phase, video_style, platform, num_scenes, duration, created_at, video_url")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  return NextResponse.json(sessions ?? []);
}
