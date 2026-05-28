import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import {
  publishFacebookPost,
  createInstagramContainer,
  publishInstagramContainer,
} from "@/lib/facebook";

export const maxDuration = 300;

// Called by Vercel Cron every 5 minutes. Publishes posts whose scheduled_at is due.
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServerSupabase();
  const now = new Date().toISOString();

  // Find all scheduled posts that are due
  const { data: posts } = await db
    .from("social_posts")
    .select("*, brand_id")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .limit(50);

  if (!posts || posts.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  let published = 0;
  let failed = 0;

  for (const post of posts) {
    // Load Facebook connection
    const { data: conn } = await db
      .from("facebook_connections")
      .select("access_token, page_id, ig_user_id")
      .eq("brand_id", post.brand_id)
      .single();

    if (!conn) {
      await db.from("social_posts").update({
        status: "failed",
        error_message: "Facebook not connected",
        updated_at: new Date().toISOString(),
      }).eq("id", post.id);
      failed++;
      continue;
    }

    // Mark as publishing
    await db.from("social_posts").update({ status: "publishing", updated_at: new Date().toISOString() }).eq("id", post.id);

    const imageUrl = (post.image_urls as string[])?.[0];
    const caption = (post.caption as string) ?? "";
    const platforms = (post.platforms as string[]) ?? ["instagram"];

    let fbPostId: string | null = null;
    let igPostId: string | null = null;
    const errors: string[] = [];

    if (platforms.includes("facebook") && conn.page_id) {
      try {
        const r = await publishFacebookPost(conn.access_token, conn.page_id, imageUrl, caption);
        fbPostId = r.post_id;
      } catch (e) { errors.push(`FB: ${(e as Error).message}`); }
    }

    if (platforms.includes("instagram") && conn.ig_user_id) {
      try {
        const containerId = await createInstagramContainer(conn.access_token, conn.ig_user_id, imageUrl, caption);
        const r = await publishInstagramContainer(conn.access_token, conn.ig_user_id, containerId);
        igPostId = r.ig_post_id;
      } catch (e) { errors.push(`IG: ${(e as Error).message}`); }
    }

    const succeeded = fbPostId || igPostId;
    await db.from("social_posts").update({
      status: succeeded ? "published" : "failed",
      fb_post_id: fbPostId,
      ig_post_id: igPostId,
      published_at: succeeded ? new Date().toISOString() : null,
      error_message: errors.length > 0 ? errors.join("; ") : null,
      updated_at: new Date().toISOString(),
    }).eq("id", post.id);

    if (succeeded) published++; else failed++;
  }

  return NextResponse.json({ published, failed });
}
