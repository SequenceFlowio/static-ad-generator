import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUsage } from "@/lib/credits";

// GET /api/credits — return current user's generation usage per model type
export async function GET() {
  let user;
  try { user = await getAuthUser(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usage = await getUsage(user.id);
  return NextResponse.json({
    plan: usage.plan,
    quality: { used: usage.qualityUsed, limit: usage.qualityLimit, remaining: usage.qualityLimit - usage.qualityUsed },
    efficiency: { used: usage.efficiencyUsed, limit: usage.efficiencyLimit, remaining: usage.efficiencyLimit - usage.efficiencyUsed },
  });
}
