import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// POST /api/brands/[id]/upload
// Returns a signed upload URL so the browser can upload directly to Supabase Storage.
// Body: { filename: string; content_type: string }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { filename, content_type } = await req.json() as { filename: string; content_type: string };

  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `social-posts/${id}/${Date.now()}.${ext}`;

  const db = getServerSupabase();
  const { data, error } = await db.storage
    .from("product-images")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: "Could not create upload URL" }, { status: 500 });
  }

  const publicUrl = db.storage.from("product-images").getPublicUrl(path).data.publicUrl;

  return NextResponse.json({
    signed_url: data.signedUrl,
    token: data.token,
    path,
    public_url: publicUrl,
    content_type,
  });
}
