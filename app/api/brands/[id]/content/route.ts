import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateContentPost } from "@/lib/content-prompt-generator";
import { checkAndDeduct } from "@/lib/credits";

import type { Platform } from "@/lib/content-templates";

// GET /api/brands/[id]/content — list all content sessions for brand
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try { await getAuthUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const db = getServerSupabase();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Lazy cleanup: delete sessions older than 7 days
  db.from("content_sessions").delete().eq("brand_id", id).lt("created_at", cutoff).then(() => {/* no-op */});

  const { data, error } = await db
    .from("content_sessions")
    .select("id, template_name, platform, caption, image_url, image_prompt, created_at, product_id")
    .eq("brand_id", id)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/brands/[id]/content — create session + call the text-generation LLM
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let user;
  try { user = await getAuthUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  // Content generation counts as 1 efficiency image
  const { ok } = await checkAndDeduct(user.id, 0, 1);
  if (!ok) {
    return NextResponse.json({ error: "Not enough generations remaining. Upgrade your plan.", code: "INSUFFICIENT_CREDITS" }, { status: 402 });
  }

  const body = await req.json();
  const { template_name, platform, product_id, topic_hint, selected_desire, variation_index, total_count } = body as {
    template_name: string;
    platform: Platform;
    product_id?: string | null;
    topic_hint?: string | null;
    selected_desire?: string | null;
    variation_index?: number;
    total_count?: number;
  };

  if (!template_name || !platform) {
    return NextResponse.json({ error: "template_name and platform are required" }, { status: 400 });
  }

  const db = getServerSupabase();

  // Load brand DNA
  const { data: dnaRow } = await db
    .from("brand_dna")
    .select("data")
    .eq("brand_id", id)
    .single();

  if (!dnaRow?.data) {
    return NextResponse.json({ error: "Brand DNA not found. Complete Brand DNA first." }, { status: 400 });
  }

  // Load product if provided
  let productName: string | null = null;
  let productDescription: string | null = null;
  if (product_id) {
    const { data: product } = await db
      .from("products")
      .select("name, description")
      .eq("id", product_id)
      .single();
    productName = product?.name ?? null;
    productDescription = product?.description ?? null;
  }

  // Generate image prompt + caption via the shared LLM wrapper
  const result = await generateContentPost({
    brandDna: dnaRow.data,
    templateName: template_name,
    platform,
    productName,
    productDescription,
    topicHint: topic_hint,
    selectedDesire: selected_desire,
    variationIndex: variation_index,
    totalCount: total_count,
  });

  // Save session as draft
  const { data: session, error } = await db
    .from("content_sessions")
    .insert({
      brand_id: id,
      product_id: product_id ?? null,
      template_name,
      platform,
      topic_hint: topic_hint ?? null,
      selected_desire: selected_desire ?? null,
      image_prompt: result.image_prompt,
      caption: result.caption,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(session, { status: 201 });
}
