import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

const FB_BASE = "https://graph.facebook.com/v21.0";

// GET — verify the stored ig_user_id and token scopes
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
    .select("access_token, ig_user_id, page_id")
    .eq("brand_id", brandId)
    .single();
  if (!conn) return NextResponse.json({ error: "Not connected" }, { status: 400 });

  const result: Record<string, unknown> = {};

  // Check token scopes
  const scopesRes = await fetch(`${FB_BASE}/me/permissions?access_token=${conn.access_token}`);
  const scopesData = await scopesRes.json();
  const granted = (scopesData.data ?? [])
    .filter((p: { permission: string; status: string }) => p.status === "granted")
    .map((p: { permission: string }) => p.permission);
  result.granted_scopes = granted;
  result.has_instagram_publish = granted.includes("instagram_content_publish");

  // Verify ig_user_id
  if (conn.ig_user_id) {
    const igRes = await fetch(
      `${FB_BASE}/${conn.ig_user_id}?fields=id,name,username,account_type&access_token=${conn.access_token}`
    );
    const igData = await igRes.json();
    result.ig_account = igData.error ? { error: igData.error.message } : igData;
  }

  // Re-fetch ig_user_id from page to compare
  if (conn.page_id) {
    const pageRes = await fetch(
      `${FB_BASE}/${conn.page_id}?fields=instagram_business_account&access_token=${conn.access_token}`
    );
    const pageData = await pageRes.json();
    result.ig_from_page = pageData.instagram_business_account ?? null;
  }

  return NextResponse.json(result);
}
