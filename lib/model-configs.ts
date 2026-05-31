import type { ImageModel, VideoModel } from "@/types";

export interface ImageModelConfig {
  label: string;
  api: "kie.ai" | "genai";
  description: string;
  creditsPerImage: number;
}

export interface VideoModelConfig {
  label: string;
  api: "kie.ai" | "genai";
  note: string;
  maxDuration: number; // seconds per clip
}

export const IMAGE_MODEL_CONFIGS: Record<ImageModel, ImageModelConfig> = {
  "nano-banana-2": {
    label: "Nano Banana 2",
    api: "kie.ai",
    description: "Standard quality · structured composition",
    creditsPerImage: 2,
  },
  "nano-banana-pro-genai": {
    label: "Nano Banana Pro",
    api: "genai",
    description: "Higher quality · richer details · GenAIPro",
    creditsPerImage: 3,
  },
};

export const VIDEO_MODEL_CONFIGS: Record<VideoModel, VideoModelConfig> = {
  "seedance-2": {
    label: "Seedance 2",
    api: "kie.ai",
    note: "Max 15s · cinematic motion",
    maxDuration: 15,
  },
  "veo-3.1": {
    label: "Veo 3.1",
    api: "genai",
    note: "Max 2×8s clips · Google model",
    maxDuration: 8,
  },
};
