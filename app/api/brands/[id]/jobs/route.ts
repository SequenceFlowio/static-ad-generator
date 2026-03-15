import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

// GET /api/brands/[id]/jobs — list all generation jobs for a brand
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getServerSupabase();

  const { data, error } = await db
    .from("generation_jobs")
    .select("*")
    .eq("brand_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
