import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { getAdAccounts } from "@/lib/facebook";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const db = getServerSupabase();

  const { data: conn } = await db.from("facebook_connections")
    .select("access_token").eq("brand_id", brandId).eq("user_id", user.id).single();
  if (!conn) return NextResponse.json({ error: "Not connected" }, { status: 404 });

  try {
    const accounts = await getAdAccounts(conn.access_token);
    return NextResponse.json({ accounts });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const { account_id, account_name } = await req.json() as { account_id: string; account_name: string };
  const db = getServerSupabase();

  const { error } = await db.from("facebook_connections")
    .update({ fb_account_id: account_id, fb_account_name: account_name, updated_at: new Date().toISOString() })
    .eq("brand_id", brandId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
