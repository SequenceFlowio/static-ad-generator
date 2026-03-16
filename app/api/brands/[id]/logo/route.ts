import { NextResponse } from "next/server";
import { getServerSupabase, uploadToStorage } from "@/lib/supabase";

// POST /api/brands/[id]/logo — upload brand logo, store URL in brand_dna.data.logo_url
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getServerSupabase();

  const { data: brand, error: brandErr } = await db
    .from("brands")
    .select("slug")
    .eq("id", id)
    .single();

  if (brandErr || !brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const contentType = file.type || "image/png";
  const buffer = Buffer.from(await file.arrayBuffer());

  const path = `brand-assets/${brand.slug}/logo.${ext}`;
  const url = await uploadToStorage("generated-ads", path, buffer, contentType);

  // Patch logo_url into brand_dna.data
  const { data: existing } = await db
    .from("brand_dna")
    .select("*")
    .eq("brand_id", id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await db
      .from("brand_dna")
      .update({ data: { ...existing.data, logo_url: url } })
      .eq("id", existing.id);
  }

  return NextResponse.json({ url });
}

// DELETE /api/brands/[id]/logo — clear logo_url from brand_dna.data
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getServerSupabase();

  const { data: existing } = await db
    .from("brand_dna")
    .select("*")
    .eq("brand_id", id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await db
      .from("brand_dna")
      .update({ data: { ...existing.data, logo_url: null } })
      .eq("id", existing.id);
  }

  return NextResponse.json({ ok: true });
}
