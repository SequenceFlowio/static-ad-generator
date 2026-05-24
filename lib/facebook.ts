const FB_BASE = "https://graph.facebook.com/v21.0";

function appId() {
  return process.env.FACEBOOK_APP_ID!;
}
function appSecret() {
  return process.env.FACEBOOK_APP_SECRET!;
}

export function getFbOAuthUrl(brandId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: appId(),
    redirect_uri: redirectUri,
    scope: "ads_read,ads_management",
    state: brandId,
    response_type: "code",
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; expires_in: number; fb_user_id: string }> {
  const params = new URLSearchParams({
    client_id: appId(),
    client_secret: appSecret(),
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${FB_BASE}/oauth/access_token?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  // Fetch fb user id
  const meRes = await fetch(`${FB_BASE}/me?access_token=${data.access_token}`);
  const me = await meRes.json();

  return { access_token: data.access_token, expires_in: data.expires_in ?? 0, fb_user_id: me.id };
}

export async function extendToken(
  shortToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId(),
    client_secret: appSecret(),
    fb_exchange_token: shortToken,
  });
  const res = await fetch(`${FB_BASE}/oauth/access_token?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { access_token: data.access_token, expires_in: data.expires_in ?? 5184000 };
}

export async function getAdAccounts(
  accessToken: string
): Promise<{ id: string; name: string; currency: string }[]> {
  const res = await fetch(
    `${FB_BASE}/me/adaccounts?fields=id,name,currency&access_token=${accessToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (data.data ?? []) as { id: string; name: string; currency: string }[];
}

export interface FbRawInsight {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  campaign_name: string;
  adset_id: string;
  adset_name: string;
  spend: string;
  impressions: string;
  reach: string;
  frequency: string;
  clicks: string;
  purchase_roas: { action_type: string; value: string }[] | undefined;
  actions: { action_type: string; value: string }[] | undefined;
  action_values: { action_type: string; value: string }[] | undefined;
  cpp: string;
  date_start: string;
  date_stop: string;
}

export async function syncAdInsights(
  accessToken: string,
  accountId: string,
  datePreset: "last_7d" | "last_14d" | "last_30d"
): Promise<FbRawInsight[]> {
  const fields = [
    "ad_id", "ad_name", "campaign_id", "campaign_name", "adset_id", "adset_name",
    "spend", "impressions", "reach", "frequency", "clicks",
    "purchase_roas", "actions", "action_values", "cpp",
  ].join(",");

  const params = new URLSearchParams({
    level: "ad",
    fields,
    date_preset: datePreset,
    access_token: accessToken,
  });

  const res = await fetch(`${FB_BASE}/${accountId}/insights?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const results: FbRawInsight[] = [];
  let page = data;
  while (true) {
    results.push(...(page.data ?? []));
    if (!page.paging?.next) break;
    const nextRes = await fetch(page.paging.next);
    page = await nextRes.json();
  }
  return results;
}

export async function getAdStatus(
  accessToken: string,
  adId: string
): Promise<string> {
  const res = await fetch(`${FB_BASE}/${adId}?fields=effective_status&access_token=${accessToken}`);
  const data = await res.json();
  return data.effective_status ?? "UNKNOWN";
}

export async function getAdCreativeImageUrl(
  accessToken: string,
  adId: string
): Promise<string | null> {
  try {
    const adRes = await fetch(`${FB_BASE}/${adId}?fields=creative&access_token=${accessToken}`);
    const ad = await adRes.json();
    if (!ad.creative?.id) return null;

    const creativeRes = await fetch(
      `${FB_BASE}/${ad.creative.id}?fields=thumbnail_url,image_url&access_token=${accessToken}`
    );
    const creative = await creativeRes.json();
    return creative.thumbnail_url ?? creative.image_url ?? null;
  } catch {
    return null;
  }
}

export async function uploadImageToFacebook(
  accessToken: string,
  accountId: string,
  imageUrl: string
): Promise<{ image_hash: string }> {
  const res = await fetch(`${FB_BASE}/${accountId}/adimages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: imageUrl, access_token: accessToken }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  // Response: { images: { <filename>: { hash, url, ... } } }
  const images = data.images ?? {};
  const first = Object.values(images)[0] as { hash: string } | undefined;
  if (!first?.hash) throw new Error("No image hash returned from Facebook");
  return { image_hash: first.hash };
}

export async function createAdCreative(
  accessToken: string,
  accountId: string,
  imageHash: string,
  name: string,
  message: string,
  link: string
): Promise<{ id: string }> {
  const body = {
    name,
    object_story_spec: {
      page_id: await getPageId(accessToken, accountId),
      link_data: {
        image_hash: imageHash,
        link,
        message,
      },
    },
    access_token: accessToken,
  };
  const res = await fetch(`${FB_BASE}/${accountId}/adcreatives`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { id: data.id };
}

async function getPageId(accessToken: string, accountId: string): Promise<string> {
  const res = await fetch(
    `${FB_BASE}/${accountId}?fields=owner&access_token=${accessToken}`
  );
  const data = await res.json();
  // Fallback: fetch pages connected to the user
  const pagesRes = await fetch(`${FB_BASE}/me/accounts?access_token=${accessToken}`);
  const pages = await pagesRes.json();
  if (pages.data?.[0]?.id) return pages.data[0].id;
  // Last resort: return owner id if present
  return data.owner?.id ?? "";
}

export async function getCampaigns(
  accessToken: string,
  accountId: string
): Promise<{ id: string; name: string; status: string }[]> {
  const res = await fetch(
    `${FB_BASE}/${accountId}/campaigns?fields=id,name,effective_status&access_token=${accessToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (data.data ?? []).map((c: { id: string; name: string; effective_status: string }) => ({
    id: c.id,
    name: c.name,
    status: c.effective_status,
  }));
}

export async function getAdsets(
  accessToken: string,
  campaignId: string
): Promise<{ id: string; name: string; status: string }[]> {
  const res = await fetch(
    `${FB_BASE}/${campaignId}/adsets?fields=id,name,effective_status&access_token=${accessToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return (data.data ?? []).map((a: { id: string; name: string; effective_status: string }) => ({
    id: a.id,
    name: a.name,
    status: a.effective_status,
  }));
}

export async function createAd(
  accessToken: string,
  accountId: string,
  adsetId: string,
  creativeId: string,
  name: string
): Promise<{ id: string }> {
  const body = {
    name,
    adset_id: adsetId,
    creative: { creative_id: creativeId },
    status: "PAUSED",
    access_token: accessToken,
  };
  const res = await fetch(`${FB_BASE}/${accountId}/ads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { id: data.id };
}
