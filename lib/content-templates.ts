export interface ContentTemplate {
  name: string;
  label: string;
  description: string;
  needs_product: boolean;
  product_optional: boolean;
  icon: string;
  thumb: string;
}

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    name: "tips-tricks",
    label: "Tips & Tricks",
    description: "Educational post with 3 actionable tips related to the brand niche.",
    needs_product: false,
    product_optional: false,
    icon: "💡",
    thumb: "/template thumbnails/content/tips_tricks.jpg",
  },
  {
    name: "about-brand",
    label: "About the Brand",
    description: "Brand story, values, or mission — humanise the brand.",
    needs_product: false,
    product_optional: false,
    icon: "✨",
    thumb: "/template thumbnails/content/about_the_brand.jpg",
  },
  {
    name: "about-product",
    label: "About a Product",
    description: "Product spotlight — what it is and why it matters.",
    needs_product: true,
    product_optional: false,
    icon: "🎯",
    thumb: "/template thumbnails/content/about_a_product.jpg",
  },
  {
    name: "using-product",
    label: "Using a Product",
    description: "How-to or in-use moment — show the product in action.",
    needs_product: true,
    product_optional: false,
    icon: "🤝",
    thumb: "/template thumbnails/content/using_product.jpg",
  },
  {
    name: "testimonial",
    label: "Testimonial",
    description: "Customer quote card — social proof in a clean visual.",
    needs_product: false,
    product_optional: false,
    icon: "⭐",
    thumb: "/template thumbnails/content/testimonial.jpg",
  },
  {
    name: "lifestyle",
    label: "Lifestyle",
    description: "Brand or product placed naturally in an aspirational scene.",
    needs_product: false,
    product_optional: true,
    icon: "🌿",
    thumb: "/template thumbnails/content/lifestyle.jpg",
  },
  {
    name: "before-after",
    label: "Before & After",
    description: "Transformation story — before state (pain) vs after state (result).",
    needs_product: false,
    product_optional: true,
    icon: "🔄",
    thumb: "/template thumbnails/content/before_after.jpg",
  },
  {
    name: "style-choice",
    label: "Choose Your Style",
    description: "Side-by-side comparison of two aesthetic options — invites votes and comments.",
    needs_product: false,
    product_optional: true,
    icon: "⚖️",
    thumb: "/template thumbnails/content/style_choice.jpg",
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
