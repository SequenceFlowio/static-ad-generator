import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import type { ContentPlan, GenerateSlot } from "@/types";

export const maxDuration = 300;

// Matches the posting days pattern — Mon(1), Wed(3), Fri(5), Sun(0)
const POSTING_DAYS = new Set([0, 1, 3, 5]);

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServerSupabase();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const todayDayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Only generate on posting days
  if (!POSTING_DAYS.has(todayDayOfWeek)) {
    return NextResponse.json({ ok: true, message: `Not a posting day (day ${todayDayOfWeek})`, generated: 0 });
  }

  // Get all brands with auto-poster enabled
  const { data: settings } = await db.from("social_settings")
    .select("brand_id, platforms, post_time, require_approval")
    .eq("enabled", true);

  if (!settings?.length) {
    return NextResponse.json({ ok: true, message: "No brands with auto-poster enabled", generated: 0 });
  }

  let totalGenerated = 0;
  const errors: string[] = [];

  for (const setting of settings) {
    try {
      const brandId = setting.brand_id as string;

      // Skip if a post already exists for today
      const { data: existing } = await db.from("social_posts")
        .select("id")
        .eq("brand_id", brandId)
        .gte("scheduled_at", `${todayStr}T00:00:00Z`)
        .lte("scheduled_at", `${todayStr}T23:59:59Z`)
        .in("status", ["draft", "approved", "scheduled", "published"])
        .limit(1);

      if (existing?.length) continue;

      // Load content plan
      const { data: planRow } = await db.from("content_plan")
        .select("*").eq("brand_id", brandId).maybeSingle();

      if (!planRow) continue;

      const plan = planRow as ContentPlan;
      const autoTypes = plan.content_types.filter(t => t.auto_enabled);
      if (autoTypes.length === 0) continue;

      // Pick content type for today: least recently used auto type
      const { data: recentPosts } = await db.from("social_posts")
        .select("content_type_key, created_at")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false })
        .limit(20);

      // Count recent usage per type
      const recentCount: Record<string, number> = {};
      for (const p of recentPosts ?? []) {
        if (p.content_type_key) {
          recentCount[p.content_type_key] = (recentCount[p.content_type_key] ?? 0) + 1;
        }
      }

      // Pick the auto type with fewest recent posts relative to its percentage
      const scored = autoTypes.map(t => ({
        key: t.key,
        score: (recentCount[t.key] ?? 0) / (t.percentage / 100),
      }));
      scored.sort((a, b) => a.score - b.score);
      const chosenType = scored[0].key;

      const platform = (setting.platforms as string[])?.[0] ?? "instagram";
      const requireApproval = (setting.require_approval as boolean) ?? true;

      const slot: GenerateSlot = {
        content_type_key: chosenType,
        scheduled_date: todayStr,
      };

      // If not require_approval, also set scheduled_at based on post_time
      const scheduledAt = requireApproval
        ? null
        : `${todayStr}T${(setting.post_time as string) ?? "09:00"}:00Z`;

      // Directly generate (inline to avoid HTTP call within cron)
      const origin = req.headers.get("origin") ?? `https://${req.headers.get("host") ?? ""}`;
      const res = await fetch(`${origin}/api/brands/${brandId}/social/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cron-secret": process.env.CRON_SECRET ?? "" },
        body: JSON.stringify({ slots: [{ ...slot, scheduled_at_override: scheduledAt }], platform, require_approval: requireApproval }),
      });

      if (res.ok) {
        const d = await res.json() as { created: number };
        totalGenerated += d.created ?? 0;
      } else {
        errors.push(`brand ${brandId}: HTTP ${res.status}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`brand ${setting.brand_id}: ${msg}`);
    }
  }

  console.log(`[content-generate cron] generated=${totalGenerated} errors=${errors.length}`);
  return NextResponse.json({ ok: true, generated: totalGenerated, errors });
}
