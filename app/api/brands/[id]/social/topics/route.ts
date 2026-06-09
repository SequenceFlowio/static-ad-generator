import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import type { ContentTopic } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: brandId } = await params;
    const db = getServerSupabase();
    const url = new URL(req.url);
    const contentTypeKey = url.searchParams.get("content_type_key");

    let query = db.from("content_topics")
      .select("*")
      .eq("brand_id", brandId)
      .order("last_used_at", { ascending: true, nullsFirst: true });

    if (contentTypeKey) query = query.eq("content_type_key", contentTypeKey);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ topics: (data ?? []) as ContentTopic[] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load topics";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: brandId } = await params;
    const db = getServerSupabase();

    const body = await req.json() as { content_type_key: string; topic: string };
    if (!body.content_type_key || !body.topic?.trim()) {
      return NextResponse.json({ error: "content_type_key and topic required" }, { status: 400 });
    }

    const { data, error } = await db.from("content_topics").insert({
      brand_id: brandId,
      user_id: user.id,
      content_type_key: body.content_type_key,
      topic: body.topic.trim(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ topic: data as ContentTopic });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add topic";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
