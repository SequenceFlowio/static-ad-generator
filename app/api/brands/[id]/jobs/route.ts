import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

// GET /api/brands/[id]/jobs — list generation jobs, optionally filtered by ?prompt_set_id=
// Also lazily deletes any generation_jobs older than 48 hours.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const promptSetId = searchParams.get("prompt_set_id");

  const db = getServerSupabase();

  // Lazy cleanup: delete generation_jobs older than 48h (fire-and-forget)
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  db.from("generation_jobs").delete().lt("created_at", cutoff).then(() => {/* no-op */});

  let query = db
    .from("generation_jobs")
    .select("*")
    .eq("brand_id", id)
    .order("created_at", { ascending: false });

  if (promptSetId) query = query.eq("prompt_set_id", promptSetId);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
