import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase";

// GET /api/stripe/subscription — returns the current user's plan + status
export async function GET() {
  let user;
  try { user = await getAuthUser(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServerSupabase();
  const { data } = await db
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", user.id)
    .single();

  if (!data) {
    return NextResponse.json({ plan: "free", status: "inactive", current_period_end: null });
  }

  return NextResponse.json(data);
}
