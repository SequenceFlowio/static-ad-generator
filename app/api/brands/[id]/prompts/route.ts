import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { generatePrompts } from "@/lib/prompt-generator";

// POST /api/brands/[id]/prompts — Phase 2: generate prompts from Brand DNA + product
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { product_id } = await req.json();

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
    return NextResponse.json({ error: "Brand DNA not found. Run Phase 1 first." }, { status: 400 });
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
      brandRes.data.name
    );

    const { data, error: insertErr } = await db
      .from("prompt_sets")
      .insert({
        brand_id: id,
        product_id,
        product_name: product.name,
        prompts_json: promptsJson,
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
