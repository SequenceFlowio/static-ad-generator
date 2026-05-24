import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { uploadImageToFacebook, createAdCreative, createAd } from "@/lib/facebook";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const body = await req.json() as {
    image_url: string;
    campaign_id: string;
    adset_id: string;
    ad_name: string;
    message?: string;
    link?: string;
  };

  const db = getServerSupabase();

  const { data: conn } = await db.from("facebook_connections")
    .select("access_token, fb_account_id")
    .eq("brand_id", brandId)
    .eq("user_id", user.id)
    .single();
  if (!conn) return NextResponse.json({ error: "Not connected" }, { status: 404 });

  try {
    const { image_hash } = await uploadImageToFacebook(
      conn.access_token,
      conn.fb_account_id,
      body.image_url
    );

    const creative = await createAdCreative(
      conn.access_token,
      conn.fb_account_id,
      image_hash,
      body.ad_name,
      body.message ?? "",
      body.link ?? "https://example.com"
    );

    const ad = await createAd(
      conn.access_token,
      conn.fb_account_id,
      body.adset_id,
      creative.id,
      body.ad_name
    );

    return NextResponse.json({ fb_ad_id: ad.id, status: "PAUSED" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Publish failed" }, { status: 500 });
  }
}
