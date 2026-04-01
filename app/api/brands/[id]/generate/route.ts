import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateImages } from "@/lib/kie";
import { checkAndDeduct, generationCost } from "@/lib/credits";
import type { GenerateRequest, PromptItem, KieModel } from "@/types";

export const maxDuration = 300;

// Background processor — runs after response is sent, updates job rows in DB
async function runGeneration(
  jobs: Array<{ id: string; template_number: number }>,
  prompts: PromptItem[],
  logoUrl: string | null,
  productImageUrls: string[],
  resolution: string,
  model: KieModel,
  aspectRatioOverride?: string,
  inspoImageUrls?: string[]
) {
  const db = getServerSupabase();
  for (const promptItem of prompts) {
    const job = jobs.find((j) => j.template_number === promptItem.template_number);
    if (!job) continue;
    try {
      await db.from("generation_jobs").update({ status: "running" }).eq("id", job.id);

      const refImages: string[] = [];
      const isUgc = promptItem.template_name === "ugc-lifestyle";
      if (logoUrl && !isUgc) refImages.push(logoUrl);
      if (promptItem.needs_product_images && productImageUrls.length > 0) {
        refImages.push(...productImageUrls);
      }
      if (inspoImageUrls?.length) refImages.push(...inspoImageUrls.slice(0, 2));

      const aspectRatio = aspectRatioOverride ?? promptItem.aspect_ratio;

      // Generate all hook variants in parallel — each fires a separate kie.ai task simultaneously
      const variantResults = await Promise.all(
        promptItem.hook_variants.map(async (hookVariant) => {
          try {
            const combinedPrompt = `${promptItem.background_prompt}\n\nText in the ad: ${hookVariant}`;
            return await generateImages({
              prompt: combinedPrompt,
              aspect_ratio: aspectRatio,
              resolution,
              num_images: 1,
              reference_image_urls: refImages.length > 0 ? refImages : undefined,
              model,
            });
          } catch {
            return []; // one failed variant doesn't kill the whole job
          }
        })
      );
      const allUrls = variantResults.flat();

      await db
        .from("generation_jobs")
        .update({ status: "done", image_urls: allUrls })
        .eq("id", job.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .from("generation_jobs")
        .update({ status: "failed", error: message })
        .eq("id", job.id);
    }
  }
}

// POST /api/brands/[id]/generate
// Creates job rows immediately, starts generation in background, returns job IDs.
// Client polls /api/brands/[id]/jobs?prompt_set_id=... to track progress.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let user;
  try { user = await getAuthUser(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: GenerateRequest = await req.json();
  const { template_numbers, resolution, prompt_set_id, model = "nano-banana-2", aspect_ratio, inspo_image_urls, product_ids: multiProductIds } = body as GenerateRequest & { inspo_image_urls?: string[]; product_ids?: string[] };

  const db = getServerSupabase();

  const [{ data: brand, error: brandErr }, { data: brandDna }] = await Promise.all([
    db.from("brands").select("*").eq("id", id).single(),
    db.from("brand_dna").select("data").eq("brand_id", id)
      .order("generated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (brandErr || !brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const logoUrl: string | null = (brandDna?.data as { logo_url?: string | null })?.logo_url ?? null;

  const { data: promptSet, error: promptErr } = await db
    .from("prompt_sets")
    .select("*")
    .eq("id", prompt_set_id)
    .single();

  if (promptErr || !promptSet) {
    return NextResponse.json({ error: "Prompt set not found" }, { status: 404 });
  }

  const allPrompts: PromptItem[] = promptSet.prompts_json.prompts ?? [];
  const selectedPrompts = template_numbers.length > 0
    ? allPrompts.filter((p) => template_numbers.includes(p.template_number))
    : allPrompts;

  // Load product images — support multi-product (first 2 images each, max 6 total)
  const productImageUrls: string[] = [];
  const productIdsToLoad = multiProductIds?.length
    ? multiProductIds
    : promptSet.product_id
    ? [promptSet.product_id]
    : [];

  if (productIdsToLoad.length > 0) {
    const { data: productsData } = await db
      .from("products")
      .select("image_urls")
      .in("id", productIdsToLoad);
    if (productsData) {
      for (const p of productsData) {
        const urls = (p.image_urls as string[]) ?? [];
        productImageUrls.push(...urls.slice(0, 2)); // max 2 per product
      }
    }
  }

  // Check + deduct generations (num templates × variants per template × model cost)
  const totalImages = selectedPrompts.reduce((sum, p) => sum + p.hook_variants.length, 0);
  const cost = generationCost(model, totalImages);
  const { ok } = await checkAndDeduct(user.id, cost);
  if (!ok) {
    return NextResponse.json({ error: "Not enough generations remaining. Upgrade your plan.", code: "INSUFFICIENT_CREDITS" }, { status: 402 });
  }

  // Create all job rows as "pending" upfront
  const { data: jobs, error: jobErr } = await db
    .from("generation_jobs")
    .insert(
      selectedPrompts.map((p) => ({
        brand_id: id,
        prompt_set_id,
        template_number: p.template_number,
        template_name: p.template_name,
        resolution,
        num_images: p.hook_variants.length,
        status: "pending",
        generation_detail: {
          model,
          background_prompt: p.background_prompt,
          hook_variants: p.hook_variants,
        },
      }))
    )
    .select();

  if (jobErr || !jobs) {
    return NextResponse.json({ error: "Failed to create jobs" }, { status: 500 });
  }

  // Fire off generation in the background — response returns immediately
  runGeneration(jobs, selectedPrompts, logoUrl, productImageUrls, resolution, model, aspect_ratio, inspo_image_urls).catch(
    (err) => console.error("runGeneration error:", err)
  );

  return NextResponse.json({ job_ids: jobs.map((j) => j.id), prompt_set_id });
}
