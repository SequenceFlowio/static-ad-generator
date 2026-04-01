import { getServerSupabase } from "@/lib/supabase";

export const PLAN_GENERATION_LIMITS: Record<string, number> = {
  trial: 50,
  free: 50,
  starter: 500,
  pro: 2000,
  agency: 999999,
};

// Cost per image generation
export const MODEL_COST: Record<string, number> = {
  "nano-banana-2": 2,  // Quality
  "seedream-3": 1,     // Efficiency
};

export function generationCost(model: string, count: number): number {
  return (MODEL_COST[model] ?? 1) * count;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getUsage(userId: string): Promise<{ used: number; limit: number; plan: string }> {
  const db = getServerSupabase();
  const month = currentMonth();

  const [{ data: sub }, { data: usage }] = await Promise.all([
    db.from("subscriptions").select("plan, status").eq("user_id", userId).single(),
    db.from("generation_usage").select("used").eq("user_id", userId).eq("month", month).single(),
  ]);

  const plan = sub?.status === "active" || sub?.status === "trialing" ? (sub?.plan ?? "trial") : "trial";
  const limit = PLAN_GENERATION_LIMITS[plan] ?? 50;
  const used = usage?.used ?? 0;

  return { used, limit, plan };
}

export async function checkAndDeduct(userId: string, cost: number): Promise<{ ok: boolean; used: number; limit: number }> {
  const db = getServerSupabase();
  const month = currentMonth();
  const { used, limit, plan } = await getUsage(userId);

  if (plan !== "agency" && used + cost > limit) {
    return { ok: false, used, limit };
  }

  // Upsert: increment used count
  await db.from("generation_usage").upsert(
    { user_id: userId, month, used: used + cost },
    { onConflict: "user_id,month" }
  );

  return { ok: true, used: used + cost, limit };
}
