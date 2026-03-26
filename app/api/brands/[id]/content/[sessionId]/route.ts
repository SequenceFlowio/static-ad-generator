import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// PATCH /api/brands/[id]/content/[sessionId] — update caption or image_prompt
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { sessionId } = await params;
  try { await getAuthUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const body = await req.json();
  const updates: Record<string, string> = {};
  if (body.caption !== undefined) updates.caption = body.caption;
  if (body.image_prompt !== undefined) updates.image_prompt = body.image_prompt;

  const db = getServerSupabase();
  const { data, error } = await db
    .from("content_sessions")
    .update(updates)
    .eq("id", sessionId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/brands/[id]/content/[sessionId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { sessionId } = await params;
  try { await getAuthUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const db = getServerSupabase();
  const { error } = await db
    .from("content_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
