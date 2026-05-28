import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import {
  publishFacebookPost,
  createInstagramContainer,
  publishInstagramContainer,
  getFirstPage,
  getInstagramUserId,
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

  // Resolve page_id live if not stored (e.g. connected before this field was added)
  let pageId: string | null = conn.page_id ?? null;
  let igUserId: string | null = conn.ig_user_id ?? null;
  if (!pageId) {
    const page = await getFirstPage(conn.access_token).catch(() => null);
    pageId = page?.id ?? null;
    if (pageId && !igUserId) {
      igUserId = await getInstagramUserId(conn.access_token, pageId).catch(() => null);
    }
    // Persist for next time
    if (pageId) {
      await db.from("facebook_connections").update({
        page_id: pageId,
        ig_user_id: igUserId,
        updated_at: new Date().toISOString(),
      }).eq("brand_id", brandId);
    }
  }

  let fbPostId: string | null = null;
  let igPostId: string | null = null;
  const errors: string[] = [];

  // Publish to Facebook Page
  if (platforms.includes("facebook")) {
    if (!pageId) {
      errors.push("Facebook: geen gekoppelde pagina gevonden — verbind opnieuw.");
    } else {
      try {
        const result = await publishFacebookPost(conn.access_token, pageId, imageUrl, caption);
        fbPostId = result.post_id;
      } catch (e) {
        errors.push(`Facebook: ${(e as Error).message}`);
      }
    }
  }

  // Publish to Instagram
  if (platforms.includes("instagram")) {
    if (!igUserId) {
      errors.push("Instagram: geen gekoppeld Instagram Business-account gevonden.");
    } else {
      try {
        const containerId = await createInstagramContainer(conn.access_token, igUserId, imageUrl, caption);
        const result = await publishInstagramContainer(conn.access_token, igUserId, containerId);
        igPostId = result.ig_post_id;
      } catch (e) {
        errors.push(`Instagram: ${(e as Error).message}`);
      }
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
