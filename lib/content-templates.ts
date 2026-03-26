export interface ContentTemplate {
  name: string;
  label: string;
  description: string;
  needs_product: boolean;   // If true, show product picker
  product_optional: boolean; // If true, product enhances but isn't required
  icon: string;             // Emoji icon for UI
}

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    name: "tips-tricks",
    label: "Tips & Tricks",
    description: "Educational post with 3 actionable tips related to the brand niche.",
    needs_product: false,
    product_optional: false,
    icon: "💡",
  },
  {
    name: "about-brand",
    label: "About the Brand",
    description: "Brand story, values, or mission — humanise the brand.",
    needs_product: false,
    product_optional: false,
    icon: "✨",
  },
  {
    name: "about-product",
    label: "About a Product",
    description: "Product spotlight — what it is and why it matters.",
    needs_product: true,
    product_optional: false,
    icon: "🎯",
  },
  {
    name: "using-product",
    label: "Using a Product",
    description: "How-to or in-use moment — show the product in action.",
    needs_product: true,
    product_optional: false,
    icon: "🤝",
  },
  {
    name: "testimonial",
    label: "Testimonial",
    description: "Customer quote card — social proof in a clean visual.",
    needs_product: false,
    product_optional: false,
    icon: "⭐",
  },
  {
    name: "lifestyle",
    label: "Lifestyle",
    description: "Brand or product placed naturally in an aspirational scene.",
    needs_product: false,
    product_optional: true,
    icon: "🌿",
  },
  {
    name: "before-after",
    label: "Before & After",
    description: "Transformation story — before state (pain) vs after state (result).",
    needs_product: false,
    product_optional: true,
    icon: "🔄",
  },
  {
    name: "behind-scenes",
    label: "Behind the Scenes",
    description: "Brand authenticity — team, process, sourcing, or craftsmanship.",
    needs_product: false,
    product_optional: false,
    icon: "🎬",
  },
  {
    name: "seasonal-trend",
    label: "Seasonal / Trend",
    description: "Tie the brand to a moment, season, or cultural trend.",
    needs_product: false,
    product_optional: true,
    icon: "📅",
  },
];

export const PLATFORMS = [
  { value: "instagram", label: "Instagram", aspectRatio: "4:5" },
  { value: "facebook", label: "Facebook", aspectRatio: "1:1" },
  { value: "linkedin", label: "LinkedIn", aspectRatio: "1:1" },
  { value: "pinterest", label: "Pinterest", aspectRatio: "2:3" },
] as const;

export type Platform = (typeof PLATFORMS)[number]["value"];

export function getPlatformAspectRatio(platform: Platform): string {
  return PLATFORMS.find((p) => p.value === platform)?.aspectRatio ?? "1:1";
}
