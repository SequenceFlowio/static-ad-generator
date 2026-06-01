import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getServerSupabase, uploadToStorage } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await getAuthUser();
  const db = getServerSupabase();
  const { data, error } = await db
    .from("gallery_avatars")
    .select("*")
    .eq("brand_id", id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ avatars: data ?? [] });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: brandId } = await params;
  await getAuthUser();
  const db = getServerSupabase();

  const formData = await req.formData();
  const name = formData.get("name") as string;
  const gender = (formData.get("gender") as string) || null;
  const age_range = (formData.get("age_range") as string) || null;
  const style = (formData.get("style") as string) || null;
  const extra_description = (formData.get("extra_description") as string) || null;
  const photo = formData.get("photo") as File | null;

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const parts: string[] = [];
  if (gender) parts.push(gender);
  if (age_range) parts.push(age_range);
  if (style) parts.push(`${style} style`);
  if (extra_description) parts.push(extra_description);
  const prompt_hint = parts.join(", ");

  let photo_url: string | null = null;
  if (photo && photo.size > 0) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const ext = photo.name.split(".").pop() ?? "jpg";
    const path = `brands/${brandId}/gallery/avatars/${Date.now()}.${ext}`;
    photo_url = await uploadToStorage("product-images", path, buffer, photo.type);
  }

  const { data, error } = await db
    .from("gallery_avatars")
    .insert({ brand_id: brandId, name, gender, age_range, style, extra_description, prompt_hint, photo_url })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ avatar: data }, { status: 201 });
}
