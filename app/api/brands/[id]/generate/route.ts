import { getServerSupabase, uploadToStorage } from "@/lib/supabase";
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

  const { data: brand, error: brandErr } = await db
    .from("brands")
    .select("*")
    .eq("id", id)
    .single();

  if (brandErr || !brand) {
    return new Response(JSON.stringify({ error: "Brand not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

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
          const refImages =
            promptItem.needs_product_images && productImageUrls.length > 0
              ? productImageUrls
              : undefined;

          const kieImageUrls = await generateImages({
            prompt: promptItem.prompt,
            aspect_ratio: promptItem.aspect_ratio,
            resolution,
            num_images,
            reference_image_urls: refImages,
          });

          const storedUrls: string[] = [];
          const folderName = `${String(promptItem.template_number).padStart(2, "0")}-${promptItem.template_name}`;

          for (let i = 0; i < kieImageUrls.length; i++) {
            const imgRes = await fetch(kieImageUrls[i]);
            if (!imgRes.ok) continue;
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            const path = `${brand.slug}/${folderName}/v${i + 1}.png`;
            const url = await uploadToStorage("generated-ads", path, buffer, "image/png");
            storedUrls.push(url);
          }

          if (jobId) {
            await db
              .from("generation_jobs")
              .update({ status: "done", image_urls: storedUrls })
              .eq("id", jobId);
          }

          controller.enqueue(
            encodeEvent({
              type: "done",
              template_number: promptItem.template_number,
              template_name: promptItem.template_name,
              image_urls: storedUrls,
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
