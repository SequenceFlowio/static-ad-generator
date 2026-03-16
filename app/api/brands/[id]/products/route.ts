import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getServerSupabase();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("brand_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, description, url } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const db = getServerSupabase();
  const { data, error } = await db
    .from("products")
    .insert({ brand_id: id, name, description: description ?? null, url: url ?? null, image_urls: [] })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
