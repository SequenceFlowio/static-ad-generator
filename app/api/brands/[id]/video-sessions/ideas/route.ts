import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { generateText } from "@/lib/llm";

export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const db = getServerSupabase();

  const body = await req.json() as {
    product_id?: string;
    video_style?: string;
    active_desire?: string;
    awareness_level?: string;
    notes?: string;
  };

  const [{ data: brandDna }, { data: product }] = await Promise.all([
    db.from("brand_dna").select("data").eq("brand_id", brandId)
      .order("generated_at", { ascending: false }).limit(1).maybeSingle(),
    body.product_id
      ? db.from("products").select("name, description").eq("id", body.product_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const dna = brandDna?.data as { brand_name?: string; customer_desires?: string[] } | null;

  const context = [
    dna?.brand_name ? `Brand: ${dna.brand_name}` : "",
    product ? `Product: ${(product as { name: string }).name}` : "",
    body.video_style ? `Video stijl: ${body.video_style}` : "",
    body.active_desire ? `Desire focus: ${body.active_desire}` : "",
    body.awareness_level ? `Awareness level: ${body.awareness_level}` : "",
    body.notes ? `Gebruikersnota: ${body.notes}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `Je bent een social media advertentie specialist. Genereer 5 korte, concrete ad-concept ideeën voor een korte video advertentie (15 seconden, 6-7 frames).

Context:
${context}

Geef exacte, bruikbare concepten — geen vage beschrijvingen. Elk idee is 1-2 zinnen en beschrijft de kern van de video (wat je ziet, de hook, het gevoel).

Voorbeelden van goede ideeën:
- "Voor/na vergelijking: oude goedkope keukenmessen vs het nieuwe set. Snelle snap-cuts op elke wisseling."
- "ASMR unboxing op een marmeren aanrecht, close-up op elke component, eindigt met het complete set uitgestald."
- "Een moeder die snel avondeten kookt — snelle cuts per handeling, product in iedere shot prominent aanwezig."

Geef ALLEEN de ideeën terug als een JSON array van strings, geen extra tekst:
{"ideas": ["idee 1", "idee 2", "idee 3", "idee 4", "idee 5"]}`;

  try {
    const raw = await generateText({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      responseFormat: { type: "json_object" },
    });

    const parsed = JSON.parse(raw) as { ideas?: string[] };
    const ideas = parsed.ideas ?? [];

    return NextResponse.json({ ideas });
  } catch {
    return NextResponse.json({ error: "Failed to generate ideas" }, { status: 500 });
  }
}
