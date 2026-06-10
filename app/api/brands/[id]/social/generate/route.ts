import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, uploadToStorage } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateContentPost } from "@/lib/content-prompt-generator";
import { generateImages } from "@/lib/kie";
import type { BrandDnaData, ContentPlan, ContentTopic, GenerateSlot, SocialPost, ContentGoal } from "@/types";
import type { Platform } from "@/lib/content-templates";

export const maxDuration = 300;

const STAGGER_MS = 2000;

const MONTH_SEASON: Record<number, string> = {
  0: "January — winter, cosy indoor living, new year energy",
  1: "February — late winter, Valentine's Day, warmth and romance",
  2: "March — early spring, refreshing, renewal",
  3: "April — spring in full bloom, bright and airy",
  4: "May — late spring, outdoor living begins",
  5: "June — early summer, outdoor dining, long evenings",
  6: "July — peak summer, warm tones, al fresco",
  7: "August — late summer, golden hour, harvest energy",
  8: "September — early autumn, warm spice tones, back to routine",
  9: "October — mid autumn, earthy and cosy",
  10: "November — late autumn, rich deep tones, indoor warmth",
  11: "December — winter, Christmas hosting, festive warmth",
};

function weightedRandom(weights: Record<string, number>): string | null {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

async function generateOnePost(
  slot: GenerateSlot,
  brandId: string,
  userId: string,
  plan: ContentPlan,
  brandDna: BrandDnaData,
  products: Array<{ id: string; name: string; description: string | null; image_urls: string[] }>,
  brandSlug: string,
  platform: Platform,
  requireApproval: boolean,
): Promise<SocialPost | null> {
  const db = getServerSupabase();

  const typeConfig = plan.content_types.find(t => t.key === slot.content_type_key);
  if (!typeConfig) return null;

  // 1. Pick topic — least recently used first
  const { data: topicsData } = await db.from("content_topics")
    .select("*")
    .eq("brand_id", brandId)
    .eq("content_type_key", slot.content_type_key)
    .order("last_used_at", { ascending: true, nullsFirst: true })
    .limit(1);

  const chosenTopic = (topicsData?.[0] ?? null) as ContentTopic | null;
  const topicHint = chosenTopic?.topic ?? null;

  // 2. Pick product — weighted random or explicit
  let productId = slot.product_id ?? null;
  if (!productId && Object.keys(plan.product_weights).length > 0) {
    productId = weightedRandom(plan.product_weights);
  }
  const product = products.find(p => p.id === productId) ?? null;

  // 3. Seasonal context
  const month = new Date().getMonth();
  const seasonalContext = MONTH_SEASON[month] ?? null;

  // 4. Generate copy + image prompt
  const result = await generateContentPost({
    brandDna,
    templateName: typeConfig.template_key,
    platform,
    productName: product?.name ?? null,
    productDescription: product?.description ?? null,
    topicHint,
    contentGoal: typeConfig.goal as ContentGoal,
    seasonalContext,
  });

  // 5. Generate image
  const imageUrls = await generateImages({
    prompt: result.image_prompt,
    aspect_ratio: platform === "instagram" ? "4:5" : "1:1",
    resolution: "2K",
    num_images: 1,
    model: "nano-banana-2",
    reference_image_urls: product?.image_urls?.length ? [product.image_urls[0]] : undefined,
  });

  if (!imageUrls?.length) throw new Error("No image returned from kie.ai");

  // 6. Upload image to Supabase Storage
  const imageRes = await fetch(imageUrls[0]);
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const storagePath = `${brandSlug}/social/${slot.content_type_key}-${Date.now()}.png`;
  const publicUrl = await uploadToStorage("generated-ads", storagePath, buffer, "image/png");

  // 7. Create social_posts record
  const scheduledAt = requireApproval ? null : `${slot.scheduled_date}T09:00:00Z`;
  const status = requireApproval ? "draft" : "approved";

  const { data: post, error } = await db.from("social_posts").insert({
    brand_id: brandId,
    user_id: userId,
    platforms: [platform],
    media_type: "image",
    image_urls: [publicUrl],
    caption: result.caption,
    scheduled_at: scheduledAt,
    status,
    source: "generated",
    content_type_key: slot.content_type_key,
    topic_id: chosenTopic?.id ?? null,
    topic_used: topicHint,
  }).select().single();

  if (error) throw new Error(error.message);

  // 8. Update topic rotation stats
  if (chosenTopic) {
    await db.from("content_topics").update({
      last_used_at: new Date().toISOString(),
      usage_count: (chosenTopic.usage_count ?? 0) + 1,
    }).eq("id", chosenTopic.id);
  }

  return post as SocialPost;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: brandId } = await params;
    const db = getServerSupabase();

    const body = await req.json() as {
      slots: GenerateSlot[];
      platform?: Platform;
      require_approval?: boolean;
    };

    if (!body.slots?.length) {
      return NextResponse.json({ error: "slots required" }, { status: 400 });
    }

    // Load brand data
    const [{ data: brand }, { data: dnaRow }, { data: planRow }, { data: productsData }, { data: settingsRow }] = await Promise.all([
      db.from("brands").select("id, slug").eq("id", brandId).single(),
      db.from("brand_dna").select("data").eq("brand_id", brandId).order("generated_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("content_plan").select("*").eq("brand_id", brandId).maybeSingle(),
      db.from("products").select("id, name, description, image_urls").eq("brand_id", brandId),
      db.from("social_settings").select("*").eq("brand_id", brandId).maybeSingle(),
    ]);

    if (!dnaRow?.data) return NextResponse.json({ error: "Brand DNA not found" }, { status: 404 });

    const brandDna = dnaRow.data as BrandDnaData;
    const plan = planRow as ContentPlan | null;
    const products = (productsData ?? []) as Array<{ id: string; name: string; description: string | null; image_urls: string[] }>;
    const platform: Platform = (body.platform ?? settingsRow?.platforms?.[0] ?? "instagram") as Platform;
    const requireApproval = body.require_approval ?? settingsRow?.require_approval ?? true;
    const brandSlug = (brand as { slug: string } | null)?.slug ?? brandId;

    if (!plan) return NextResponse.json({ error: "Content plan not configured" }, { status: 404 });

    const created: SocialPost[] = [];
    const errors: string[] = [];

    // Generate all slots in parallel with stagger to avoid rate limits
    await Promise.all(body.slots.map(async (slot, i) => {
      if (i > 0) await new Promise(r => setTimeout(r, i * STAGGER_MS));
      try {
        const post = await generateOnePost(slot, brandId, user.id, plan, brandDna, products, brandSlug, platform, requireApproval);
        if (post) created.push(post);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[generate] slot ${slot.content_type_key} ${slot.scheduled_date}:`, msg);
        errors.push(`${slot.content_type_key} (${slot.scheduled_date}): ${msg}`);
      }
    }));

    return NextResponse.json({ created: created.length, posts: created, errors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generation failed";
    console.error("[generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
