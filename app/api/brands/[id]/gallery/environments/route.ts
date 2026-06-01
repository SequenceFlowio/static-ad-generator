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
    .from("gallery_environments")
    .select("*")
    .eq("brand_id", id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ environments: data ?? [] });
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
  const env_type = (formData.get("env_type") as string) || null;
  const lighting = (formData.get("lighting") as string) || null;
  const extra_description = (formData.get("extra_description") as string) || null;
  const photo = formData.get("photo") as File | null;

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const parts: string[] = [name];
  if (env_type) parts.push(env_type);
  if (lighting) parts.push(`${lighting} lighting`);
  if (extra_description) parts.push(extra_description);
  const prompt_hint = parts.join(", ");

  let photo_url: string | null = null;
  if (photo && photo.size > 0) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const ext = photo.name.split(".").pop() ?? "jpg";
    const path = `brands/${brandId}/gallery/environments/${Date.now()}.${ext}`;
    photo_url = await uploadToStorage("product-images", path, buffer, photo.type);
  }

  const { data, error } = await db
    .from("gallery_environments")
    .insert({ brand_id: brandId, name, env_type, lighting, extra_description, prompt_hint, photo_url })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ environment: data }, { status: 201 });
}
