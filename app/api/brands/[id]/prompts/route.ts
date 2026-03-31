import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { generatePrompts } from "@/lib/prompt-generator";

// POST — generate all prompts for a product
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const {
    product_id: singleProductId,
    product_ids: multiProductIds,
    num_variants = 2,
    hook_intent = null,
    background_intent = null,
    template_numbers = [],
    awareness_level = "problem-aware",
    selected_desire = null,
  } = body;

  // Support both single product_id (legacy) and product_ids array
  const productIdList: string[] = multiProductIds?.length
    ? multiProductIds
    : singleProductId
    ? [singleProductId]
    : [];

  if (productIdList.length === 0) {
    return NextResponse.json({ error: "product_id or product_ids is required" }, { status: 400 });
  }

  const primaryProductId = productIdList[0];

  const db = getServerSupabase();

  const [brandRes, dnaRes] = await Promise.all([
    db.from("brands").select("*").eq("id", id).single(),
    db
      .from("brand_dna")
      .select("*")
      .eq("brand_id", id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (brandRes.error || !brandRes.data) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }
  if (!dnaRes.data) {
    return NextResponse.json({ error: "Brand DNA not found. Complete Phase 1 first." }, { status: 400 });
  }

  // Load all selected products
  const { data: productsData, error: productsErr } = await db
    .from("products")
    .select("*")
    .in("id", productIdList);

  if (productsErr || !productsData || productsData.length === 0) {
    return NextResponse.json({ error: "Products not found" }, { status: 404 });
  }

  // Combine product names + descriptions for multi-product prompt
  const primaryProduct = productsData.find((p) => p.id === primaryProductId) ?? productsData[0];
  const combinedProductName = productsData.map((p) => p.name).join(", ");
  const combinedProductDescription = productsData
    .map((p) => `${p.name}: ${p.description ?? ""}`)
    .filter((s) => s.trim().length > 1)
    .join("\n\n");

  try {
    const promptsJson = await generatePrompts(
      dnaRes.data.data,
      combinedProductName,
      combinedProductDescription || primaryProduct.description,
      brandRes.data.name,
      num_variants,
      hook_intent,
      background_intent,
      template_numbers,
      awareness_level,
      selected_desire
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
        product_id: primaryProductId,
        product_name: combinedProductName,
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
