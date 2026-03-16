import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  const { productId } = await params;
  const db = getServerSupabase();

  const [productRes, promptRes] = await Promise.all([
    db.from("products").select("*").eq("id", productId).single(),
    db
      .from("prompt_sets")
      .select("*")
      .eq("product_id", productId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (productRes.error || !productRes.data) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({
    product: productRes.data,
    prompt_set: promptRes.data ?? null,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  const { productId } = await params;
  const body = await req.json();
  const db = getServerSupabase();

  const { data, error } = await db
    .from("products")
    .update(body)
    .eq("id", productId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  const { productId } = await params;
  const db = getServerSupabase();
  const { error } = await db.from("products").delete().eq("id", productId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
