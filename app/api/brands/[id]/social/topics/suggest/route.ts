import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateText } from "@/lib/llm";
import type { BrandDnaData } from "@/types";

export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: brandId } = await params;
    const db = getServerSupabase();

    const body = await req.json() as {
      content_type_key: string;
      content_type_label: string;
      template_key: string;
      count?: number;
    };

    const [{ data: dnaRow }, { data: existingTopics }] = await Promise.all([
      db.from("brand_dna").select("data").eq("brand_id", brandId)
        .order("generated_at", { ascending: false }).limit(1).maybeSingle(),
      db.from("content_topics").select("topic")
        .eq("brand_id", brandId).eq("content_type_key", body.content_type_key),
    ]);

    const dna = dnaRow?.data as BrandDnaData | null;
    const existing = (existingTopics ?? []).map(t => t.topic);
    const count = Math.min(body.count ?? 6, 10);

    const prompt = `Je bent een social media content specialist voor DTC merken.

Brand: ${dna?.name ?? "onbekend merk"}
Doelgroep: ${dna?.target_audience ?? "niet gespecificeerd"}
Brand persoonlijkheid: ${dna?.brand_personality ?? "niet gespecificeerd"}

Content type: ${body.content_type_label}
Template: ${body.template_key}

${existing.length > 0 ? `Al bestaande topics (VERMIJD deze of maak er variaties op die duidelijk anders zijn):\n${existing.map(t => `- ${t}`).join("\n")}\n` : ""}

Genereer ${count} specifieke, concrete post-ideeën voor dit content type. Elk idee is 1 zin en beschrijft exact het onderwerp of de hoek van de post. Wees specifiek — geen vage beschrijvingen.

Geef ALLEEN de ideeën terug als een JSON array:
{"topics": ["idee 1", "idee 2", "idee 3"]}`;

    const raw = await generateText({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
    });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in LLM response");
    const parsed = JSON.parse(jsonMatch[0]) as { topics?: string[] };
    const topics = (parsed.topics ?? []).filter((t): t is string => typeof t === "string" && t.trim().length > 0);

    return NextResponse.json({ topics });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to suggest topics";
    console.error("[topics/suggest]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
