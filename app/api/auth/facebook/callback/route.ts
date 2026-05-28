import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { exchangeCodeForToken, extendToken, getAdAccounts, getFirstPage, getInstagramUserId } from "@/lib/facebook";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const brandId = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ads.sequenceflow.io";
  const redirectUri = `${appUrl}/api/auth/facebook/callback`;

  if (error || !code || !brandId) {
    return NextResponse.redirect(
      `${appUrl}/meta?error=fb_oauth_denied`
    );
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  try {
    const { access_token: shortToken, fb_user_id } = await exchangeCodeForToken(code, redirectUri);
    const { access_token, expires_in } = await extendToken(shortToken);
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    const [accounts, firstPage] = await Promise.all([
      getAdAccounts(access_token),
      getFirstPage(access_token),
    ]);
    const firstAccount = accounts[0];
    if (!firstAccount) {
      return NextResponse.redirect(
        `${appUrl}/meta?brand_id=${brandId}&error=no_ad_accounts`
      );
    }

    // Fetch Instagram Business Account ID linked to the page (if any)
    const igUserId = firstPage
      ? await getInstagramUserId(access_token, firstPage.id).catch(() => null)
      : null;

    const db = getServerSupabase();
    await db.from("facebook_connections").upsert(
      {
        brand_id: brandId,
        user_id: user.id,
        access_token,
        token_expires_at: tokenExpiresAt,
        fb_user_id,
        fb_account_id: firstAccount.id,
        fb_account_name: firstAccount.name,
        page_id: firstPage?.id ?? null,
        page_name: firstPage?.name ?? null,
        ig_user_id: igUserId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "brand_id" }
    );

    return NextResponse.redirect(
      `${appUrl}/meta?brand_id=${brandId}&connected=1`
    );
  } catch (err) {
    console.error("Facebook OAuth error:", err);
    return NextResponse.redirect(
      `${appUrl}/meta?brand_id=${brandId}&error=fb_oauth_failed`
    );
  }
}
