import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import type { CreativeStrategy } from "@/types";

// GET /api/brands/[id]/creative-strategy
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getServerSupabase();

  const { data, error } = await db
    .from("creative_strategies")
    .select("*")
    .eq("brand_id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ strategy: data ?? null });
}

// POST /api/brands/[id]/creative-strategy — upsert
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getServerSupabase();

  const body = await req.json() as Partial<Omit<CreativeStrategy, "id" | "brand_id" | "created_at">>;

  const { data, error } = await db
    .from("creative_strategies")
    .upsert(
      {
        brand_id: id,
        name: body.name ?? "Default Strategy",
        creative_angles: body.creative_angles ?? [],
        content_pillars: body.content_pillars ?? [],
        hook_library: body.hook_library ?? [],
        visual_styles: body.visual_styles ?? [],
        forbidden_elements: body.forbidden_elements ?? [],
      },
      { onConflict: "brand_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ strategy: data });
}
