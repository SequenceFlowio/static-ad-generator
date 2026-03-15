export interface Brand {
  id: string;
  slug: string;
  name: string;
  url: string | null;
  created_at: string;
}

export interface BrandDna {
  id: string;
  brand_id: string;
  content: string;
  generated_at: string;
}

export interface PromptSet {
  id: string;
  brand_id: string;
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
  status: "pending" | "running" | "done" | "failed";
  image_urls: string[] | null;
  error: string | null;
  created_at: string;
}

export type Resolution = "1K" | "2K" | "4K";

export interface GenerateRequest {
  template_numbers: number[];
  resolution: Resolution;
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
