import { getServerSupabase } from "@/lib/supabase";

// Per-plan image limits
export const PLAN_QUALITY_LIMITS: Record<string, number> = {
  trial: 10,
  free: 10,
  starter: 150,
  pro: 350,
  agency: 999999,
};

export const PLAN_EFFICIENCY_LIMITS: Record<string, number> = {
  trial: 20,
  free: 20,
  starter: 250,
  pro: 600,
  agency: 999999,
};

// "Quality" = nano-banana-2, "Efficiency" = seedream-3
export const QUALITY_MODEL = "nano-banana-2";
export const EFFICIENCY_MODEL = "seedream/4.5-edit";

export function isQualityModel(model: string): boolean {
  return model === QUALITY_MODEL;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface UsageData {
  qualityUsed: number;
  qualityLimit: number;
  efficiencyUsed: number;
  efficiencyLimit: number;
  plan: string;
}

export async function getUsage(userId: string): Promise<UsageData> {
  const db = getServerSupabase();
  const month = currentMonth();

  const [{ data: sub }, { data: usage }] = await Promise.all([
    db.from("subscriptions").select("plan, status").eq("user_id", userId).single(),
    db.from("generation_usage").select("quality_used, efficiency_used").eq("user_id", userId).eq("month", month).single(),
  ]);

  const plan = sub?.status === "active" || sub?.status === "trialing" ? (sub?.plan ?? "trial") : "trial";

  return {
    qualityUsed: usage?.quality_used ?? 0,
    qualityLimit: PLAN_QUALITY_LIMITS[plan] ?? 10,
    efficiencyUsed: usage?.efficiency_used ?? 0,
    efficiencyLimit: PLAN_EFFICIENCY_LIMITS[plan] ?? 20,
    plan,
  };
}

export async function checkAndDeduct(
  userId: string,
  qualityImages: number,
  efficiencyImages: number
): Promise<{ ok: boolean; reason?: string } & UsageData> {
  const db = getServerSupabase();
  const month = currentMonth();
  const usage = await getUsage(userId);

  const isAgency = usage.plan === "agency";

  if (!isAgency) {
    if (qualityImages > 0 && usage.qualityUsed + qualityImages > usage.qualityLimit) {
      return { ok: false, reason: "quality", ...usage };
    }
    if (efficiencyImages > 0 && usage.efficiencyUsed + efficiencyImages > usage.efficiencyLimit) {
      return { ok: false, reason: "efficiency", ...usage };
    }
  }

  await db.from("generation_usage").upsert(
    {
      user_id: userId,
      month,
      quality_used: usage.qualityUsed + qualityImages,
      efficiency_used: usage.efficiencyUsed + efficiencyImages,
    },
    { onConflict: "user_id,month" }
  );

  return {
    ok: true,
    ...usage,
    qualityUsed: usage.qualityUsed + qualityImages,
    efficiencyUsed: usage.efficiencyUsed + efficiencyImages,
  };
}
