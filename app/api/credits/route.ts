import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUsage } from "@/lib/credits";

// GET /api/credits — return current user's generation usage
export async function GET() {
  let user;
  try { user = await getAuthUser(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { used, limit, plan } = await getUsage(user.id);
  return NextResponse.json({ used, limit, remaining: limit - used, plan });
}
