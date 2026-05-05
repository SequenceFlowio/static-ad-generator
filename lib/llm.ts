import OpenAI from "openai";

const KIE_GPT_52_URL = "https://api.kie.ai/gpt-5-2/v1/chat/completions";
const KIE_GPT_52_MODEL = "gpt-5-2";
const OPENAI_FALLBACK_MODEL = "gpt-5.2";
const KIE_MAX_ATTEMPTS = 5;

type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface GenerateTextOptions {
  messages: ChatMessage[];
  temperature?: number;
  responseFormat?: { type: "json_object" };
  webSearch?: boolean;
  reasoningEffort?: "low" | "medium" | "high";
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

interface ResponsesTextResponse {
  output: Array<{
    type: string;
    content?: Array<{
      type: string;
      text?: string;
    }>;
  }>;
}

function getKieKey(): string | null {
  return process.env.KIE_API_KEY ?? null;
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function extractChatContent(response: ChatCompletionResponse): string {
  const content = response.choices?.[0]?.message?.content;

  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (part.type === "text" || !part.type ? part.text ?? "" : ""))
      .join("");
  }

  return "";
}

function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithKie({
  messages,
  temperature,
  responseFormat,
  webSearch,
  reasoningEffort = "high",
}: GenerateTextOptions): Promise<string> {
  const key = getKieKey();
  if (!key) throw new Error("KIE_API_KEY environment variable is not set.");

  const payload: Record<string, unknown> = {
    model: KIE_GPT_52_MODEL,
    messages,
    reasoning_effort: reasoningEffort,
  };

  if (temperature !== undefined) payload.temperature = temperature;
  if (responseFormat) payload.response_format = responseFormat;
  if (webSearch) {
    payload.tools = [
      {
        type: "function",
        function: { name: "web_search" },
      },
    ];
  }

  const res = await fetch(KIE_GPT_52_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`kie.ai GPT-5.2 failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  const text = extractChatContent(data).trim();
  if (!text) throw new Error("No content returned from kie.ai GPT-5.2.");

  return stripJsonFences(text);
}

async function generateWithOpenAIFallback({
  messages,
  temperature,
  responseFormat,
  webSearch,
}: GenerateTextOptions): Promise<string> {
  const client = getOpenAIClient();

  if (webSearch) {
    const instructions = messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n");
    const input = messages
      .filter((message) => message.role !== "system")
      .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
      .join("\n\n");

    const response = await client.responses.create({
      model: OPENAI_FALLBACK_MODEL,
      instructions,
      input,
      tools: [{ type: "web_search_preview" }],
    } as Parameters<typeof client.responses.create>[0]) as unknown as ResponsesTextResponse;

    const text = response.output
      .filter((item) => item.type === "message")
      .flatMap((item) => {
        if (item.type !== "message") return [];
        return (item.content ?? [])
          .filter((content) => content.type === "output_text")
          .map((content) => (content.type === "output_text" ? content.text : ""));
      })
      .join("")
      .trim();

    if (!text) throw new Error("No content returned from OpenAI fallback.");
    return stripJsonFences(text);
  }

  const response = await client.chat.completions.create({
    model: OPENAI_FALLBACK_MODEL,
    messages,
    temperature,
    response_format: responseFormat,
  } as Parameters<typeof client.chat.completions.create>[0]) as unknown as ChatCompletionResponse;

  const text = extractChatContent(response).trim();
  if (!text) throw new Error("No content returned from OpenAI fallback.");

  return stripJsonFences(text);
}

export async function generateText(options: GenerateTextOptions): Promise<string> {
  let lastKieError: unknown = null;

  for (let attempt = 1; attempt <= KIE_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await generateWithKie(options);
    } catch (err) {
      lastKieError = err;
      if (attempt < KIE_MAX_ATTEMPTS) {
        await sleep(500 * attempt);
      }
    }
  }

  try {
    return await generateWithOpenAIFallback(options);
  } catch (fallbackError) {
    const kieMessage = lastKieError instanceof Error ? lastKieError.message : String(lastKieError);
    const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
    throw new Error(`Kie GPT-5.2 failed after ${KIE_MAX_ATTEMPTS} attempts, and OpenAI GPT-5.2 fallback failed. Kie: ${kieMessage}. OpenAI: ${fallbackMessage}`);
  }
}
