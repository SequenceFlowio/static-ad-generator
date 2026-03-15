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
  design_agency: string | null;
  voice_adjectives: string[];
  positioning: string | null;
  competitive_differentiation: string | null;
  // Visual System
  primary_font: string | null;
  secondary_font: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_colors: string[];
  cta_color_style: string | null;
  // Photography Direction
  lighting: string | null;
  color_grading: string | null;
  composition: string | null;
  subject_matter: string | null;
  props_and_surfaces: string | null;
  mood: string | null;
  // Product Details
  physical_description: string | null;
  label_logo_placement: string | null;
  distinctive_features: string | null;
  packaging_system: string | null;
  // Ad Creative Style
  typical_ad_formats: string | null;
  text_overlay_style: string | null;
  photo_vs_illustration: string | null;
  ugc_usage: string | null;
  offer_presentation: string | null;
  // Auto-generated prompt modifier
  prompt_modifier: string;
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
  prompts: PromptItem[];
}

export interface PromptItem {
  template_number: number;
  template_name: string;
  prompt: string;
  aspect_ratio: string;
  needs_product_images: boolean;
  notes: string;
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

export interface GenerateRequest {
  template_numbers: number[];
  resolution: Resolution;
  num_images: number;
  prompt_set_id: string;
}

export interface SseEvent {
  type: "start" | "done" | "error" | "complete";
  template_number?: number;
  template_name?: string;
  image_urls?: string[];
  error?: string;
  job_id?: string;
}
