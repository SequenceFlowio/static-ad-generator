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

// ─── Video Jobs ─────────────────────────────────────────────────────────────

export type VideoJobStatus = "pending" | "generating_scenes" | "generating_video" | "done" | "failed";

export interface VideoJob {
  id: string;
  brand_id: string;
  product_id: string | null;
  status: VideoJobStatus;
  video_url: string | null;
  video_prompt: string | null;
  script: string | null;
  scene_image_urls: string[];
  reference_image_urls: string[];
  duration: number;
  aspect_ratio: string;
  video_style: string;
  error_msg: string | null;
  created_at: string;
}

// ─── Video Sessions (multi-step wizard) ─────────────────────────────────────

export interface VideoVisualBible {
  character: string;      // exact person description used in every scene
  environment: string;    // exact setting/location description
  lighting: string;       // lighting style and quality
  color_palette: string;  // visual color language
  camera_feel: string;    // camera style (UGC handheld, cinematic, etc.)
}

export interface SceneScript {
  index: number;          // 1-based
  title: string;          // short scene name e.g. "Opening hook"
  visual_description: string; // what happens visually — shown to user
  nano_prompt: string;    // full Nano Banana 2 prompt for this frame (serialized from JSON)
  voiceover: string;      // spoken dialogue or on-screen caption text
  duration_s: number;     // seconds (15 / num_scenes)
  image_url: string | null; // set after frame generation or upload
  frame_error?: boolean;    // true if last generation attempt failed
  product_in_frame: boolean; // whether product should appear in this frame
  character_in_frame: boolean; // whether a person appears in this frame
}

export type VideoPhase = "references" | "script" | "frames" | "prompt" | "generating_video" | "done" | "failed";

export interface VideoSession {
  id: string;
  brand_id: string;
  product_id: string | null;
  video_style: string;
  platform: string;
  aspect_ratio: string;
  num_scenes: number;
  duration: number;
  phase: VideoPhase;
  includes_person: boolean;
  character_ref_url: string | null;
  environment_ref_url: string | null;
  scenes: SceneScript[];
  seedance_prompt: string | null;
  visual_bible: VideoVisualBible | null;
  video_url: string | null;
  error_msg: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Facebook Analytics ──────────────────────────────────────────────────────

export interface FacebookConnection {
  id: string;
  brand_id: string;
  fb_account_id: string;
  fb_account_name: string | null;
  token_expires_at: string | null;
  created_at: string;
}

export interface FbAdInsights {
  id: string;
  brand_id: string;
  fb_ad_id: string;
  fb_campaign_id: string | null;
  fb_adset_id: string | null;
  ad_name: string | null;
  campaign_name: string | null;
  adset_name: string | null;
  ad_status: string | null;
  creative_image_url: string | null;
  date_start: string | null;
  date_stop: string | null;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  purchase_roas: number;
  purchase_value: number;
  purchases: number;
  cpp: number;
  ai_recommendation: "kill" | "wait" | "scale" | "vary" | null;
  ai_reason: string | null;
  synced_at: string;
}

export interface SocialPost {
  id: string;
  brand_id: string;
  platforms: string[];
  media_type: "image" | "video" | "carousel";
  image_urls: string[];
  video_url: string | null;
  caption: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  fb_post_id: string | null;
  ig_post_id: string | null;
  source: string;
  source_creative_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialSettings {
  id?: string;
  brand_id?: string;
  enabled: boolean;
  platforms: string[];
  frequency: "daily" | "2x_week" | "3x_week";
  post_time: string;
  content_types: string[];
  require_approval: boolean;
}

export interface SseEvent {
  type: "start" | "done" | "error" | "complete";
  template_number?: number;
  template_name?: string;
  image_urls?: string[];
  error?: string;
  job_id?: string;
}
