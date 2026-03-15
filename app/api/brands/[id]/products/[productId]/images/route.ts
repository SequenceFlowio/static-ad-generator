import { NextResponse } from "next/server";
import { getServerSupabase, uploadToStorage } from "@/lib/supabase";

// POST /api/brands/[id]/products/[productId]/images — upload product images
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  const { id, productId } = await params;
  const db = getServerSupabase();

  const { data: brand } = await db.from("brands").select("slug").eq("id", id).single();
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const { data: product } = await db.from("products").select("image_urls").eq("id", productId).single();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });

  const existingUrls: string[] = (product.image_urls as string[]) ?? [];
  const newUrls: string[] = [];

  for (const file of files.slice(0, 14)) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${brand.slug}/products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToStorage("product-images", path, buffer, file.type);
    newUrls.push(url);
  }

  const allUrls = [...existingUrls, ...newUrls];
  await db.from("products").update({ image_urls: allUrls }).eq("id", productId);

  return NextResponse.json({ urls: allUrls });
}

// DELETE /api/brands/[id]/products/[productId]/images — clear all product images
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const db = getServerSupabase();
  await db.from("products").update({ image_urls: [] }).eq("id", productId);
  return new NextResponse(null, { status: 204 });
}
