import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

// PATCH /api/brands/[id]/products/[productId] — update product fields
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

// DELETE /api/brands/[id]/products/[productId]
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
