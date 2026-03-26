import { NextResponse } from "next/server";
import { getServerSupabase, uploadToStorage } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

const MAX_PER_TYPE = 20;

// GET /api/brands/[id]/inspo?type=ad|content
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try { await getAuthUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const type = new URL(req.url).searchParams.get("type");
  const db = getServerSupabase();

  const query = db
    .from("inspo_images")
    .select("*")
    .eq("brand_id", id)
    .order("created_at", { ascending: false });

  if (type) query.eq("type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/brands/[id]/inspo — upload inspo image (multipart/form-data)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try { await getAuthUser(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;

  if (!file || !type || !["ad", "content"].includes(type)) {
    return NextResponse.json({ error: "file and type (ad|content) are required" }, { status: 400 });
  }

  const db = getServerSupabase();

  // Enforce max 20 per type
  const { count } = await db
    .from("inspo_images")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", id)
    .eq("type", type);

  if ((count ?? 0) >= MAX_PER_TYPE) {
    return NextResponse.json({ error: `Maximum ${MAX_PER_TYPE} inspo images per type reached.` }, { status: 400 });
  }

  const { data: brandRow } = await db.from("brands").select("slug").eq("id", id).single();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${brandRow?.slug ?? id}/inspo/${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const publicUrl = await uploadToStorage("inspo-images", path, buffer, file.type);

  const { data, error } = await db
    .from("inspo_images")
    .insert({ brand_id: id, type, image_url: publicUrl })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
