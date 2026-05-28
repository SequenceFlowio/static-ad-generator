import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const db = getServerSupabase();
  const { data } = await db
    .from("social_settings")
    .select("*")
    .eq("brand_id", brandId)
    .single();

  return NextResponse.json(data ?? {
    enabled: false,
    platforms: ["instagram"],
    frequency: "daily",
    post_time: "09:00",
    content_types: ["product", "lifestyle"],
    require_approval: true,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId } = await params;
  const body = await req.json();
  const db = getServerSupabase();

  const { data, error } = await db
    .from("social_settings")
    .upsert({
      brand_id: brandId,
      user_id: user.id,
      enabled: body.enabled ?? false,
      platforms: body.platforms ?? ["instagram"],
      frequency: body.frequency ?? "daily",
      post_time: body.post_time ?? "09:00",
      content_types: body.content_types ?? ["product", "lifestyle"],
      require_approval: body.require_approval ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "brand_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
