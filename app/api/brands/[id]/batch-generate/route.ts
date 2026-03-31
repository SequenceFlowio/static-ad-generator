import { NextResponse } from "next/server";
import { getServerSupabase, uploadToStorage } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateImages } from "@/lib/kie";
import { generateBatchCampaign } from "@/lib/batch-campaign-generator";
import type { BrandDnaData } from "@/types";

export const maxDuration = 300;

// POST /api/brands/[id]/batch-generate — AI campaign planner + bulk image generation (SSE)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try { await getAuthUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const body = await req.json() as {
    product_ids: string[];
    template_names: string[];
    batch_size: 10 | 20 | 50;
    resolution: string;
    inspo_image_urls?: string[];
  };

  const { product_ids, template_names, batch_size, resolution, inspo_image_urls } = body;

  if (!product_ids?.length || !template_names?.length || !batch_size) {
    return NextResponse.json({ error: "product_ids, template_names, and batch_size are required" }, { status: 400 });
  }

  const db = getServerSupabase();

  // Load brand + DNA + products in parallel
  const [{ data: brand }, { data: brandDnaRow }, { data: productsData }] = await Promise.all([
    db.from("brands").select("slug, name").eq("id", id).single(),
    db.from("brand_dna").select("data").eq("brand_id", id).order("generated_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("products").select("id, name, description, image_urls").in("id", product_ids),
  ]);

  if (!brandDnaRow?.data) {
    return NextResponse.json({ error: "Brand DNA not found" }, { status: 400 });
  }

  const brandDna = brandDnaRow.data as BrandDnaData;
  const logoUrl: string | null = brandDna.logo_url ?? null;
  const brandSlug = brand?.slug ?? id;

  const products = (productsData ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    description: p.description as string | null,
    image_urls: (p.image_urls as string[]) ?? [],
  }));

  // Build product image map: product_id → first 2 image URLs
  const productImageMap: Record<string, string[]> = {};
  for (const p of products) {
    productImageMap[p.id] = p.image_urls.slice(0, 2);
  }

  // SSE response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        // Step 1: AI campaign planner
        send({ type: "status", message: "Planning campaign..." });
        const concepts = await generateBatchCampaign({
          brandDna,
          products: products.map((p) => ({ id: p.id, name: p.name, description: p.description })),
          templateNames: template_names,
          batchSize: batch_size,
        });

        const total = concepts.length;
        let done = 0;

        // Step 2: Generate images in chunks of 5 to avoid rate limits
        const CHUNK_SIZE = 5;
        for (let i = 0; i < concepts.length; i += CHUNK_SIZE) {
          const chunk = concepts.slice(i, i + CHUNK_SIZE);

          await Promise.all(chunk.map(async (concept) => {
            try {
              // Build reference images
              const refImages: string[] = [];
              const isUgc = concept.template_name === "ugc-lifestyle";
              if (logoUrl && !isUgc) refImages.push(logoUrl);
              const productImages = productImageMap[concept.product_id] ?? [];
              refImages.push(...productImages);
              if (inspo_image_urls?.length) refImages.push(...inspo_image_urls.slice(0, 2));

              const prompt = `${concept.background_prompt}\n\nText in the ad: ${concept.hook_text}`;

              const urls = await generateImages({
                prompt,
                aspect_ratio: "4:5",
                resolution,
                num_images: 1,
                reference_image_urls: refImages.length > 0 ? refImages : undefined,
                model: "nano-banana-2",
              });

              if (urls && urls.length > 0) {
                // Upload to Supabase Storage
                const imageRes = await fetch(urls[0]);
                const buffer = Buffer.from(await imageRes.arrayBuffer());
                const storagePath = `${brandSlug}/batch/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
                const publicUrl = await uploadToStorage("generated-ads", storagePath, buffer, "image/png");

                // Save as generation_job row
                await db.from("generation_jobs").insert({
                  brand_id: id,
                  prompt_set_id: null,
                  template_number: null,
                  template_name: concept.template_name,
                  resolution,
                  num_images: 1,
                  status: "done",
                  image_urls: [publicUrl],
                  generation_detail: {
                    model: "nano-banana-2",
                    background_prompt: concept.background_prompt,
                    hook_variants: [concept.hook_text],
                    angle_description: concept.angle_description,
                    batch: true,
                  },
                });
              }
            } catch (err) {
              console.error("Batch concept generation error:", err);
            }

            done++;
            send({ type: "progress", done, total });
          }));
        }

        send({ type: "complete", done, total });
      } catch (err) {
        send({ type: "error", error: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
