import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getServerSupabase } from "@/lib/supabase";
import Stripe from "stripe";

export const runtime = "nodejs";

// Maps Stripe price IDs → plan names
function planFromPriceId(priceId: string): string {
  const map: Record<string, string> = {};
  if (process.env.STRIPE_PRICE_STARTER) map[process.env.STRIPE_PRICE_STARTER] = "starter";
  if (process.env.STRIPE_PRICE_PRO) map[process.env.STRIPE_PRICE_PRO] = "pro";
  if (process.env.STRIPE_PRICE_AGENCY) map[process.env.STRIPE_PRICE_AGENCY] = "agency";
  return map[priceId] ?? "starter";
}

async function upsertSubscription(
  supabaseUserId: string,
  subscription: Stripe.Subscription,
  plan: string
) {
  const db = getServerSupabase();
  await db.from("subscriptions").upsert({
    user_id: supabaseUserId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    plan,
    status: subscription.status, // active | canceled | past_due | trialing etc.
    current_period_end: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
  }, { onConflict: "user_id" });
}

// POST /api/stripe/webhook — receives Stripe events
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const supabaseUserId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan ?? "starter";

        if (!supabaseUserId || !session.subscription) break;

        const subscription = await getStripe().subscriptions.retrieve(session.subscription as string);
        await upsertSubscription(supabaseUserId, subscription, plan);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const supabaseUserId = subscription.metadata?.supabase_user_id;
        if (!supabaseUserId) break;

        const priceId = subscription.items.data[0]?.price?.id;
        const plan = planFromPriceId(priceId);
        await upsertSubscription(supabaseUserId, subscription, plan);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const supabaseUserId = subscription.metadata?.supabase_user_id;
        if (!supabaseUserId) break;

        const db = getServerSupabase();
        await db.from("subscriptions").upsert({
          user_id: supabaseUserId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          plan: "free",
          status: "canceled",
          current_period_end: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
        }, { onConflict: "user_id" });
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
