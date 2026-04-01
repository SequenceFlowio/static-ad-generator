import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getServerSupabase } from "@/lib/supabase";

// POST /api/stripe/portal — open Stripe customer portal (manage/cancel)
export async function POST(req: Request) {
  let user;
  try { user = await getAuthUser(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServerSupabase();
  const { data: sub } = await db
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
  }

  const origin = req.headers.get("origin") ?? "https://content.sequenceflow.io";

  const session = await getStripe().billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${origin}/`,
  });

  return NextResponse.json({ url: session.url });
}
