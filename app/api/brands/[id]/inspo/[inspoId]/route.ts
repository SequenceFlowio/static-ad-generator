import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// DELETE /api/brands/[id]/inspo/[inspoId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; inspoId: string }> }
) {
  const { inspoId } = await params;
  try { await getAuthUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const db = getServerSupabase();
  const { error } = await db
    .from("inspo_images")
    .delete()
    .eq("id", inspoId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
