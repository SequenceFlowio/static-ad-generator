import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// PATCH — save edited Seedance prompt + advance to prompt phase
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId, sessionId } = await params;
  const db = getServerSupabase();

  const { data: session } = await db.from("video_sessions")
    .select("id").eq("id", sessionId).eq("brand_id", brandId).single();
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { seedance_prompt } = await req.json() as { seedance_prompt: string };

  const { error } = await db.from("video_sessions").update({
    seedance_prompt,
    phase: "prompt",
    updated_at: new Date().toISOString(),
  }).eq("id", sessionId);

  if (error) return NextResponse.json({ error: "Failed to save prompt" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
