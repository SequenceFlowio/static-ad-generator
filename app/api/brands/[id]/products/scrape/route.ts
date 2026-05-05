import { NextResponse } from "next/server";
import { generateText } from "@/lib/llm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // required by Next.js
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  try {
    const text = await generateText({
      messages: [
        {
          role: "system",
          content: `You are extracting product information from a product page URL.
Visit the URL and extract the product name and a 1-2 sentence product description.
Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{"name": "Product name", "description": "1-2 sentence description"}`,
        },
        { role: "user", content: `Extract product info from this URL: ${url}` },
      ],
      webSearch: true,
    });

    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const result = JSON.parse(cleaned) as { name: string; description: string };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
