import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

// GET /api/brands/[id] — get brand with latest DNA + prompt set
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getServerSupabase();

  const [brandRes, dnaRes, promptRes] = await Promise.all([
    db.from("brands").select("*").eq("id", id).single(),
    db
      .from("brand_dna")
      .select("*")
      .eq("brand_id", id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("prompt_sets")
      .select("*")
      .eq("brand_id", id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (brandRes.error) {
    return NextResponse.json({ error: brandRes.error.message }, { status: 404 });
  }

  return NextResponse.json({
    brand: brandRes.data,
    brand_dna: dnaRes.data ?? null,
    prompt_set: promptRes.data ?? null,
  });
}

// DELETE /api/brands/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getServerSupabase();
  const { error } = await db.from("brands").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
