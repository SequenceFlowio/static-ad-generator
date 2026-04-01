import Stripe from "stripe";

// Lazy singleton — only instantiated when first called, not at module load
// This prevents build-time failures when STRIPE_SECRET_KEY is not set locally
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

export type PlanId = "starter" | "pro" | "agency";

export function getPlanPrices(): Record<PlanId, string> {
  return {
    starter: process.env.STRIPE_PRICE_STARTER!,
    pro: process.env.STRIPE_PRICE_PRO!,
    agency: process.env.STRIPE_PRICE_AGENCY!,
  };
}

export const PLAN_STORE_LIMITS: Record<string, number> = {
  trial: 1,
  free: 1,
  starter: 1,
  pro: 3,
  agency: 999,
};
