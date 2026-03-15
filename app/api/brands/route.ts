import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

// GET /api/brands — list all brands
export async function GET() {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("brands")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/brands — create a brand
export async function POST(req: Request) {
  const { name, url } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const db = getServerSupabase();
  const { data, error } = await db
    .from("brands")
    .insert({ name, url: url || null, slug })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
