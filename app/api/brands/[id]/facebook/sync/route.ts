import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { syncAdInsights, getAdStatus, getAdCreativeImageUrl } from "@/lib/facebook";
import { generateText } from "@/lib/llm";

export const maxDuration = 300;

type Recommendation = "kill" | "wait" | "scale" | "vary";

async function getAiRecommendation(ad: {
  ad_name: string;
  spend: number;
  roas: number;
  frequency: number;
  reach: number;
  cpp: number;
  purchases: number;
  status: string;
}): Promise<{ recommendation: Recommendation; reason: string }> {
  if (ad.status !== "ACTIVE") return { recommendation: "wait", reason: "Ad is not active." };
  if (ad.spend < 10) return { recommendation: "wait", reason: "Te weinig data (< €10 uitgegeven)." };
  if (ad.roas === 0 && ad.spend > 50) return { recommendation: "kill", reason: "Geen aankopen bij > €50 uitgegeven." };
  if (ad.frequency > 5) return { recommendation: "vary", reason: "Hoge frequency — maak een variatie om ad fatigue te vermijden." };

  try {
    const text = await generateText({
      messages: [
        {
          role: "system",
          content: "Je bent een Facebook Ads expert. Analyseer de onderstaande ad metrics en geef een korte aanbeveling (max 2 zinnen). Eindig altijd met exact één van deze woorden: kill, wait, scale, vary.",
        },
        {
          role: "user",
          content: `Ad: ${ad.ad_name}\nSpend: €${ad.spend}\nROAS: ${ad.roas}x\nFrequency: ${ad.frequency}\nReach: ${ad.reach}\nCPP: €${ad.cpp}\nAankopen: ${ad.purchases}\n\nGeef je aanbeveling:`,
        },
      ],
      temperature: 0.3,
    });

    const lower = text.toLowerCase();
    let rec: Recommendation = "wait";
    if (lower.includes("kill")) rec = "kill";
    else if (lower.includes("scale")) rec = "scale";
    else if (lower.includes("vary") || lower.includes("variatie")) rec = "vary";

    const reason = text.replace(/\b(kill|wait|scale|vary)\b\.?$/i, "").trim();
    return { recommendation: rec, reason: reason || text };
  } catch {
    return { recommendation: "wait", reason: "Analyse niet beschikbaar." };
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const { date_preset = "last_7d" } = await req.json() as { date_preset?: "last_7d" | "last_14d" | "last_30d" };
  const db = getServerSupabase();

  const { data: conn } = await db.from("facebook_connections")
    .select("access_token, fb_account_id")
    .eq("brand_id", brandId)
    .eq("user_id", user.id)
    .single();
  if (!conn) return NextResponse.json({ error: "Not connected" }, { status: 404 });

  let rawInsights;
  try {
    rawInsights = await syncAdInsights(conn.access_token, conn.fb_account_id, date_preset);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Sync failed" }, { status: 500 });
  }

  const rows = [];
  for (const insight of rawInsights) {
    const spend = parseFloat(insight.spend ?? "0");
    const reach = parseInt(insight.reach ?? "0", 10);
    const frequency = parseFloat(insight.frequency ?? "0");
    const clicks = parseInt(insight.clicks ?? "0", 10);
    const cpp = parseFloat(insight.cpp ?? "0");
    const impressions = parseInt(insight.impressions ?? "0", 10);

    const roasEntry = insight.purchase_roas?.find(e => e.action_type === "omni_purchase");
    const roas = roasEntry ? parseFloat(roasEntry.value) : 0;

    const purchasesEntry = insight.actions?.find(e => e.action_type === "omni_purchase");
    const purchases = purchasesEntry ? parseInt(purchasesEntry.value, 10) : 0;

    const valueEntry = insight.action_values?.find(e => e.action_type === "omni_purchase");
    const purchaseValue = valueEntry ? parseFloat(valueEntry.value) : 0;

    const [adStatus, creativeImageUrl, aiResult] = await Promise.all([
      getAdStatus(conn.access_token, insight.ad_id).catch(() => "UNKNOWN"),
      getAdCreativeImageUrl(conn.access_token, insight.ad_id).catch(() => null),
      getAiRecommendation({ ad_name: insight.ad_name, spend, roas, frequency, reach, cpp, purchases, status: "ACTIVE" }),
    ]);

    rows.push({
      brand_id: brandId,
      fb_ad_id: insight.ad_id,
      fb_campaign_id: insight.campaign_id,
      fb_adset_id: insight.adset_id,
      ad_name: insight.ad_name,
      campaign_name: insight.campaign_name,
      adset_name: insight.adset_name,
      ad_status: adStatus,
      creative_image_url: creativeImageUrl,
      date_start: insight.date_start,
      date_stop: insight.date_stop,
      spend,
      impressions,
      reach,
      frequency,
      clicks,
      purchase_roas: roas,
      purchase_value: purchaseValue,
      purchases,
      cpp,
      ai_recommendation: aiResult.recommendation,
      ai_reason: aiResult.reason,
      synced_at: new Date().toISOString(),
    });
  }

  if (rows.length > 0) {
    await db.from("facebook_ad_insights").upsert(rows, {
      onConflict: "brand_id,fb_ad_id,date_start,date_stop",
    });
  }

  return NextResponse.json({ synced: rows.length, last_synced_at: new Date().toISOString() });
}
