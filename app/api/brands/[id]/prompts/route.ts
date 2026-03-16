import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { generatePrompts } from "@/lib/prompt-generator";

// POST — generate all prompts for a product
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { product_id, num_variants = 2, hook_intent = null, background_intent = null } = await req.json();

  if (!product_id) {
    return NextResponse.json({ error: "product_id is required" }, { status: 400 });
  }

  const db = getServerSupabase();

  const [brandRes, dnaRes, productRes] = await Promise.all([
    db.from("brands").select("*").eq("id", id).single(),
    db
      .from("brand_dna")
      .select("*")
      .eq("brand_id", id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("products").select("*").eq("id", product_id).single(),
  ]);

  if (brandRes.error || !brandRes.data) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }
  if (!dnaRes.data) {
    return NextResponse.json({ error: "Brand DNA not found. Complete Phase 1 first." }, { status: 400 });
  }
  if (productRes.error || !productRes.data) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const product = productRes.data;

  try {
    const promptsJson = await generatePrompts(
      dnaRes.data.data,
      product.name,
      product.description,
      brandRes.data.name,
      num_variants,
      hook_intent,
      background_intent
    );

    // Store prompts_original alongside prompts so user can reset edits
    const dataToStore = {
      ...promptsJson,
      prompts_original: promptsJson.prompts,
    };

    const { data, error: insertErr } = await db
      .from("prompt_sets")
      .insert({
        brand_id: id,
        product_id,
        product_name: product.name,
        prompts_json: dataToStore,
      })
      .select()
      .single();

    if (insertErr) throw new Error(insertErr.message);

    return NextResponse.json({ prompt_set: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH — save edited prompt texts
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  const { prompt_set_id, prompts } = await req.json();

  if (!prompt_set_id || !Array.isArray(prompts)) {
    return NextResponse.json({ error: "prompt_set_id and prompts array required" }, { status: 400 });
  }

  const db = getServerSupabase();

  const { data: existing } = await db
    .from("prompt_sets")
    .select("*")
    .eq("id", prompt_set_id)
    .single();

  if (!existing) return NextResponse.json({ error: "Prompt set not found" }, { status: 404 });

  const updated = {
    ...existing.prompts_json,
    prompts,
  };

  const { data, error } = await db
    .from("prompt_sets")
    .update({ prompts_json: updated })
    .eq("id", prompt_set_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prompt_set: data });
}
