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
  // Visual System
  primary_font: string | null;
  secondary_font: string | null;
  accent_color: string | null;      // brand accent / CTA color hex
  lettertype_color: string | null;  // primary text/font color hex
  background_color: string | null;  // primary background color hex
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
}

export type Resolution = "1K" | "2K" | "4K";
export type KieModel = "nano-banana-2" | "seedream/4.5-edit";

export const MODEL_CONFIGS: Record<KieModel, {
  label: string;
  description: string;
  resolutions: Resolution[];
  costPerImage: Record<string, number>;
}> = {
  "nano-banana-2": {
    label: "Nano Banana 2",
    description: "Fast · Structured commercial design",
    resolutions: ["1K", "2K", "4K"],
    costPerImage: { "1K": 0.04, "2K": 0.06, "4K": 0.09 },
  },
  "seedream/4.5-edit": {
    label: "Seedream 4.5",
    description: "Premium · Superior text & spatial accuracy",
    resolutions: ["2K", "4K"],
    costPerImage: { "2K": 0.0325, "4K": 0.0325 },
  },
};

export interface GenerateRequest {
  template_numbers: number[];
  resolution: Resolution;
  prompt_set_id: string;
  model: KieModel;
}

export interface SseEvent {
  type: "start" | "done" | "error" | "complete";
  template_number?: number;
  template_name?: string;
  image_urls?: string[];
  error?: string;
  job_id?: string;
}
