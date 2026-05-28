import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// GET — list social posts for brand
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // 'scheduled' | 'published' | 'draft' | null (all)
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const db = getServerSupabase();
  let query = db
    .from("social_posts")
    .select("*")
    .eq("brand_id", brandId)
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (from) query = query.gte("scheduled_at", from);
  if (to) query = query.lte("scheduled_at", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — create a new social post (draft or scheduled)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const body = await req.json() as {
    platforms: string[];
    media_type: "image" | "video" | "carousel";
    image_urls?: string[];
    video_url?: string;
    caption?: string;
    scheduled_at?: string;
    source?: string;
    source_creative_url?: string;
  };

  const db = getServerSupabase();
  const { data, error } = await db
    .from("social_posts")
    .insert({
      brand_id: brandId,
      user_id: user.id,
      platforms: body.platforms ?? ["instagram"],
      media_type: body.media_type ?? "image",
      image_urls: body.image_urls ?? [],
      video_url: body.video_url ?? null,
      caption: body.caption ?? null,
      scheduled_at: body.scheduled_at ?? null,
      status: body.scheduled_at ? "scheduled" : "draft",
      source: body.source ?? "manual",
      source_creative_url: body.source_creative_url ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
