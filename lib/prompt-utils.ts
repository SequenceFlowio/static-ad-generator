// Camera/lens constants and cinematic prompt builder for nano-banana-2.
// Ported from Open-Higgsfield-AI-main/src/lib/promptUtils.js.
// Only applied to nano-banana-2 (quality model) — skipped for seedream.

export const CAMERA_MAP: Record<string, string> = {
  "Modular 8K Digital": "modular 8K digital cinema camera",
  "Full-Frame Cine Digital": "full-frame digital cinema camera",
  "Grand Format 70mm Film": "grand format 70mm film camera",
  "Studio Digital S35": "Super 35 studio digital camera",
  "Classic 16mm Film": "classic 16mm film camera",
  "Premium Large Format Digital": "premium large-format digital cinema camera",
};

export const LENS_MAP: Record<string, string> = {
  "Creative Tilt Lens": "creative tilt lens effect",
  "Compact Anamorphic": "compact anamorphic lens",
  "Extreme Macro": "extreme macro lens",
  "70s Cinema Prime": "1970s cinema prime lens",
  "Classic Anamorphic": "classic anamorphic lens",
  "Premium Modern Prime": "premium modern prime lens",
  "Warm Cinema Prime": "warm-toned cinema prime lens",
  "Swirl Bokeh Portrait": "swirl bokeh portrait lens",
  "Vintage Prime": "vintage prime lens",
  "Halation Diffusion": "halation diffusion filter",
  "Clinical Sharp Prime": "ultra-sharp clinical prime lens",
};

export const FOCAL_PERSPECTIVE: Record<number, string> = {
  8: "ultra-wide perspective",
  14: "wide-angle perspective",
  24: "wide-angle dynamic perspective",
  35: "natural cinematic perspective",
  50: "standard portrait perspective",
  85: "classic portrait perspective",
};

export const APERTURE_EFFECT: Record<string, string> = {
  "f/1.4": "shallow depth of field, creamy bokeh",
  "f/4": "balanced depth of field",
  "f/11": "deep focus clarity, sharp foreground to background",
};

export interface CameraPreset {
  camera: string;
  lens: string;
  focal: number;
  aperture: string;
}

// Per-template hardcoded presets.
// Templates not listed here (tips-tricks, testimonial, vs-them) are graphic/typographic
// and skip cinematic enhancement entirely.
export const CONTENT_TEMPLATE_CAMERA_PRESETS: Record<string, CameraPreset> = {
  "about-brand":    { camera: "Full-Frame Cine Digital", lens: "Warm Cinema Prime",    focal: 50, aperture: "f/1.4" },
  "about-product":  { camera: "Full-Frame Cine Digital", lens: "Premium Modern Prime",  focal: 85, aperture: "f/1.4" },
  "using-product":  { camera: "Modular 8K Digital",      lens: "Classic Anamorphic",   focal: 35, aperture: "f/4"   },
  "lifestyle":      { camera: "Full-Frame Cine Digital", lens: "Warm Cinema Prime",    focal: 50, aperture: "f/1.4" },
  "before-after":   { camera: "Studio Digital S35",      lens: "Clinical Sharp Prime", focal: 50, aperture: "f/11"  },
};

export const AD_TEMPLATE_CAMERA_PRESETS: Record<string, CameraPreset> = {
  "headline":        { camera: "Full-Frame Cine Digital", lens: "Premium Modern Prime", focal: 85, aperture: "f/1.4" },
  "offer-promotion": { camera: "Full-Frame Cine Digital", lens: "Premium Modern Prime", focal: 85, aperture: "f/1.4" },
  "ugc-lifestyle":   { camera: "Modular 8K Digital",      lens: "Classic Anamorphic",  focal: 35, aperture: "f/4"   },
  // testimonial and vs-them are graphic/typographic — no cinematic enhancement
};

/**
 * Enriches a base image prompt with cinematic camera/lens specs for nano-banana-2.
 * Appends: shot on {camera}, using {lens} at {focal}mm, aperture, depth of field,
 * cinematic lighting, natural color science, HDR, professional photography, ultra-detailed, 8K.
 */
export function buildNanoBananaPrompt(
  basePrompt: string,
  camera: string,
  lens: string,
  focalLength: number,
  aperture: string
): string {
  const cameraDesc = CAMERA_MAP[camera] ?? camera;
  const lensDesc = LENS_MAP[lens] ?? lens;
  const perspective = FOCAL_PERSPECTIVE[focalLength] ?? "";
  const depthEffect = APERTURE_EFFECT[aperture] ?? "";

  const parts = [
    basePrompt,
    `shot on a ${cameraDesc}`,
    `using a ${lensDesc} at ${focalLength}mm${perspective ? ` (${perspective})` : ""}`,
    `aperture ${aperture}`,
    depthEffect,
    "cinematic lighting",
    "natural color science",
    "high dynamic range",
    "professional photography, ultra-detailed, 8K resolution",
  ];

  return parts.filter((p) => p && p.trim() !== "").join(", ");
}
