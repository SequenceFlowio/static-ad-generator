import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getFbOAuthUrl } from "@/lib/facebook";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = req.nextUrl.searchParams.get("brand_id");
  if (!brandId) return NextResponse.json({ error: "brand_id required" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ads.sequenceflow.io";
  const redirectUri = `${appUrl}/api/auth/facebook/callback`;
  const url = getFbOAuthUrl(brandId, redirectUri);

  return NextResponse.json({ url });
}
