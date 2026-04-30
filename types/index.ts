export interface Brand {
  id: string;
  slug: string;
  name: string;
  url: string | null;
  created_at: string;
}

export interface BrandDnaData {
  // Brand Overview
  name: string;
  tagline: string | null;
  brand_story: string | null;
  target_audience: string | null;
  brand_personality: string | null;
  voice_adjectives: string[];
  positioning: string | null;
  competitive_differentiation: string | null;
  // Copy Strategy
  customer_desires: string[];   // what the ICP deeply wants — feeds into hook generation
  hook_examples: string[];      // proven hooks/angles — AI creates variants of these
  // Visual System
  primary_font: string | null;
  secondary_font: string | null;
  accent_color: string | null;      // brand accent / CTA color hex
  lettertype_color: string | null;  // primary text/font color hex
  background_color: string | null;  // primary background color hex
  // Output language for hook copy
  language: string;
  // Brand logo (public URL in Supabase Storage)
  logo_url: string | null;
}

export interface BrandDna {
  id: string;
  brand_id: string;
  data: BrandDnaData;
  generated_at: string;
}

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  url: string | null;
  image_urls: string[];
  created_at: string;
}

export interface PromptSet {
  id: string;
  brand_id: string;
  product_id: string | null;
  product_name: string;
  prompts_json: PromptsJson;
  generated_at: string;
}

export interface PromptsJson {
  brand: string;
  product: string;
  generated_at: string;
  num_variants: number;
  hook_intent: string | null;
  background_intent: string | null;
  prompts: PromptItem[];
  prompts_original?: PromptItem[];
}

export interface PromptItem {
  template_number: number;
  template_name: string;
  aspect_ratio: string;
  needs_product_images: boolean;
  notes: string;
  background_prompt: string;  // scene/product/visual — shared across all variants
  hook_variants: string[];    // N unique headline+subtitle+CTA texts, one per variant
}

export interface GenerationDetail {
  model: string;
  background_prompt: string;
  hook_variants: string[];
}

export interface GenerationJob {
  id: string;
  brand_id: string;
  prompt_set_id: string;
  template_number: number;
  template_name: string;
  resolution: string;
  num_images: number;
  status: "pending" | "running" | "done" | "failed";
  image_urls: string[] | null;
  error: string | null;
  created_at: string;
  generation_detail: GenerationDetail | null;
  performance_score: number | null;
  is_winner: boolean;
}

// ─── Creative Strategy Layer ────────────────────────────────────────────────

export interface CreativeAngle {
  key: string;           // slug — e.g. "hero-transformation"
  label: string;         // display name — e.g. "Hero Transformation"
  description: string;   // one sentence: what emotional arc this angle uses
  hook_frame: string;    // sentence starter / framing device for copy
}

export interface ContentPillar {
  key: string;
  label: string;
  description: string;   // topic territory — "educational", "social proof", etc.
  visual_note: string;   // visual direction guidance for this pillar
}

export interface HookEntry {
  hook: string;          // the actual hook text
  angle_key: string;     // which creative angle this belongs to
  pillar_key: string;    // which content pillar this belongs to
  performance_note: string | null;
}

export interface VisualStyle {
  key: string;
  label: string;
  description: string;   // visual composition / mood notes
  reference_note: string | null;  // optional reference to an image or concept
}

export interface CreativeStrategy {
  id: string;
  brand_id: string;
  name: string;
  creative_angles: CreativeAngle[];
  content_pillars: ContentPillar[];
  hook_library: HookEntry[];
  visual_styles: VisualStyle[];
  forbidden_elements: string[];  // things that must never appear in prompts
  created_at: string;
}

export type Resolution = "1K" | "2K" | "4K";
export type KieModel = "nano-banana-2" | "seedream/4.5-edit";

export const MODEL_CONFIGS: Record<KieModel, {
  label: string;
  description: string;
  resolutions: Resolution[];
  costPerImage: Record<string, number>;
  creditsPerImage: number;
}> = {
  "nano-banana-2": {
    label: "Quality",
    description: "Best results · Structured commercial design",
    resolutions: ["1K", "2K", "4K"],
    costPerImage: { "1K": 0.04, "2K": 0.06, "4K": 0.09 },
    creditsPerImage: 2,
  },
  "seedream/4.5-edit": {
    label: "Fast & Efficient",
    description: "Quick results · Great for volume generation",
    resolutions: ["2K", "4K"],
    costPerImage: { "2K": 0.0325, "4K": 0.0325 },
    creditsPerImage: 1,
  },
};

export interface GenerateRequest {
  template_numbers: number[];
  resolution: Resolution;
  prompt_set_id: string;
  model: KieModel;
  aspect_ratio?: string; // global override — applied to all selected templates
}

export interface SseEvent {
  type: "start" | "done" | "error" | "complete";
  template_number?: number;
  template_name?: string;
  image_urls?: string[];
  error?: string;
  job_id?: string;
}
