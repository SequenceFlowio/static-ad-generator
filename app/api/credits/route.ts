import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUsage } from "@/lib/credits";

// GET /api/credits
export async function GET() {
  let user;
  try { user = await getAuthUser(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { totalUsed, totalLimit, plan } = await getUsage(user.id);
  return NextResponse.json({ used: totalUsed, limit: totalLimit, remaining: totalLimit - totalUsed, plan });
}
