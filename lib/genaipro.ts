// GenAIPro API client — https://docs.genaipro.io
// Base URL: https://genaipro.io/api
// Auth: Authorization: Bearer GENAIPRO_API_KEY
// All creation endpoints use multipart/form-data
// Poll: GET /v2/veo/tasks/{id} until status === "completed" | "failed"

const GENAIPRO_BASE = "https://genaipro.io/api";
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 300_000; // 5 minutes

export type GenAIProImageModel = "nano_banana_pro" | "nano_banana_2" | "imagen_4";
export type GenAIProUpscaleImage = "none" | "2k" | "4k";
export type GenAIProUpscaleVideo = "none" | "1080p";

interface GenAIProTaskResponse {
  id: string;
  prompt: string;
  file_urls: string[];
  status: "processing" | "completed" | "failed";
  created_at: string;
  error?: string;
}

function getHeaders(): HeadersInit {
  const key = process.env.GENAIPRO_API_KEY;
  if (!key) throw new Error("GENAIPRO_API_KEY environment variable is not set.");
  return { Authorization: `Bearer ${key}` };
}

// Map internal aspect ratio ("9:16", "16:9", "1:1") to GenAIPro image enum
function toImageAspectRatio(ar: string): "IMAGE_ASPECT_RATIO_LANDSCAPE" | "IMAGE_ASPECT_RATIO_PORTRAIT" {
  // Portrait: 9:16 or taller-than-wide
  if (ar === "9:16" || ar === "4:5" || ar === "2:3") return "IMAGE_ASPECT_RATIO_PORTRAIT";
  return "IMAGE_ASPECT_RATIO_LANDSCAPE";
}

// Map internal aspect ratio to GenAIPro video enum
function toVideoAspectRatio(ar: string): "VIDEO_ASPECT_RATIO_LANDSCAPE" | "VIDEO_ASPECT_RATIO_PORTRAIT" {
  if (ar === "9:16" || ar === "4:5" || ar === "2:3") return "VIDEO_ASPECT_RATIO_PORTRAIT";
  return "VIDEO_ASPECT_RATIO_LANDSCAPE";
}

// Download a URL and return as a Buffer with content-type
async function fetchAsBuffer(url: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image from ${url}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  return { buffer, contentType };
}

function contentTypeToExt(ct: string): string {
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  return "jpg";
}

// Poll GET /v2/veo/tasks/{id} until completed or failed
async function pollGenAIProTask(taskId: string): Promise<string[]> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(`${GENAIPRO_BASE}/v2/veo/tasks/${taskId}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`GenAIPro poll failed (${res.status}): ${await res.text()}`);
    }

    const task: GenAIProTaskResponse = await res.json();

    if (task.status === "completed") {
      return task.file_urls ?? [];
    }

    if (task.status === "failed") {
      throw new Error(`GenAIPro task failed: ${task.error ?? "unknown error"}`);
    }
  }

  throw new Error(`GenAIPro task ${taskId} timed out after ${POLL_TIMEOUT_MS / 1000}s`);
}

// POST /v2/veo/create-image — multipart/form-data
export async function createImageGenAIPro({
  prompt,
  aspect_ratio,
  model = "nano_banana_pro",
  number_of_images = 1,
  reference_image_urls,
  upscale_resolution = "none",
}: {
  prompt: string;
  aspect_ratio: string;
  model?: GenAIProImageModel;
  number_of_images?: number;
  reference_image_urls?: string[];
  upscale_resolution?: GenAIProUpscaleImage;
}): Promise<string[]> {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("aspect_ratio", toImageAspectRatio(aspect_ratio));
  form.append("model", model);
  form.append("number_of_images", String(number_of_images));
  if (upscale_resolution && upscale_resolution !== "none") {
    form.append("upscale_resolution", upscale_resolution);
  }

  // Download reference images and attach as files (max 5)
  if (reference_image_urls && reference_image_urls.length > 0) {
    const refs = reference_image_urls.slice(0, 5);
    for (let i = 0; i < refs.length; i++) {
      const { buffer, contentType } = await fetchAsBuffer(refs[i]);
      const ext = contentTypeToExt(contentType);
      const blob = new Blob([new Uint8Array(buffer)], { type: contentType });
      form.append("reference_images", blob, `ref_${i}.${ext}`);
    }
  }

  const res = await fetch(`${GENAIPRO_BASE}/v2/veo/create-image`, {
    method: "POST",
    headers: getHeaders(),
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GenAIPro create-image failed (${res.status}): ${text}`);
  }

  const data: GenAIProTaskResponse = await res.json();
  if (!data.id) throw new Error("GenAIPro create-image: no task id in response");

  return await pollGenAIProTask(data.id);
}

// POST /v2/veo/frames-to-video — multipart/form-data
// start_image required, end_image optional. Both are binary file uploads.
export async function framesToVideoGenAIPro({
  start_image_url,
  end_image_url,
  prompt,
  aspect_ratio,
  upscale_resolution = "1080p",
}: {
  start_image_url: string;
  end_image_url?: string;
  prompt: string;
  aspect_ratio: string;
  upscale_resolution?: GenAIProUpscaleVideo;
}): Promise<string[]> {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("aspect_ratio", toVideoAspectRatio(aspect_ratio));
  form.append("number_of_videos", "1");
  if (upscale_resolution && upscale_resolution !== "none") {
    form.append("upscale_resolution", upscale_resolution);
  }

  // Download and attach start image
  const start = await fetchAsBuffer(start_image_url);
  const startBlob = new Blob([new Uint8Array(start.buffer)], { type: start.contentType });
  form.append("start_image", startBlob, `start.${contentTypeToExt(start.contentType)}`);

  // Optionally attach end image
  if (end_image_url) {
    const end = await fetchAsBuffer(end_image_url);
    const endBlob = new Blob([new Uint8Array(end.buffer)], { type: end.contentType });
    form.append("end_image", endBlob, `end.${contentTypeToExt(end.contentType)}`);
  }

  const res = await fetch(`${GENAIPRO_BASE}/v2/veo/frames-to-video`, {
    method: "POST",
    headers: getHeaders(),
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GenAIPro frames-to-video failed (${res.status}): ${text}`);
  }

  // Response: { histories: [{ id, prompt, file_url, status, created_at }] }
  const data = await res.json() as { histories?: { id: string }[] };
  const taskId = data.histories?.[0]?.id;
  if (!taskId) throw new Error("GenAIPro frames-to-video: no task id in response");

  return await pollGenAIProTask(taskId);
}
