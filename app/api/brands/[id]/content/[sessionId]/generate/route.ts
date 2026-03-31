import { NextResponse } from "next/server";
import { getServerSupabase, uploadToStorage } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateImages } from "@/lib/kie";
import { getPlatformAspectRatio } from "@/lib/content-templates";
import type { Platform } from "@/lib/content-templates";

export const maxDuration = 300;

// POST /api/brands/[id]/content/[sessionId]/generate — trigger kie.ai image generation
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id, sessionId } = await params;
  try { await getAuthUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const body = await req.json();
  const { inspo_image_urls } = body as { inspo_image_urls?: string[] };

  const db = getServerSupabase();

  // Load session
  const { data: session, error: sessionErr } = await db
    .from("content_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.image_prompt) {
    return NextResponse.json({ error: "No image_prompt on session" }, { status: 400 });
  }

  // Load brand for slug (used in storage path)
  const { data: brand } = await db
    .from("brands")
    .select("slug")
    .eq("id", id)
    .single();

  // Load logo for reference
  const { data: dnaRow } = await db
    .from("brand_dna")
    .select("data")
    .eq("brand_id", id)
    .single();
  const logoUrl: string | null = dnaRow?.data?.logo_url ?? null;

  // Mark as generating
  await db
    .from("content_sessions")
    .update({ status: "generating" })
    .eq("id", sessionId);

  try {
    const aspect_ratio = getPlatformAspectRatio(session.platform as Platform);

    // Build reference images: logo + product images + inspo
    const referenceUrls: string[] = [];
    if (logoUrl) referenceUrls.push(logoUrl);

    // Load product images if session has a product
    if (session.product_id) {
      const { data: product } = await db
        .from("products")
        .select("image_urls")
        .eq("id", session.product_id)
        .single();
      const productUrls = (product?.image_urls as string[]) ?? [];
      referenceUrls.push(...productUrls.slice(0, 4));
    }

    // Add inspo images (max 2)
    if (inspo_image_urls?.length) {
      referenceUrls.push(...inspo_image_urls.slice(0, 2));
    }

    const urls = await generateImages({
      prompt: session.image_prompt,
      aspect_ratio,
      resolution: "2K",
      num_images: 1,
      reference_image_urls: referenceUrls.length > 0 ? referenceUrls : undefined,
      model: "nano-banana-2",
    });

    if (!urls || urls.length === 0) throw new Error("No image URLs returned from kie.ai");

    // Upload to Supabase Storage
    const imageRes = await fetch(urls[0]);
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const storagePath = `${brand?.slug ?? id}/content/${sessionId}-${Date.now()}.png`;
    const publicUrl = await uploadToStorage("generated-ads", storagePath, buffer, "image/png");

    await db
      .from("content_sessions")
      .update({ status: "done", image_url: publicUrl })
      .eq("id", sessionId);

    return NextResponse.json({ image_url: publicUrl });
  } catch (err) {
    await db
      .from("content_sessions")
      .update({ status: "failed" })
      .eq("id", sessionId);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
