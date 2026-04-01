import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStripe, getPlanPrices, type PlanId } from "@/lib/stripe";

// POST /api/stripe/checkout — create a Stripe Checkout session
export async function POST(req: Request) {
  let user;
  try { user = await getAuthUser(); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json() as { plan: PlanId };
  const priceId = getPlanPrices()[plan];

  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? "https://content.sequenceflow.io";
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id, // Supabase user ID — used in webhook to link
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/?checkout=cancelled`,
    metadata: { supabase_user_id: user.id, plan },
    subscription_data: {
      metadata: { supabase_user_id: user.id, plan },
    },
  });

  return NextResponse.json({ url: session.url });
}
