import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; avatarId: string }> }
) {
  const { id: brandId, avatarId } = await params;
  await getAuthUser();
  const db = getServerSupabase();
  const { error } = await db
    .from("gallery_avatars")
    .delete()
    .eq("id", avatarId)
    .eq("brand_id", brandId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
