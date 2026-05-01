import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateImages, generateVideo } from "@/lib/kie";
import { generateVideoPrompt, getVideoAspectRatio } from "@/lib/video-prompt-generator";
import type { VideoStyle, VideoPlatform } from "@/lib/video-prompt-generator";

export const maxDuration = 300;

async function processVideoJob(
  jobId: string,
  brandId: string,
  productId: string,
  dna: Record<string, unknown>,
  product: { name: string; description: string | null; image_urls: string[] },
  videoStyle: VideoStyle,
  platform: VideoPlatform,
  duration: 5 | 10 | 15,
  includesPerson: boolean,
  aspectRatio: string
) {
  const db = getServerSupabase();

  try {
    // Step 1 — generate scene descriptions + video_prompt via GPT-4o
    await db.from("video_jobs").update({ status: "generating_scenes" }).eq("id", jobId);

    const videoOutput = await generateVideoPrompt({
      dna: dna as unknown as Parameters<typeof generateVideoPrompt>[0]["dna"],
      product: { id: productId, brand_id: brandId, created_at: "", url: null, ...product },
      videoStyle,
      platform,
      duration,
      includesPerson,
    });

    // Step 2 — generate scene frames with Nano Banana 2 in parallel
    const scenePromises = videoOutput.scenes.map((scene) =>
      generateImages({
        prompt: scene.nano_prompt,
        aspect_ratio: aspectRatio,
        resolution: "2K",
        num_images: 1,
        model: "nano-banana-2",
      }).then((urls) => urls[0] ?? null).catch(() => null)
    );

    const sceneUrls = (await Promise.all(scenePromises)).filter(Boolean) as string[];

    // Step 3 — assemble reference images: scenes + product photo
    const productImageUrl = product.image_urls?.[0] ?? null;
    const referenceImageUrls = [
      ...sceneUrls,
      ...(productImageUrl ? [productImageUrl] : []),
    ].slice(0, 9);

    await db.from("video_jobs").update({
      scene_image_urls: sceneUrls,
      reference_image_urls: referenceImageUrls,
      video_prompt: videoOutput.video_prompt,
      script: videoOutput.script,
      status: "generating_video",
    }).eq("id", jobId);

    // Step 4 — generate video with Seedance 2
    const videoUrls = await generateVideo({
      prompt: videoOutput.video_prompt,
      aspect_ratio: aspectRatio,
      duration,
      reference_image_urls: referenceImageUrls,
    });

    const videoUrl = videoUrls[0] ?? null;

    await db.from("video_jobs").update({
      status: videoUrl ? "done" : "failed",
      video_url: videoUrl,
      error_msg: videoUrl ? null : "No video URL returned from Seedance 2",
    }).eq("id", jobId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.from("video_jobs").update({
      status: "failed",
      error_msg: msg,
    }).eq("id", jobId);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = params.id;
  const db = getServerSupabase();

  // Verify brand ownership
  const { data: brand } = await db.from("brands").select("id").eq("id", brandId).eq("user_id", user.id).single();
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const body = await req.json() as {
    product_id: string;
    video_style: VideoStyle;
    platform: VideoPlatform;
    duration: 5 | 10 | 15;
    includes_person: boolean;
  };

  const { product_id, video_style, platform, duration, includes_person } = body;

  // Load brand DNA
  const { data: dnaRow } = await db.from("brand_dnas").select("data").eq("brand_id", brandId).single();
  if (!dnaRow) return NextResponse.json({ error: "Brand DNA not found" }, { status: 404 });

  // Load product
  const { data: product } = await db.from("products").select("id, name, description, image_urls").eq("id", product_id).single();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const aspectRatio = getVideoAspectRatio(platform);

  // Create job record
  const { data: job, error: jobErr } = await db.from("video_jobs").insert({
    brand_id: brandId,
    product_id,
    status: "pending",
    duration,
    aspect_ratio: aspectRatio,
    video_style,
  }).select("id").single();

  if (jobErr || !job) {
    return NextResponse.json({ error: "Failed to create video job" }, { status: 500 });
  }

  // Fire background processing
  waitUntil(
    processVideoJob(
      job.id,
      brandId,
      product_id,
      dnaRow.data as Record<string, unknown>,
      product,
      video_style,
      platform,
      duration,
      includes_person,
      aspectRatio
    )
  );

  return NextResponse.json({ job_id: job.id });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = params.id;
  const db = getServerSupabase();

  const url = new URL(req.url);
  const jobId = url.searchParams.get("job_id");

  if (jobId) {
    const { data: job } = await db.from("video_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("brand_id", brandId)
      .single();
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(job);
  }

  // List all video jobs for brand
  const { data: jobs } = await db.from("video_jobs")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  return NextResponse.json(jobs ?? []);
}
