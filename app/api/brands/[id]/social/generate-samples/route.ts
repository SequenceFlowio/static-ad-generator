import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import type { ContentPlan, GenerateSlot } from "@/types";

export const maxDuration = 300;

// Generates exactly 1 post per auto-enabled content type — used for testing.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: brandId } = await params;
    const db = getServerSupabase();

    const body = await req.json() as { platform?: string };

    const { data: planRow } = await db.from("content_plan")
      .select("*").eq("brand_id", brandId).maybeSingle();

    if (!planRow) {
      return NextResponse.json({ error: "Content plan not configured" }, { status: 404 });
    }

    const plan = planRow as ContentPlan;
    const autoTypes = plan.content_types.filter(t => t.auto_enabled);

    if (autoTypes.length === 0) {
      return NextResponse.json({ error: "No auto-enabled content types configured" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const slots: GenerateSlot[] = autoTypes.map(t => ({
      content_type_key: t.key,
      scheduled_date: today,
    }));

    const origin = req.headers.get("origin") ?? `https://${req.headers.get("host")}`;
    const res = await fetch(`${origin}/api/brands/${brandId}/social/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({
        slots,
        platform: body.platform ?? "instagram",
        require_approval: true, // always draft for samples
      }),
    });

    const result = await res.json() as { created: number; posts: unknown[]; errors?: string[] };
    return NextResponse.json({ created: result.created, posts: result.posts, errors: result.errors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sample generation failed";
    console.error("[generate-samples]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
