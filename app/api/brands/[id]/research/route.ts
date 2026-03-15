import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { researchBrand } from "@/lib/openai";

// POST /api/brands/[id]/research — Phase 1: research brand and generate Brand DNA
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getServerSupabase();

  // Load brand
  const { data: brand, error: brandErr } = await db
    .from("brands")
    .select("*")
    .eq("id", id)
    .single();

  if (brandErr || !brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  if (!brand.url) {
    return NextResponse.json({ error: "Brand URL is required for research" }, { status: 400 });
  }

  try {
    const dnaContent = await researchBrand(brand.name, brand.url);

    // Delete old DNA for this brand (keep only latest)
    await db.from("brand_dna").delete().eq("brand_id", id);

    // Insert new DNA
    const { data: dna, error: insertErr } = await db
      .from("brand_dna")
      .insert({ brand_id: id, content: dnaContent })
      .select()
      .single();

    if (insertErr) throw new Error(insertErr.message);

    return NextResponse.json({ brand_dna: dna });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/brands/[id]/research — save manually edited brand DNA
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const db = getServerSupabase();
  const { data, error } = await db
    .from("brand_dna")
    .update({ content, generated_at: new Date().toISOString() })
    .eq("brand_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brand_dna: data });
}
