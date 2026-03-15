import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { researchBrand } from "@/lib/openai";
import type { BrandDnaData } from "@/types";

// POST /api/brands/[id]/research — Phase 1: auto-research and generate Brand DNA JSON
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getServerSupabase();

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
    const dnaData = await researchBrand(brand.name, brand.url);

    // Delete old DNA, insert fresh
    await db.from("brand_dna").delete().eq("brand_id", id);

    const { data: dna, error: insertErr } = await db
      .from("brand_dna")
      .insert({ brand_id: id, data: dnaData })
      .select()
      .single();

    if (insertErr) throw new Error(insertErr.message);

    return NextResponse.json({ brand_dna: dna });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/brands/[id]/research — save manually edited brand DNA fields
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as Partial<BrandDnaData>;

  const db = getServerSupabase();

  // Load existing DNA and merge
  const { data: existing } = await db
    .from("brand_dna")
    .select("*")
    .eq("brand_id", id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const merged: BrandDnaData = { ...(existing?.data ?? {}), ...body } as BrandDnaData;

  let result;
  if (existing) {
    const { data, error } = await db
      .from("brand_dna")
      .update({ data: merged, generated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    const { data, error } = await db
      .from("brand_dna")
      .insert({ brand_id: id, data: merged })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  }

  return NextResponse.json({ brand_dna: result });
}
