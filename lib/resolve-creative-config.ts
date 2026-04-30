// Shared logic for both Ads and Content generation quick mode.
// Maps user-facing goals → generation config without touching any API or prompt logic.

export type AdGoal = "test-creatives" | "drive-conversions" | "retargeting" | "ugc-style";
export type ContentGoal = "brand-awareness" | "product-showcase" | "education" | "social-proof" | "ugc-feel";

export interface AdCreativeConfig {
  templateNumbers: number[];
  awarenessLevel: string;
  toneDirection: string;
}

export interface ContentCreativeConfig {
  templateName: string;
  toneDirection: string;
}

export const AD_GOALS: { value: AdGoal; label: string; description: string; icon: string }[] = [
  {
    value: "test-creatives",
    label: "Test creatives",
    description: "Explore multiple angles for A/B testing",
    icon: "⚡",
  },
  {
    value: "drive-conversions",
    label: "Drive conversions",
    description: "Direct response ads focused on the sale",
    icon: "🎯",
  },
  {
    value: "retargeting",
    label: "Retargeting",
    description: "Re-engage warm audiences with proof and offers",
    icon: "🔁",
  },
  {
    value: "ugc-style",
    label: "UGC style",
    description: "Authentic lifestyle content that feels organic",
    icon: "📱",
  },
];

export const CONTENT_GOALS: { value: ContentGoal; label: string; description: string; icon: string }[] = [
  {
    value: "brand-awareness",
    label: "Brand awareness",
    description: "Brand story, values, or mission",
    icon: "✨",
  },
  {
    value: "product-showcase",
    label: "Product spotlight",
    description: "Feature a product and its key benefits",
    icon: "🎯",
  },
  {
    value: "education",
    label: "Education",
    description: "Tips, how-tos, and practical value",
    icon: "💡",
  },
  {
    value: "social-proof",
    label: "Social proof",
    description: "Testimonials and real results",
    icon: "⭐",
  },
  {
    value: "ugc-feel",
    label: "UGC feel",
    description: "Real usage — authentic and casual",
    icon: "📸",
  },
];

const AD_GOAL_CONFIGS: Record<AdGoal, AdCreativeConfig> = {
  "test-creatives": {
    templateNumbers: [1, 5],
    awarenessLevel: "problem-aware",
    toneDirection: "Curiosity-led. Multiple angles. Optimise for scroll-stop, not conversion.",
  },
  "drive-conversions": {
    templateNumbers: [2, 4],
    awarenessLevel: "most-aware",
    toneDirection: "Direct, offer-forward. Urgency and specificity. Conversion-optimised copy.",
  },
  "retargeting": {
    templateNumbers: [3, 4],
    awarenessLevel: "product-aware",
    toneDirection: "Social proof and results. Address objections. Build final conviction.",
  },
  "ugc-style": {
    templateNumbers: [5],
    awarenessLevel: "unaware",
    toneDirection: "Authentic, casual. No hard sell. Pattern interrupt with lifestyle hook.",
  },
};

const CONTENT_GOAL_CONFIGS: Record<ContentGoal, ContentCreativeConfig> = {
  "brand-awareness": {
    templateName: "about-brand",
    toneDirection: "Aspirational and identity-focused. Build emotional connection.",
  },
  "product-showcase": {
    templateName: "about-product",
    toneDirection: "Feature and benefit-driven. Clean and direct.",
  },
  "education": {
    templateName: "tips-tricks",
    toneDirection: "Educational and practical. Value-first.",
  },
  "social-proof": {
    templateName: "testimonial",
    toneDirection: "Trust-building. Specific results and transformation.",
  },
  "ugc-feel": {
    templateName: "using-product",
    toneDirection: "Authentic and casual. Real usage, real context.",
  },
};

export function resolveAdConfig(goal: AdGoal): AdCreativeConfig {
  return AD_GOAL_CONFIGS[goal] ?? AD_GOAL_CONFIGS["test-creatives"];
}

export function resolveContentConfig(goal: ContentGoal): ContentCreativeConfig {
  return CONTENT_GOAL_CONFIGS[goal] ?? CONTENT_GOAL_CONFIGS["brand-awareness"];
}
