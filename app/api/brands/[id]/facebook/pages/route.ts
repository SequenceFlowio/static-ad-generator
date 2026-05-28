import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { getInstagramUserId } from "@/lib/facebook";

const FB_BASE = "https://graph.facebook.com/v21.0";

// GET — list all Facebook Pages visible to the stored token
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const db = getServerSupabase();

  const { data: conn } = await db
    .from("facebook_connections")
    .select("access_token")
    .eq("brand_id", brandId)
    .single();
  if (!conn) return NextResponse.json({ error: "Not connected" }, { status: 400 });

  const res = await fetch(`${FB_BASE}/me/accounts?fields=id,name,category&access_token=${conn.access_token}`);
  const data = await res.json();

  return NextResponse.json({ pages: data.data ?? [], raw: data });
}

// PATCH — manually set page_id for this connection
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const { page_id, page_name, ig_user_id: igUserIdOverride } = await req.json() as { page_id: string; page_name?: string; ig_user_id?: string };

  const db = getServerSupabase();

  const { data: conn } = await db
    .from("facebook_connections")
    .select("access_token")
    .eq("brand_id", brandId)
    .single();
  if (!conn) return NextResponse.json({ error: "Not connected" }, { status: 400 });

  // Use provided ig_user_id if given, otherwise try to fetch from page
  const igUserId = igUserIdOverride ?? await getInstagramUserId(conn.access_token, page_id).catch(() => null);

  await db.from("facebook_connections").update({
    page_id,
    page_name: page_name ?? null,
    ig_user_id: igUserId,
    updated_at: new Date().toISOString(),
  }).eq("brand_id", brandId);

  return NextResponse.json({ ok: true, ig_user_id: igUserId });
}
