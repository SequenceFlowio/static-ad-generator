import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const db = getServerSupabase();

  const { data } = await db.from("facebook_connections")
    .select("id, fb_account_id, fb_account_name, token_expires_at, created_at")
    .eq("brand_id", brandId)
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ connection: data ?? null });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const db = getServerSupabase();

  await db.from("facebook_connections").delete().eq("brand_id", brandId).eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
