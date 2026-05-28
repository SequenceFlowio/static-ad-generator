import { NextResponse } from "next/server";
import { uploadToStorage } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// POST /api/brands/[id]/upload — generic file upload for social posts
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const contentType = file.type || "image/jpeg";
  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `social-posts/${id}/${Date.now()}.${ext}`;

  const url = await uploadToStorage("product-images", path, buffer, contentType);

  return NextResponse.json({ url });
}
