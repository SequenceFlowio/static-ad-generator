import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { getCampaigns, getAdsets } from "@/lib/facebook";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const db = getServerSupabase();

  const { data: conn } = await db.from("facebook_connections")
    .select("access_token, fb_account_id")
    .eq("brand_id", brandId)
    .eq("user_id", user.id)
    .single();
  if (!conn) return NextResponse.json({ error: "Not connected" }, { status: 404 });

  try {
    const campaigns = await getCampaigns(conn.access_token, conn.fb_account_id);
    // Fetch adsets for each campaign in parallel
    const campaignsWithAdsets = await Promise.all(
      campaigns.map(async (c) => {
        const adsets = await getAdsets(conn.access_token, c.id).catch(() => []);
        return { ...c, adsets };
      })
    );
    return NextResponse.json({ campaigns: campaignsWithAdsets });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
