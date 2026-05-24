import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const datePreset = req.nextUrl.searchParams.get("date_preset") ?? "last_7d";
  const db = getServerSupabase();

  // Map date preset to days
  const days = datePreset === "last_30d" ? 30 : datePreset === "last_14d" ? 14 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: insights } = await db.from("facebook_ad_insights")
    .select("*")
    .eq("brand_id", brandId)
    .gte("date_start", since)
    .order("spend", { ascending: false });

  const rows = insights ?? [];

  const totals = {
    total_spend: rows.reduce((s, r) => s + Number(r.spend), 0),
    total_reach: rows.reduce((s, r) => s + Number(r.reach), 0),
    total_impressions: rows.reduce((s, r) => s + Number(r.impressions), 0),
    total_purchases: rows.reduce((s, r) => s + Number(r.purchases), 0),
    total_purchase_value: rows.reduce((s, r) => s + Number(r.purchase_value), 0),
    avg_roas: rows.length > 0
      ? rows.reduce((s, r) => s + Number(r.purchase_roas), 0) / rows.length
      : 0,
    avg_frequency: rows.length > 0
      ? rows.reduce((s, r) => s + Number(r.frequency), 0) / rows.length
      : 0,
    avg_cpp: rows.length > 0
      ? rows.reduce((s, r) => s + Number(r.cpp), 0) / rows.length
      : 0,
  };

  return NextResponse.json({ insights: rows, totals });
}
