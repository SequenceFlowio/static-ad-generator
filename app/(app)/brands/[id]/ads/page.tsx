"use client";

import { useEffect, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import InspoPicker from "@/components/InspoPicker";
import InspoLibrary from "@/components/InspoLibrary";
import GeneratingOverlay from "@/components/GeneratingOverlay";
import type { Brand, Product, KieModel } from "@/types";
import { MODEL_CONFIGS } from "@/types";
import { useLanguage } from "@/components/LanguageProvider";

const AD_TEMPLATES = [
  { number: 1, name: "headline", label: "Headline", thumb: "/template thumbnails/headline.jpg" },
  { number: 2, name: "offer-promotion", label: "Offer / Promo", thumb: "/template thumbnails/offer.jpg" },
  { number: 3, name: "testimonial", label: "Testimonial", thumb: "/template thumbnails/testimonial.jpg" },
  { number: 4, name: "vs-them", label: "Us vs Them", thumb: "/template thumbnails/us_vs_them.jpg" },
  { number: 5, name: "ugc-lifestyle", label: "UGC Lifestyle", thumb: "/template thumbnails/ugc_lifestyle.jpg" },
];

const BACKGROUND_PRESETS_EN = [
  "White marble kitchen counter with soft morning light streaming through a window",
  "Minimalist white studio with subtle shadows and clean background",
  "Rustic wooden table with warm amber ambient lighting and soft bokeh background",
  "Lush green tropical foliage with dappled sunlight and deep shadows",
  "Modern concrete surface with moody industrial overhead lighting",
  "Sandy beach at golden hour with soft waves and warm horizon glow",
  "Cozy café table with warm evening light and blurred café interior",
  "Dark charcoal background with dramatic directional studio lighting",
  "Fresh botanical garden with natural deep greens and diffused soft light",
  "Sleek black granite surface with sharp specular highlights and minimal shadows",
  "Soft pastel bedroom with morning light, clean white linens and airy feel",
  "Urban rooftop at sunset with city skyline bokeh in the background",
  "Cold blue winter landscape with frosted surfaces and overcast ambient light",
  "Mediterranean terracotta tiles with warm bright midday sunlight",
  "Forest floor with soft green ambient light filtering through tree canopy",
  "Minimalist bathroom with clean white tiles and soft diffused natural light",
  "Artisan workshop surface with natural wood grain and warm task lighting",
  "Fashion boutique white interior with spotlights and clean cast shadows",
  "Outdoor farmers market with warm natural morning light and organic context",
  "Luxurious deep velvet surface with dramatic low-key moody lighting",
];

const BACKGROUND_PRESETS_NL = [
  "Wit marmeren aanrecht met zacht ochtendlicht dat door een raam naar binnen valt",
  "Minimalistisch wit studio-achtergrond met subtiele schaduwen",
  "Rustiek houten tafelblad met warm amberkleurig sfeerverlichting en zachte bokeh",
  "Weelderig groen tropisch gebladerte met gefilterd zonlicht en diepe schaduwen",
  "Modern betonnen oppervlak met sfeervolle industriële verlichting van boven",
  "Zandstrand tijdens het gouden uur met zachte golven en warme horizon",
  "Gezellig caféblad met warm avondlicht en een wazig café-interieur op de achtergrond",
  "Donkergrijze achtergrond met dramatische gerichte studiobelichting",
  "Frisse botanische tuin met diepe groentinten en zacht diffuus licht",
  "Glanzend zwart granieten oppervlak met scherpe spiegelingen en minimale schaduwen",
  "Zachte pastelkleurige slaapkamer met ochtendlicht en strakke witte beddengoed",
  "Stads dakterras bij zonsondergang met stedelijke skyline als wazig decor",
  "Koelblauw winterlandschap met berijpte oppervlakken en bewolkt omgevingslicht",
  "Mediterrane terracottategels met warm fel middaglicht",
  "Bosbodem met zacht groen licht dat door het bladerdak filtert",
  "Minimalistische badkamer met witte tegels en zacht natuurlijk diffuus licht",
  "Ambachtelijk werkblad met natuurlijke houtstructuur en warm taakverlichting",
  "Wit modeboutique-interieur met spotlights en strakke slagschaduwen",
  "Boerenmarkt buiten met warm natuurlijk ochtendlicht en organische sfeer",
  "Weelderig donker fluwelen oppervlak met dramatische low-key sfeerverlichting",
];

type Resolution = "1K" | "2K" | "4K";

export default function AdsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { lang, t } = useLanguage();
  const BACKGROUND_PRESETS = lang === "nl" ? BACKGROUND_PRESETS_NL : BACKGROUND_PRESETS_EN;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [adMode, setAdMode] = useState<"regular" | "batch">("regular");
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([1]);
  const [numImages, setNumImages] = useState(2);
  const [model, setModel] = useState<KieModel>("nano-banana-2");
  const [selectedInspo, setSelectedInspo] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState<10 | 20 | 50>(10);
  const [batchTemplates, setBatchTemplates] = useState<string[]>(["headline", "offer-promotion", "testimonial", "vs-them", "ugc-lifestyle"]);
  const [userPlan, setUserPlan] = useState<string>("trial");
  const [backgroundIntent, setBackgroundIntent] = useState("");

  // Generation progress
  const [generating, setGenerating] = useState(false);
  const [overlayProgress, setOverlayProgress] = useState(0);
  const [overlayMessage, setOverlayMessage] = useState("");
  const [genError, setGenError] = useState<string | null>(null);
  const [genDone, setGenDone] = useState(false);
  const [genSubmitted, setGenSubmitted] = useState(false); // jobs created, generating in background

  // Derive resolution from plan + model — not exposed to user
  const isPaidPlan = userPlan !== "trial" && userPlan !== "free";
  const resolution: Resolution = isPaidPlan ? "4K" : model === "nano-banana-2" ? "1K" : "2K";

  useEffect(() => {
    fetch("/api/credits").then(r => r.json()).then(d => { if (d.plan) setUserPlan(d.plan); }).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      const [brandRes, productsRes] = await Promise.all([
        fetch(`/api/brands/${id}`),
        fetch(`/api/brands/${id}/products`),
      ]);
      if (!brandRes.ok) { router.push("/stores"); return; }
      const json = await brandRes.json();
      const prods = await productsRes.json();
      setBrand(json.brand);
      setProducts(Array.isArray(prods) ? prods : []);
      setLoading(false);
      if (!json.brand_dna) {
        router.push(`/brands/${id}`);
      }
    }
    load();
  }, [id, router]);

  function toggleProductSelect(productId: string) {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) return prev.filter((p) => p !== productId);
      if (prev.length >= 3) return prev;
      return [...prev, productId];
    });
  }

  function toggleTemplate(n: number) {
    setSelectedTemplates((prev) => prev.includes(n) ? prev.filter((t) => t !== n) : [...prev, n]);
  }

  function toggleBatchTemplate(name: string) {
    setBatchTemplates((prev) => prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]);
  }

  function selectModel(m: KieModel) {
    setModel(m);
  }

  // Credit estimate
  const creditCost = MODEL_CONFIGS[model].creditsPerImage;
  const totalImages = adMode === "regular"
    ? selectedTemplates.length * numImages
    : batchSize;
  const estimatedCredits = totalImages * creditCost;

  const handleGenerateRegular = useCallback(async () => {
    if (selectedProductIds.length === 0 || selectedTemplates.length === 0) return;
    setGenerating(true);
    setGenDone(false);
    setGenSubmitted(false);
    setGenError(null);
    setOverlayProgress(5);
    setOverlayMessage("Generating ad concepts...");

    const promptRes = await fetch(`/api/brands/${id}/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_ids: selectedProductIds,
        product_id: selectedProductIds[0],
        num_variants: numImages,
        template_numbers: selectedTemplates,
        background_intent: backgroundIntent.trim() || null,
      }),
    });

    if (!promptRes.ok) {
      const d = await promptRes.json().catch(() => ({}));
      setGenError(d.error ?? "Prompt generation failed.");
      setGenerating(false);
      return;
    }

    const { prompt_set } = await promptRes.json();
    setOverlayProgress(30);
    setOverlayMessage("Creating your ads... this may take 1–2 minutes");

    const genRes = await fetch(`/api/brands/${id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_numbers: selectedTemplates,
        resolution,
        num_images: numImages,
        prompt_set_id: prompt_set.id,
        model,
        inspo_image_urls: selectedInspo,
        product_ids: selectedProductIds,
      }),
    });

    if (!genRes.ok) {
      const d = await genRes.json().catch(() => ({}));
      setGenError(d.error ?? "Generation failed.");
      setGenerating(false);
      return;
    }

    const { job_ids } = await genRes.json();
    const total = job_ids.length;

    // Dismiss overlay — let user keep browsing while generation runs in background
    setGenerating(false);
    setGenSubmitted(true);
    setGenDone(false);

    // Poll silently in background to flip genDone when complete
    const poll = async () => {
      try {
        const jobsRes = await fetch(`/api/brands/${id}/jobs?prompt_set_id=${prompt_set.id}`);
        if (!jobsRes.ok) { setTimeout(poll, 5000); return; }
        const jobs = await jobsRes.json();
        const done = jobs.filter((j: { status: string }) => j.status === "done" || j.status === "failed").length;
        if (done < total) {
          setTimeout(poll, 4000);
        } else {
          setGenDone(true);
        }
      } catch {
        setTimeout(poll, 5000);
      }
    };
    poll();
  }, [id, selectedProductIds, selectedTemplates, numImages, resolution, model, selectedInspo, backgroundIntent]);

  const handleGenerateBatch = useCallback(async () => {
    if (selectedProductIds.length === 0 || batchTemplates.length === 0) return;
    setGenerating(true);
    setGenDone(false);
    setGenError(null);
    setOverlayProgress(5);
    setOverlayMessage("Planning your campaign...");

    const res = await fetch(`/api/brands/${id}/batch-generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_ids: selectedProductIds,
        template_names: batchTemplates,
        batch_size: batchSize,
        resolution,
        inspo_image_urls: selectedInspo,
      }),
    });

    if (!res.ok || !res.body) {
      const d = await res.json().catch(() => ({}));
      setGenError(d.error ?? "Batch generation failed.");
      setGenerating(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6).trim()) as { type: string; done?: number; total?: number };
          if (event.type === "progress") {
            setOverlayProgress(Math.round(((event.done ?? 0) / (event.total ?? batchSize)) * 100));
            setOverlayMessage(`Generating ads... (${event.done}/${event.total})`);
          } else if (event.type === "complete") {
            setOverlayProgress(100);
            setOverlayMessage("Done!");
            await new Promise((r) => setTimeout(r, 500));
            setGenerating(false);
            setGenDone(true);
          }
        } catch { /* ignore */ }
      }
    }
    setGenerating(false);
  }, [id, selectedProductIds, batchTemplates, batchSize, resolution, selectedInspo]);

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>;
  if (!brand) return null;

  return (
    <div>
      <GeneratingOverlay visible={generating} progress={overlayProgress} message={overlayMessage} />

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link href="/stores" className="hover:text-gray-700 dark:hover:text-gray-200">{t("nav.stores")}</Link>
        <span>/</span>
        <Link href={`/brands/${id}`} className="hover:text-gray-700 dark:hover:text-gray-200">{brand.name}</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">{t("ads.title")}</span>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("ads.title")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{brand.name}</p>
        </div>
        <Link href={`/brands/${id}/gallery`}
          className="rounded-full bg-[#C7F56F] px-4 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors">
          {t("ads.viewGallery")}
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">

        {/* Product selection */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t("ads.selectProducts")} <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(max 3)</span>
          </p>
          {products.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("ads.noProducts")}{" "}
              <Link href={`/brands/${id}/products/new`} className="text-[#C7F56F] hover:underline">{t("ads.addProductFirst")}</Link>
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {products.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                const isDisabled = !isSelected && selectedProductIds.length >= 3;
                const thumb = p.image_urls?.[0];
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProductSelect(p.id)}
                    disabled={isDisabled}
                    title={isDisabled ? "Max 3 products" : undefined}
                    className={`group relative flex flex-col rounded-xl border-2 overflow-hidden transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-28 ${
                      isSelected
                        ? "border-[#C7F56F]"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="aspect-square w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      {thumb ? (
                        <Image src={thumb} alt={p.name} width={112} height={112}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl text-gray-300 dark:text-gray-600">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={`px-2 py-1.5 ${isSelected ? "bg-[#C7F56F]/10" : ""}`}>
                      <p className="text-[11px] font-semibold text-gray-800 dark:text-white truncate">{p.name}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#C7F56F] text-[#1a1a1a] text-[10px] font-bold shadow-sm">✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {selectedProductIds.length >= 3 && (
            <p className="mt-1.5 text-xs text-amber-500 dark:text-amber-400">{t("ads.maxSelected")}</p>
          )}
        </div>

        {/* Settings — only when products selected */}
        {selectedProductIds.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-5">

            {/* Regular / Batch toggle */}
            <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
              {(["regular", "batch"] as const).map((m) => (
                <button key={m} onClick={() => setAdMode(m)}
                  className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-colors capitalize ${adMode === m ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
                  {m}
                </button>
              ))}
            </div>

            {adMode === "regular" && (
              <div className="space-y-5">
                {/* Templates */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t("ads.templates")}</p>
                  <div className="grid grid-cols-5 gap-2">
                    {AD_TEMPLATES.map((t) => (
                      <button key={t.number} onClick={() => toggleTemplate(t.number)}
                        className={`group relative flex flex-col rounded-xl border-2 overflow-hidden transition-colors ${selectedTemplates.includes(t.number) ? "border-[#C7F56F]" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                        <div className="aspect-[4/5] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <Image src={t.thumb} alt={t.label} width={120} height={150}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className={`px-2 py-1.5 ${selectedTemplates.includes(t.number) ? "bg-[#C7F56F]/10" : ""}`}>
                          <p className="text-[11px] font-semibold text-gray-800 dark:text-white truncate">{t.label}</p>
                        </div>
                        {selectedTemplates.includes(t.number) && (
                          <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C7F56F] text-[#1a1a1a] text-[9px] font-bold">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t("ads.generationModel")}</p>
                  <div className="flex gap-2">
                    {(Object.entries(MODEL_CONFIGS) as [KieModel, typeof MODEL_CONFIGS[KieModel]][]).map(([key, cfg]) => (
                      <button key={key} onClick={() => selectModel(key)}
                        className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors ${model === key ? "border-[#C7F56F] bg-[#C7F56F]/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className={`text-sm font-semibold ${model === key ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"}`}>{cfg.label}</span>
                          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400">{cfg.creditsPerImage} credit{cfg.creditsPerImage !== 1 ? "s" : ""}/img</span>
                        </div>
                        <span className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{cfg.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variants */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t("ads.imagesPerTemplate")}</p>
                  <div className="flex gap-2">
                    {[1, 2, 4].map((n) => (
                      <button key={n} onClick={() => setNumImages(n)}
                        className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${numImages === n ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background / Environment */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t("ads.background")} <span className="font-normal text-gray-400 dark:text-gray-500">{t("ads.optional")}</span></p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={backgroundIntent}
                      onChange={(e) => setBackgroundIntent(e.target.value)}
                      placeholder={t("ads.backgroundPlaceholder")}
                      className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#C7F56F] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const pick = BACKGROUND_PRESETS[Math.floor(Math.random() * BACKGROUND_PRESETS.length)];
                        setBackgroundIntent(pick);
                      }}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors whitespace-nowrap"
                    >
                      {t("ads.suggestions")}
                    </button>
                  </div>
                </div>

                {/* Inspo */}
                <InspoPicker brandId={id} type="ad" selected={selectedInspo} onSelect={setSelectedInspo} />

                {/* Credit estimate */}
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedTemplates.length} template{selectedTemplates.length !== 1 ? "s" : ""} × {numImages} image{numImages !== 1 ? "s" : ""} × {creditCost} credit{creditCost !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{estimatedCredits} credits</p>
                </div>

                {genError && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{genError}</div>}

                {genSubmitted && !genDone && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <svg className="h-4 w-4 animate-spin text-[#C7F56F] flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{t("ads.generating")}</p>
                    </div>
                    <Link href={`/brands/${id}/gallery`} className="rounded-full bg-[#C7F56F] px-3 py-1 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors whitespace-nowrap flex-shrink-0">{t("ads.viewGallery")}</Link>
                  </div>
                )}

                {genDone && (
                  <div className="rounded-xl bg-[#C7F56F]/10 border border-[#C7F56F]/30 px-4 py-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{t("ads.adsReady")}</p>
                    <Link href={`/brands/${id}/gallery`} className="text-xs font-semibold text-[#C7F56F] hover:underline">{t("ads.viewGallery")}</Link>
                  </div>
                )}

                <button onClick={handleGenerateRegular} disabled={generating || selectedTemplates.length === 0}
                  className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed">
                  {t("ads.generateAds")}
                </button>
              </div>
            )}

            {adMode === "batch" && (
              <div className="space-y-5">
                {/* Warning */}
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
                  <svg className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    <strong>{lang === "nl" ? "Batchmodus" : "Batch mode"}</strong> {lang === "nl" ? "genereert automatisch veel unieke advertenties met AI. Resultaten kunnen variëren. Verbruikt aanzienlijk meer generaties." : "uses AI to generate many unique ads automatically. Results may vary. Uses significantly more credits."}
                  </p>
                </div>

                {/* Templates */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t("ads.allowedTemplates")} <span className="text-gray-400 dark:text-gray-500 font-normal">{t("ads.allowedTemplatesNote")}</span></p>
                  <div className="grid grid-cols-5 gap-2">
                    {AD_TEMPLATES.map((t) => (
                      <button key={t.name} onClick={() => toggleBatchTemplate(t.name)}
                        className={`group relative flex flex-col rounded-xl border-2 overflow-hidden transition-colors ${batchTemplates.includes(t.name) ? "border-[#C7F56F]" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                        <div className="aspect-[4/5] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <Image src={t.thumb} alt={t.label} width={120} height={150}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className={`px-2 py-1.5 ${batchTemplates.includes(t.name) ? "bg-[#C7F56F]/10" : ""}`}>
                          <p className="text-[11px] font-semibold text-gray-800 dark:text-white truncate">{t.label}</p>
                        </div>
                        {batchTemplates.includes(t.name) && (
                          <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C7F56F] text-[#1a1a1a] text-[9px] font-bold">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Batch size */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t("ads.batchSize")}</p>
                  <div className="flex gap-2">
                    {([10, 20, 50] as const).map((n) => (
                      <button key={n} onClick={() => setBatchSize(n)}
                        className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${batchSize === n ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variants — greyed out */}
                <div className="opacity-40 pointer-events-none">
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{t("ads.imagesPerTemplate")}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t("ads.batchVariantsNote")}</p>
                </div>

                {/* Inspo */}
                <InspoPicker brandId={id} type="ad" selected={selectedInspo} onSelect={setSelectedInspo} />

                {/* Credit estimate */}
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {batchSize} images × 2 credits (Quality model)
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{batchSize * 2} credits</p>
                </div>

                {genError && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{genError}</div>}

                {genDone && (
                  <div className="rounded-xl bg-[#C7F56F]/10 border border-[#C7F56F]/30 px-4 py-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{t("ads.batchComplete")}</p>
                    <Link href={`/brands/${id}/gallery`} className="text-xs font-semibold text-[#C7F56F] hover:underline">{t("ads.viewGallery")}</Link>
                  </div>
                )}

                <button onClick={handleGenerateBatch} disabled={generating || batchTemplates.length === 0}
                  className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed">
                  {t("ads.generateBatch")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ad Inspo Library */}
      <details className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <summary className="cursor-pointer px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none hover:text-gray-600 dark:hover:text-gray-300">
          {t("ads.inspoLibrary")}
        </summary>
        <div className="border-t border-gray-100 dark:border-gray-800 p-5">
          <InspoLibrary brandId={id} type="ad" label={t("ads.inspoLibraryLabel")} />
        </div>
      </details>
    </div>
  );
}
