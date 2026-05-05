import { NextResponse } from "next/server";
import { getServerSupabase, uploadToStorage } from "@/lib/supabase";

// POST /api/brands/[id]/products/[productId]/images — upload product images
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  const { id: brandId, productId } = await params;
  const db = getServerSupabase();

  const { data: product } = await db.from("products").select("image_urls").eq("id", productId).single();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const formData = await req.formData();
  // Accept both single "file" and multiple "files"
  const files = [
    ...formData.getAll("files") as File[],
    ...formData.getAll("file") as File[],
  ].filter(f => f instanceof File && f.size > 0);

  if (!files.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });

  const MAX_IMAGES = 6;
  const existingUrls: string[] = (product.image_urls as string[]) ?? [];
  const slotsRemaining = Math.max(0, MAX_IMAGES - existingUrls.length);
  const filesToUpload = files.slice(0, slotsRemaining);

  if (!filesToUpload.length) {
    return NextResponse.json({ error: "Maximum 6 images reached" }, { status: 400 });
  }

  const newUrls: string[] = [];
  for (const file of filesToUpload) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `brands/${brandId}/products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToStorage("product-images", path, buffer, file.type);
    newUrls.push(url);
  }

  const allUrls = [...existingUrls, ...newUrls];
  await db.from("products").update({ image_urls: allUrls }).eq("id", productId);

  return NextResponse.json({ image_urls: allUrls });
}

// DELETE /api/brands/[id]/products/[productId]/images — remove one or all images
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const db = getServerSupabase();

  let urlToRemove: string | undefined;
  try {
    const body = await req.json() as { url?: string };
    urlToRemove = body.url;
  } catch {
    // No body — clear all
  }

  const { data: product } = await db.from("products").select("image_urls").eq("id", productId).single();
  const existing = (product?.image_urls as string[]) ?? [];

  const updated = urlToRemove
    ? existing.filter(u => u !== urlToRemove)
    : [];

  await db.from("products").update({ image_urls: updated }).eq("id", productId);
  return NextResponse.json({ image_urls: updated });
}
