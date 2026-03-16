// kie.ai API wrapper for Nano Banana 2 image generation
// Docs: https://docs.kie.ai/market/google/nanobanana2

const KIE_BASE = "https://api.kie.ai";
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 300_000; // 5 minutes

function getHeaders() {
  const key = process.env.KIE_API_KEY;
  if (!key) throw new Error("KIE_API_KEY environment variable is not set.");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

interface CreateTaskPayload {
  model: "nano-banana-2";
  input: {
    prompt: string;
    aspect_ratio: string;
    num_images: number;
    output_format: "png" | "jpg";
    resolution: string;
    image_input?: string[];
  };
}

interface TaskStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    state: "waiting" | "queuing" | "generating" | "success" | "fail";
    resultJson?: string; // JSON string: { resultUrls: string[] }
    failMsg?: string | null;
  };
}

// Submit a generation task and return the taskId
async function createTask(payload: CreateTaskPayload): Promise<string> {
  const res = await fetch(`${KIE_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`kie.ai createTask failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (data.code !== 200) {
    throw new Error(`kie.ai createTask error: ${data.msg}`);
  }

  return data.data.taskId as string;
}

// Poll until the task is complete or failed; return image URLs
async function pollTask(taskId: string): Promise<string[]> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(`${KIE_BASE}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`kie.ai poll failed (${res.status}): ${await res.text()}`);
    }

    const data: TaskStatusResponse = await res.json();
    const task = data.data;

    if (task.state === "success") {
      const result = task.resultJson ? (JSON.parse(task.resultJson) as { resultUrls?: string[] }) : {};
      return result.resultUrls ?? [];
    }

    if (task.state === "fail") {
      throw new Error(`kie.ai task failed: ${task.failMsg ?? "unknown error"}`);
    }

    // Still pending or processing — keep polling
  }

  throw new Error(`kie.ai task ${taskId} timed out after ${POLL_TIMEOUT_MS / 1000}s`);
}

// High-level: generate images for a prompt, return image URLs from kie.ai
export async function generateImages({
  prompt,
  aspect_ratio,
  resolution,
  num_images = 4,
  reference_image_urls,
}: {
  prompt: string;
  aspect_ratio: string;
  resolution: string;
  num_images?: number;
  reference_image_urls?: string[];
}): Promise<string[]> {
  const payload: CreateTaskPayload = {
    model: "nano-banana-2",
    input: {
      prompt,
      aspect_ratio,
      num_images,
      output_format: "png",
      resolution,
      ...(reference_image_urls && reference_image_urls.length > 0
        ? { image_input: reference_image_urls.slice(0, 14) }
        : {}),
    },
  };

  const taskId = await createTask(payload);
  return await pollTask(taskId);
}
