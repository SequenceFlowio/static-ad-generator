import { getServerSupabase } from "@/lib/supabase";
import { generateImages } from "@/lib/kie";
import type { SseEvent, GenerateRequest, PromptItem } from "@/types";

export const maxDuration = 300;

// POST /api/brands/[id]/generate — Phase 3: generate ads via kie.ai, stream via SSE
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: GenerateRequest = await req.json();
  const { template_numbers, resolution, num_images = 4, prompt_set_id } = body;

  const db = getServerSupabase();

  const [{ data: brand, error: brandErr }, { data: brandDna }] = await Promise.all([
    db.from("brands").select("*").eq("id", id).single(),
    db.from("brand_dna").select("data").eq("brand_id", id)
      .order("generated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (brandErr || !brand) {
    return new Response(JSON.stringify({ error: "Brand not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const logoUrl: string | null = (brandDna?.data as { logo_url?: string | null })?.logo_url ?? null;

  const { data: promptSet, error: promptErr } = await db
    .from("prompt_sets")
    .select("*")
    .eq("id", prompt_set_id)
    .single();

  if (promptErr || !promptSet) {
    return new Response(JSON.stringify({ error: "Prompt set not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const allPrompts: PromptItem[] = promptSet.prompts_json.prompts ?? [];
  const selectedPrompts = template_numbers.length > 0
    ? allPrompts.filter((p) => template_numbers.includes(p.template_number))
    : allPrompts;

  // Get product reference image URLs from the linked product
  let productImageUrls: string[] = [];
  if (promptSet.product_id) {
    const { data: product } = await db
      .from("products")
      .select("image_urls")
      .eq("id", promptSet.product_id)
      .single();
    productImageUrls = (product?.image_urls as string[]) ?? [];
  }

  // Create generation job rows
  const { data: jobs } = await db
    .from("generation_jobs")
    .insert(
      selectedPrompts.map((p) => ({
        brand_id: id,
        prompt_set_id,
        template_number: p.template_number,
        template_name: p.template_name,
        resolution,
        num_images,
        status: "pending",
      }))
    )
    .select();

  const jobMap = new Map((jobs ?? []).map((j) => [j.template_number, j.id]));

  const encoder = new TextEncoder();
  function encodeEvent(event: SseEvent): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Send a keepalive comment every 20s to prevent nginx/proxy timeouts on Hostinger
      const keepalive = setInterval(() => {
        try { controller.enqueue(encoder.encode(": keepalive\n\n")); } catch { /* closed */ }
      }, 20_000);

      try {
      for (const promptItem of selectedPrompts) {
        const jobId = jobMap.get(promptItem.template_number);

        if (jobId) {
          await db.from("generation_jobs").update({ status: "running" }).eq("id", jobId);
        }

        controller.enqueue(
          encodeEvent({
            type: "start",
            template_number: promptItem.template_number,
            template_name: promptItem.template_name,
            job_id: jobId,
          })
        );

        try {
          // Build reference image list: logo first (always), then product images when needed
          const refImages: string[] = [];
          if (logoUrl) refImages.push(logoUrl);
          if (promptItem.needs_product_images && productImageUrls.length > 0) {
            refImages.push(...productImageUrls);
          }

          const kieImageUrls = await generateImages({
            prompt: promptItem.prompt,
            aspect_ratio: promptItem.aspect_ratio,
            resolution,
            num_images,
            reference_image_urls: refImages.length > 0 ? refImages : undefined,
          });

          // Store kie.ai CDN URLs directly — avoids download+re-upload latency on Hostinger
          if (jobId) {
            await db
              .from("generation_jobs")
              .update({ status: "done", image_urls: kieImageUrls })
              .eq("id", jobId);
          }

          controller.enqueue(
            encodeEvent({
              type: "done",
              template_number: promptItem.template_number,
              template_name: promptItem.template_name,
              image_urls: kieImageUrls,
              job_id: jobId,
            })
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (jobId) {
            await db
              .from("generation_jobs")
              .update({ status: "failed", error: message })
              .eq("id", jobId);
          }
          controller.enqueue(
            encodeEvent({
              type: "error",
              template_number: promptItem.template_number,
              template_name: promptItem.template_name,
              error: message,
              job_id: jobId,
            })
          );
        }
      }

      controller.enqueue(encodeEvent({ type: "complete" }));
      controller.close();
      } finally {
        clearInterval(keepalive);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx proxy buffering so SSE events flush immediately
    },
  });
}
