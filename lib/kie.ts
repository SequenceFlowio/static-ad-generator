// kie.ai API wrapper
// Nano Banana 2: https://docs.kie.ai/market/google/nanobanana2
// Seedream 4.5:  https://kie.ai/seedream-4-5

const KIE_BASE = "https://api.kie.ai";
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 300_000; // 5 minutes

export type KieModel = "nano-banana-2" | "seedream/4.5-edit";

function getHeaders() {
  const key = process.env.KIE_API_KEY;
  if (!key) throw new Error("KIE_API_KEY environment variable is not set.");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

interface CreateTaskPayload {
  model: KieModel;
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
  }

  throw new Error(`kie.ai task ${taskId} timed out after ${POLL_TIMEOUT_MS / 1000}s`);
}

export async function generateImages({
  prompt,
  aspect_ratio,
  resolution,
  num_images = 4,
  reference_image_urls,
  model = "nano-banana-2",
}: {
  prompt: string;
  aspect_ratio: string;
  resolution: string;
  num_images?: number;
  reference_image_urls?: string[];
  model?: KieModel;
}): Promise<string[]> {
  const payload: CreateTaskPayload = {
    model,
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
