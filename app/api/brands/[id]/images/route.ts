import { NextResponse } from "next/server";
import { getServerSupabase, uploadToStorage, listStorageFiles } from "@/lib/supabase";

// POST /api/brands/[id]/images — upload product reference images
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
  const files = formData.getAll("files") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const urls: string[] = [];

  for (const file of files.slice(0, 14)) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${brand.slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToStorage("product-images", path, buffer, file.type);
    urls.push(url);
  }

  return NextResponse.json({ urls });
}

// GET /api/brands/[id]/images — list uploaded product images
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getServerSupabase();

  const { data: brand } = await db
    .from("brands")
    .select("slug")
    .eq("id", id)
    .single();

  if (!brand) return NextResponse.json({ urls: [] });

  const urls = await listStorageFiles("product-images", brand.slug);
  return NextResponse.json({ urls });
}

// DELETE /api/brands/[id]/images — remove all product images for this brand
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getServerSupabase();

  const { data: brand } = await db
    .from("brands")
    .select("slug")
    .eq("id", id)
    .single();

  if (!brand) return new NextResponse(null, { status: 204 });

  const { data: files } = await db.storage
    .from("product-images")
    .list(brand.slug);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${brand.slug}/${f.name}`);
    await db.storage.from("product-images").remove(paths);
  }

  return new NextResponse(null, { status: 204 });
}
