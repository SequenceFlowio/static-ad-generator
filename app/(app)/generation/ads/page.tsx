"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import GeneratingOverlay from "@/components/GeneratingOverlay";
import { useLanguage } from "@/components/LanguageProvider";
import { resolveAdConfig, AD_GOALS, type AdGoal } from "@/lib/resolve-creative-config";
import type { Brand, BrandDna, Product, CreativeStrategy, KieModel } from "@/types";

type Mode = "quick" | "advanced";

// ─── Brand Picker ────────────────────────────────────────────────────────────

function BrandPicker({ onSelect }: { onSelect: (b: Brand) => void }) {
  const { lang } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/brands").then(r => r.json()).then(d => {
      setBrands(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>;

  if (brands.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {lang === "nl" ? "Geen stores gevonden." : "No stores found."}
        </p>
        <Link href="/stores" className="rounded-full bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
          {lang === "nl" ? "Store aanmaken" : "Create a store"}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {lang === "nl" ? "Kies een store" : "Choose a store"}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {brands.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelect(b)}
            className="rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 text-left transition-all hover:border-[#C7F56F] hover:shadow-sm"
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{b.name}</p>
            {b.url && <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{b.url}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Quick Mode ───────────────────────────────────────────────────────────────

function QuickAdsPanel({
  brand,
  products,
  strategy,
  userPlan,
}: {
  brand: Brand;
  products: Product[];
  strategy: CreativeStrategy | null;
  userPlan: string;
}) {
  const { lang } = useLanguage();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [goal, setGoal] = useState<AdGoal>("test-creatives");
  const [activeAngleKey, setActiveAngleKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [overlayProgress, setOverlayProgress] = useState(0);
  const [overlayMessage, setOverlayMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);

  const isPaid = userPlan !== "trial" && userPlan !== "free";
  const resolution = isPaid ? "4K" : "1K";
  const model: KieModel = "nano-banana-2";

  function toggleProduct(id: string) {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : prev.length >= 3 ? prev : [...prev, id]
    );
  }

  const handleGenerate = useCallback(async () => {
    if (selectedProductIds.length === 0) return;
    setGenerating(true);
    setError(null);
    setDone(false);
    setSubmitted(false);
    setOverlayProgress(10);
    setOverlayMessage(lang === "nl" ? "Concepten genereren..." : "Generating ad concepts...");

    const config = resolveAdConfig(goal);

    const promptRes = await fetch(`/api/brands/${brand.id}/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_ids: selectedProductIds,
        product_id: selectedProductIds[0],
        num_variants: 2,
        template_numbers: config.templateNumbers,
        awareness_level: config.awarenessLevel,
        active_angle_key: activeAngleKey,
        hook_intent: config.toneDirection,
      }),
    });

    if (!promptRes.ok) {
      const d = await promptRes.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Failed to generate concepts.");
      setGenerating(false);
      return;
    }

    const { prompt_set } = await promptRes.json();
    setOverlayProgress(40);
    setOverlayMessage(lang === "nl" ? "Ads aanmaken..." : "Creating your ads…");

    const genRes = await fetch(`/api/brands/${brand.id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_numbers: config.templateNumbers,
        resolution,
        num_images: 2,
        prompt_set_id: prompt_set.id,
        model,
        inspo_image_urls: [],
        product_ids: selectedProductIds,
      }),
    });

    if (!genRes.ok) {
      const d = await genRes.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Generation failed.");
      setGenerating(false);
      return;
    }

    const { job_ids } = await genRes.json();
    const total = job_ids.length;
    setGenerating(false);
    setSubmitted(true);

    const poll = async () => {
      try {
        const res = await fetch(`/api/brands/${brand.id}/jobs?prompt_set_id=${prompt_set.id}`);
        if (!res.ok) { setTimeout(poll, 5000); return; }
        const jobs = await res.json();
        const finished = (jobs as { status: string }[]).filter(j => j.status === "done" || j.status === "failed").length;
        if (finished < total) setTimeout(poll, 4000);
        else setDone(true);
      } catch { setTimeout(poll, 5000); }
    };
    poll();
  }, [brand.id, selectedProductIds, goal, activeAngleKey, resolution, lang]);

  return (
    <div className="space-y-6">
      <GeneratingOverlay visible={generating} progress={overlayProgress} message={overlayMessage} />

      {/* Product */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          {lang === "nl" ? "Product" : "Product"} <span className="text-gray-400">(max 3)</span>
        </p>
        {products.length === 0 ? (
          <p className="text-xs text-gray-400">
            {lang === "nl" ? "Geen producten. " : "No products. "}
            <Link href={`/brands/${brand.id}/products/new`} className="text-[#C7F56F] hover:underline">
              {lang === "nl" ? "Product toevoegen" : "Add one"}
            </Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {products.map(p => {
              const selected = selectedProductIds.includes(p.id);
              const disabled = !selected && selectedProductIds.length >= 3;
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  disabled={disabled}
                  className={`relative flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 ${
                    selected ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {p.image_urls?.[0] && (
                    <Image src={p.image_urls[0]} alt="" width={20} height={20} className="rounded-md object-cover flex-shrink-0" />
                  )}
                  {p.name}
                  {selected && <span className="ml-1 text-[#C7F56F]">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Goal */}
      <div>
        <p className="mb-3 text-xs font-medium text-gray-500 dark:text-gray-400">
          {lang === "nl" ? "Wat is je doel?" : "What is your goal?"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {AD_GOALS.map(g => (
            <button
              key={g.value}
              onClick={() => setGoal(g.value)}
              className={`flex flex-col rounded-xl border-2 p-3 text-left transition-colors ${
                goal === g.value ? "border-[#C7F56F] bg-[#C7F56F]/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <span className="text-base mb-1">{g.icon}</span>
              <span className={`text-xs font-semibold ${goal === g.value ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"}`}>{g.label}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">{g.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Creative angle (if strategy has angles) */}
      {strategy && strategy.creative_angles.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {lang === "nl" ? "Creatieve invalshoek" : "Creative angle"}{" "}
            <span className="font-normal text-gray-400">{lang === "nl" ? "(optioneel)" : "(optional)"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {strategy.creative_angles.map(a => (
              <button
                key={a.key}
                title={a.description}
                onClick={() => setActiveAngleKey(activeAngleKey === a.key ? null : a.key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  activeAngleKey === a.key ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* What gets auto-set */}
      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-xs text-gray-400 dark:text-gray-500 space-y-0.5">
        <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">
          {lang === "nl" ? "Automatisch ingesteld:" : "Auto-configured:"}
        </p>
        <p>Templates: {resolveAdConfig(goal).templateNumbers.map(n => ["Headline","Offer","Testimonial","Vs Them","UGC"][n-1]).join(", ")}</p>
        <p>Awareness: {resolveAdConfig(goal).awarenessLevel}</p>
        <p>Variants: 2 per template</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

      {submitted && !done && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin text-[#C7F56F]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {lang === "nl" ? "Genereren loopt op de achtergrond…" : "Generating in background…"}
            </p>
          </div>
          <Link href={`/brands/${brand.id}/gallery`} className="rounded-full bg-[#C7F56F] px-3 py-1 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] whitespace-nowrap flex-shrink-0">
            {lang === "nl" ? "Bekijk gallery" : "View Gallery"}
          </Link>
        </div>
      )}

      {done && (
        <div className="rounded-xl bg-[#C7F56F]/10 border border-[#C7F56F]/30 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-800 dark:text-white">
            {lang === "nl" ? "Ads klaar!" : "Ads ready!"}
          </p>
          <Link href={`/brands/${brand.id}/gallery`} className="text-xs font-semibold text-[#C7F56F] hover:underline">
            {lang === "nl" ? "Bekijk gallery →" : "View Gallery →"}
          </Link>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating || selectedProductIds.length === 0}
        className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {lang === "nl" ? "Genereer Ads" : "Generate Ads"}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GenerationAdsPage() {
  const { lang } = useLanguage();
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [dna, setDna] = useState<BrandDna | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [strategy, setStrategy] = useState<CreativeStrategy | null>(null);
  const [userPlan, setUserPlan] = useState("trial");
  const [mode, setMode] = useState<Mode>("quick");
  const [loadingBrand, setLoadingBrand] = useState(false);

  useEffect(() => {
    fetch("/api/credits").then(r => r.json()).then(d => { if (d.plan) setUserPlan(d.plan); }).catch(() => {});
  }, []);

  async function handleSelectBrand(brand: Brand) {
    setSelectedBrand(brand);
    setLoadingBrand(true);
    const [brandRes, prodsRes, stratRes] = await Promise.all([
      fetch(`/api/brands/${brand.id}`),
      fetch(`/api/brands/${brand.id}/products`),
      fetch(`/api/brands/${brand.id}/creative-strategy`),
    ]);
    const brandJson = await brandRes.json();
    const prods = await prodsRes.json();
    setDna(brandJson.brand_dna ?? null);
    setProducts(Array.isArray(prods) ? prods : []);
    if (stratRes.ok) {
      const s = await stratRes.json();
      setStrategy(s.strategy ?? null);
    }
    setLoadingBrand(false);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link href="/generation" className="hover:text-gray-700 dark:hover:text-gray-200">
          {lang === "nl" ? "Genereren" : "Generate"}
        </Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">Ads</span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ads</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {lang === "nl" ? "Hoge-conversie creatives voor betaalde campagnes" : "High-converting creatives for paid campaigns"}
          </p>
        </div>
        {selectedBrand && (
          <div className="flex items-center gap-2">
            {dna && (
              <Link href={`/brands/${selectedBrand.id}/strategy`}
                className="rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-gray-300 transition-colors">
                {lang === "nl" ? "Strategie" : "Strategy"}
              </Link>
            )}
            <Link href={`/brands/${selectedBrand.id}/gallery`}
              className="rounded-full bg-[#C7F56F] px-4 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors">
              {lang === "nl" ? "Gallery" : "Gallery"}
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        {!selectedBrand ? (
          <BrandPicker onSelect={handleSelectBrand} />
        ) : loadingBrand ? (
          <p className="text-sm text-gray-400 py-6 text-center">Loading…</p>
        ) : !dna ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {lang === "nl" ? "Brand DNA ontbreekt." : "Brand DNA missing."}
            </p>
            <Link href={`/brands/${selectedBrand.id}`} className="text-[#C7F56F] text-sm hover:underline">
              {lang === "nl" ? "Brand DNA instellen →" : "Set up Brand DNA →"}
            </Link>
          </div>
        ) : (
          <div>
            {/* Brand header + change */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C7F56F]/20 text-sm font-bold text-[#1a1a1a] dark:text-[#C7F56F]">
                  {selectedBrand.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedBrand.name}</span>
              </div>
              <button
                onClick={() => { setSelectedBrand(null); setDna(null); setProducts([]); setStrategy(null); }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
              >
                {lang === "nl" ? "Wijzigen" : "Change"}
              </button>
            </div>

            {/* Mode toggle */}
            <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
              {(["quick", "advanced"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`rounded-lg px-5 py-1.5 text-sm font-medium capitalize transition-colors ${mode === m ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
                  {m === "quick" ? (lang === "nl" ? "Snel" : "Quick") : (lang === "nl" ? "Geavanceerd" : "Advanced")}
                </button>
              ))}
            </div>

            {mode === "quick" ? (
              <QuickAdsPanel
                brand={selectedBrand}
                products={products}
                strategy={strategy}
                userPlan={userPlan}
              />
            ) : (
              /* Advanced mode: full existing page */
              <div className="space-y-4">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3 flex items-center justify-between gap-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {lang === "nl"
                      ? "Geavanceerde modus met alle opties, templates en instellingen."
                      : "Advanced mode with all options, templates, and controls."}
                  </p>
                  <Link
                    href={`/brands/${selectedBrand.id}/ads`}
                    className="rounded-full bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    {lang === "nl" ? "Open volledig →" : "Open full UI →"}
                  </Link>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {lang === "nl"
                    ? "Templates, model, varianten, awareness, desire, strategie-invalshoeken en inspo."
                    : "Templates, model, variants, awareness, desire, strategy angles, and inspo."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
