import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// GET — fetch single session
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId, sessionId } = await params;
  const db = getServerSupabase();

  const { data: session } = await db.from("video_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("brand_id", brandId)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  return NextResponse.json({ session });
}

// PATCH — update session fields (pinned, phase, scenes)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId, sessionId } = await params;
  const body = await req.json() as { pinned?: boolean; phase?: string; scenes?: unknown[] };
  const db = getServerSupabase();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.pinned !== undefined) updates.is_pinned = body.pinned;
  if (body.phase !== undefined) updates.phase = body.phase;
  if (body.scenes !== undefined) updates.scenes = body.scenes;

  const { error } = await db.from("video_sessions")
    .update(updates)
    .eq("id", sessionId)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
