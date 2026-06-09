import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import type { ContentPlan, ContentTypeConfig } from "@/types";

const DEFAULT_CONTENT_TYPES: ContentTypeConfig[] = [
  { key: "kitchen-inspiration", label: "Kitchen Inspiration", template_key: "lifestyle", percentage: 30, auto_enabled: true, goal: "saves", min_pct: 20, max_consecutive: 2, color: "green" },
  { key: "before-after", label: "Before & After", template_key: "before-after", percentage: 25, auto_enabled: true, goal: "reach", min_pct: 15, max_consecutive: 2, color: "blue" },
  { key: "style-choice", label: "Choose Your Style", template_key: "style-choice", percentage: 15, auto_enabled: true, goal: "engagement", min_pct: 10, max_consecutive: 1, color: "purple" },
  { key: "product-aesthetic", label: "Product Aesthetic", template_key: "about-product", percentage: 15, auto_enabled: true, goal: "sales", min_pct: 10, max_consecutive: 2, color: "orange" },
  { key: "kitchen-tips", label: "Kitchen Tips", template_key: "tips-tricks", percentage: 10, auto_enabled: true, goal: "saves", min_pct: 5, max_consecutive: 1, color: "yellow" },
  { key: "reviews", label: "Reviews", template_key: "testimonial", percentage: 5, auto_enabled: false, goal: "trust", min_pct: 0, max_consecutive: 1, color: "gray" },
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: brandId } = await params;
    const db = getServerSupabase();

    const { data } = await db.from("content_plan")
      .select("*").eq("brand_id", brandId).maybeSingle();

    if (!data) {
      return NextResponse.json({
        plan: {
          brand_id: brandId,
          content_types: DEFAULT_CONTENT_TYPES,
          product_weights: {},
          weekly_posts: 4,
        } satisfies Partial<ContentPlan>,
      });
    }

    return NextResponse.json({ plan: data as ContentPlan });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load content plan";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: brandId } = await params;
    const db = getServerSupabase();

    const body = await req.json() as {
      content_types: ContentTypeConfig[];
      product_weights?: Record<string, number>;
      weekly_posts?: number;
    };

    const { error, data } = await db.from("content_plan").upsert({
      brand_id: brandId,
      user_id: user.id,
      content_types: body.content_types,
      product_weights: body.product_weights ?? {},
      weekly_posts: body.weekly_posts ?? 4,
      updated_at: new Date().toISOString(),
    }, { onConflict: "brand_id" }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ plan: data as ContentPlan });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save content plan";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
