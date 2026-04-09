import winningAdsData from "@/data/winning-ads.json";

export interface WinningAdVisual {
  scene: string;
  composition: string;
  lighting: string;
  mood: string;
  color_approach: string;
}

export interface WinningAdCopy {
  headline: string;
  subtitle: string;
  cta: string;
}

export interface WinningAd {
  id: string;
  template: string;
  platform: string;
  niche: string;
  performance_note: string;
  visual: WinningAdVisual;
  copy: WinningAdCopy;
  hook_pattern: string;
  why_it_works: string;
  image_url: string;
}

const ALL_ADS: WinningAd[] = winningAdsData.winning_ads as WinningAd[];

/**
 * Returns up to `limit` winning ads for a given template + niche.
 * Strategy:
 *   1. Prefer entries matching both template AND niche
 *   2. Backfill with same-template entries from any niche
 *   3. Only returns entries that have at least a scene or headline filled in (non-empty)
 */
export function getWinningAds(
  template: string,
  niche: string,
  limit = 2
): WinningAd[] {
  const isFilled = (ad: WinningAd) =>
    ad.visual.scene.trim() !== "" || ad.copy.headline.trim() !== "";

  const filled = ALL_ADS.filter(
    (ad) => ad.template === template && isFilled(ad)
  );

  // Niche-matched first, then any-niche backfill
  const nicheMatch = filled.filter((ad) => ad.niche === niche);
  const anyNiche = filled.filter((ad) => ad.niche !== niche);

  const result: WinningAd[] = [];
  for (const ad of [...nicheMatch, ...anyNiche]) {
    if (result.length >= limit) break;
    result.push(ad);
  }

  return result;
}

/**
 * Formats winning ads as a concise block for injection into GPT-4o user messages.
 * Returns an empty string if no ads are available yet.
 */
export function formatWinningAdsBlock(ads: WinningAd[]): string {
  if (ads.length === 0) return "";

  const lines = ads.map((ad, i) => {
    const parts: string[] = [];
    if (ad.visual.scene)       parts.push(`Visual: ${ad.visual.scene}`);
    if (ad.visual.composition) parts.push(`Composition: ${ad.visual.composition}`);
    if (ad.visual.lighting)    parts.push(`Lighting: ${ad.visual.lighting}`);
    if (ad.visual.mood)        parts.push(`Mood: ${ad.visual.mood}`);
    if (ad.copy.headline)      parts.push(`Hook: "${ad.copy.headline}"`);
    if (ad.hook_pattern)       parts.push(`Pattern: ${ad.hook_pattern}`);
    if (ad.why_it_works)       parts.push(`Why it worked: ${ad.why_it_works}`);
    if (ad.performance_note)   parts.push(`Performance: ${ad.performance_note}`);

    return `[${i + 1}]\n${parts.map((p) => `  ${p}`).join("\n")}`;
  });

  return `WINNING AD REFERENCES — use these as inspiration for composition, mood, and hook structure. Do not copy them — draw on what made them work.\n\n${lines.join("\n\n")}`;
}
