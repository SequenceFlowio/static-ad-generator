import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import type { ContentPlan, GenerateSlot } from "@/types";

export const maxDuration = 300;

// Days of week for 4-posts/week pattern: Mon(1), Wed(3), Fri(5), Sun(0)
const DEFAULT_POSTING_DAYS = [1, 3, 5, 0];

/**
 * Rule-based calendar engine.
 * Distributes content types across N weeks of posting slots respecting:
 *   - percentage targets
 *   - min_pct minimums
 *   - max_consecutive limits
 */
function buildSchedule(plan: ContentPlan, weeks: number): Array<{ date: Date; content_type_key: string }> {
  const autoTypes = plan.content_types.filter(t => t.auto_enabled);
  if (autoTypes.length === 0) return [];

  const postsPerWeek = Math.min(plan.weekly_posts, DEFAULT_POSTING_DAYS.length);
  const totalSlots = weeks * postsPerWeek;

  // Calculate target counts per type based on percentage
  const targets: Record<string, number> = {};
  const mins: Record<string, number> = {};
  let totalPct = autoTypes.reduce((s, t) => s + t.percentage, 0);
  if (totalPct === 0) totalPct = 100;

  for (const t of autoTypes) {
    targets[t.key] = Math.round((t.percentage / totalPct) * totalSlots);
    mins[t.key] = Math.ceil((t.min_pct / 100) * totalSlots);
  }

  // Ensure minimums are met — add to total if needed
  for (const t of autoTypes) {
    if ((targets[t.key] ?? 0) < (mins[t.key] ?? 0)) {
      targets[t.key] = mins[t.key] ?? 0;
    }
  }

  // Build remaining counts
  const remaining: Record<string, number> = { ...targets };

  // Generate posting dates
  const dates: Date[] = [];
  const now = new Date();
  // Start from next Monday
  const startDate = new Date(now);
  const dayOfWeek = startDate.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  startDate.setDate(startDate.getDate() + daysUntilMonday);
  startDate.setHours(0, 0, 0, 0);

  for (let week = 0; week < weeks; week++) {
    for (const dayIdx of DEFAULT_POSTING_DAYS.slice(0, postsPerWeek)) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + week * 7 + (dayIdx === 0 ? 6 : dayIdx - 1));
      dates.push(date);
    }
  }

  dates.sort((a, b) => a.getTime() - b.getTime());

  // Assign content types to dates using greedy algorithm
  const schedule: Array<{ date: Date; content_type_key: string }> = [];
  const maxConsec: Record<string, number> = {};
  for (const t of autoTypes) maxConsec[t.key] = t.max_consecutive;

  let lastType = "";
  let consecCount = 0;

  for (const date of dates) {
    // Pick best candidate: most remaining, respects max_consecutive
    const candidates = autoTypes
      .filter(t => (remaining[t.key] ?? 0) > 0)
      .filter(t => !(t.key === lastType && consecCount >= (maxConsec[t.key] ?? 999)));

    if (candidates.length === 0) break;

    // Sort by remaining count desc
    candidates.sort((a, b) => (remaining[b.key] ?? 0) - (remaining[a.key] ?? 0));
    const chosen = candidates[0];

    schedule.push({ date, content_type_key: chosen.key });
    remaining[chosen.key] = (remaining[chosen.key] ?? 0) - 1;

    if (chosen.key === lastType) {
      consecCount++;
    } else {
      lastType = chosen.key;
      consecCount = 1;
    }
  }

  return schedule;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: brandId } = await params;
    const db = getServerSupabase();

    const body = await req.json() as { weeks?: number; platform?: string; require_approval?: boolean };
    const weeks = Math.min(Math.max(body.weeks ?? 1, 1), 4);

    // Load content plan
    const { data: planRow } = await db.from("content_plan")
      .select("*").eq("brand_id", brandId).maybeSingle();

    if (!planRow) {
      return NextResponse.json({ error: "Content plan not configured. Set up your content types first." }, { status: 404 });
    }

    const plan = planRow as ContentPlan;

    // Check which dates already have posts to avoid duplicates
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + weeks * 7 + 7);

    const { data: existingPosts } = await db.from("social_posts")
      .select("scheduled_at")
      .eq("brand_id", brandId)
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", endDate.toISOString())
      .in("status", ["draft", "approved", "scheduled", "published"]);

    const existingDates = new Set(
      (existingPosts ?? [])
        .map(p => p.scheduled_at?.split("T")[0])
        .filter(Boolean) as string[]
    );

    // Build schedule and filter out dates with existing posts
    const schedule = buildSchedule(plan, weeks);
    const newSlots: GenerateSlot[] = schedule
      .filter(s => !existingDates.has(s.date.toISOString().split("T")[0]))
      .map(s => ({
        content_type_key: s.content_type_key,
        scheduled_date: s.date.toISOString().split("T")[0],
      }));

    if (newSlots.length === 0) {
      return NextResponse.json({ created: 0, posts: [], message: "All posting slots already have content planned." });
    }

    // Delegate to generate endpoint
    const origin = req.headers.get("origin") ?? `https://${req.headers.get("host")}`;
    const generateRes = await fetch(`${origin}/api/brands/${brandId}/social/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({
        slots: newSlots,
        platform: body.platform,
        require_approval: body.require_approval,
      }),
    });

    const result = await generateRes.json() as { created: number; posts: unknown[]; errors?: string[] };
    return NextResponse.json({ created: result.created, posts: result.posts, errors: result.errors, slots_planned: newSlots.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Schedule generation failed";
    console.error("[generate-schedule]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
