import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import {
  publishFacebookPost,
  createInstagramContainer,
  publishInstagramContainer,
} from "@/lib/facebook";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: brandId, postId } = await params;
  const db = getServerSupabase();

  // Load the post
  const { data: post } = await db
    .from("social_posts")
    .select("*")
    .eq("id", postId)
    .eq("brand_id", brandId)
    .single();
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  // Load Facebook connection for this brand
  const { data: conn } = await db
    .from("facebook_connections")
    .select("access_token, page_id, ig_user_id")
    .eq("brand_id", brandId)
    .single();
  if (!conn) return NextResponse.json({ error: "Facebook not connected" }, { status: 400 });

  const imageUrl = (post.image_urls as string[])?.[0];
  if (!imageUrl) return NextResponse.json({ error: "No image to publish" }, { status: 400 });

  const caption = (post.caption as string) ?? "";
  const platforms = (post.platforms as string[]) ?? ["instagram"];

  let fbPostId: string | null = null;
  let igPostId: string | null = null;
  const errors: string[] = [];

  // Publish to Facebook Page
  if (platforms.includes("facebook") && conn.page_id) {
    try {
      const result = await publishFacebookPost(conn.access_token, conn.page_id, imageUrl, caption);
      fbPostId = result.post_id;
    } catch (e) {
      errors.push(`Facebook: ${(e as Error).message}`);
    }
  }

  // Publish to Instagram
  if (platforms.includes("instagram") && conn.ig_user_id) {
    try {
      const containerId = await createInstagramContainer(conn.access_token, conn.ig_user_id, imageUrl, caption);
      const result = await publishInstagramContainer(conn.access_token, conn.ig_user_id, containerId);
      igPostId = result.ig_post_id;
    } catch (e) {
      errors.push(`Instagram: ${(e as Error).message}`);
    }
  }

  const succeeded = fbPostId || igPostId;
  const newStatus = succeeded ? "published" : "failed";

  await db.from("social_posts").update({
    status: newStatus,
    fb_post_id: fbPostId,
    ig_post_id: igPostId,
    published_at: succeeded ? new Date().toISOString() : null,
    error_message: errors.length > 0 ? errors.join("; ") : null,
    updated_at: new Date().toISOString(),
  }).eq("id", postId);

  if (!succeeded) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
  }

  return NextResponse.json({ ok: true, fb_post_id: fbPostId, ig_post_id: igPostId });
}
