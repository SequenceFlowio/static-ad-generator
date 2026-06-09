import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// PATCH — update a post (caption, scheduled_at, platforms, status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId, postId } = await params;
  const body = await req.json();
  const db = getServerSupabase();

  const updates: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() };
  // Auto-set status from scheduled_at only if status is not explicitly provided
  if ("scheduled_at" in body && !("status" in body)) {
    updates.status = body.scheduled_at ? "scheduled" : "draft";
  }

  const { data, error } = await db
    .from("social_posts")
    .update(updates)
    .eq("id", postId)
    .eq("brand_id", brandId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — remove a post
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId, postId } = await params;
  const db = getServerSupabase();

  const { error } = await db
    .from("social_posts")
    .delete()
    .eq("id", postId)
    .eq("brand_id", brandId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
