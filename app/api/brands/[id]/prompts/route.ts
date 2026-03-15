import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { generatePrompts } from "@/lib/prompt-generator";

// POST /api/brands/[id]/prompts — Phase 2: generate prompts from Brand DNA
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { product_name } = await req.json();

  if (!product_name) {
    return NextResponse.json({ error: "product_name is required" }, { status: 400 });
  }

  const db = getServerSupabase();

  // Load brand + latest DNA
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
    return NextResponse.json(
      { error: "Brand DNA not found. Run Phase 1 (Research) first." },
      { status: 400 }
    );
  }

  try {
    const promptsJson = await generatePrompts(
      dnaRes.data.content,
      product_name,
      brandRes.data.name
    );

    const { data, error: insertErr } = await db
      .from("prompt_sets")
      .insert({
        brand_id: id,
        product_name,
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
