import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// GET — fetch single session
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId, sessionId } = await params;
  const db = getServerSupabase();

  const { data: session } = await db.from("video_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("brand_id", brandId)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  return NextResponse.json({ session });
}
