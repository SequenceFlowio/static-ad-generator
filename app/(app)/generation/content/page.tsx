"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import GeneratingOverlay from "@/components/GeneratingOverlay";
import ContentGenerator from "@/components/content/ContentGenerator";
import { useLanguage } from "@/components/LanguageProvider";
import { useBrand } from "@/lib/brand-context";
import { resolveContentConfig, CONTENT_GOALS, type ContentGoal } from "@/lib/resolve-creative-config";
import { PLATFORMS } from "@/lib/content-templates";
import type { Brand, BrandDna, BrandDnaData, Product, CreativeStrategy } from "@/types";
import type { Platform } from "@/lib/content-templates";

type Mode = "quick" | "advanced";

// ─── Quick Mode ───────────────────────────────────────────────────────────────

function QuickContentPanel({
  brand,
  brandDna,
  products,
  strategy,
}: {
  brand: Brand;
  brandDna: BrandDnaData;
  products: Product[];
  strategy: CreativeStrategy | null;
}) {
  const { lang } = useLanguage();
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [contentGoal, setContentGoal] = useState<ContentGoal>("brand-awareness");
  const [activeAngleKey, setActiveAngleKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [overlayProgress, setOverlayProgress] = useState(0);
  const [overlayMessage, setOverlayMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const PLATFORM_LABELS: Record<Platform, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    pinterest: "Pinterest",
  };

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setDone(false);
    setOverlayProgress(15);
    setOverlayMessage(lang === "nl" ? "Copy genereren..." : "Generating copy...");

    const config = resolveContentConfig(contentGoal);
    const needsProduct = config.templateName === "about-product" || config.templateName === "using-product";
    const selectedProduct = needsProduct ? products[0] : null;

    const contentRes = await fetch(`/api/brands/${brand.id}/content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_name: config.templateName,
        platform,
        product_id: selectedProduct?.id ?? null,
        selected_desire: brandDna.customer_desires?.[0] ?? null,
        topic_hint: null,
        variation_index: 0,
        total_count: 1,
      }),
    });

    if (!contentRes.ok) {
      const d = await contentRes.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Content generation failed.");
      setGenerating(false);
      return;
    }

    const session = await contentRes.json();
    setOverlayProgress(55);
    setOverlayMessage(lang === "nl" ? "Afbeelding genereren..." : "Generating image...");

    const genRes = await fetch(`/api/brands/${brand.id}/content/${session.id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inspo_image_urls: [] }),
    });

    if (!genRes.ok) {
      const d = await genRes.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Image generation failed.");
      setGenerating(false);
      return;
    }

    setOverlayProgress(100);
    setGenerating(false);
    setDone(true);
  }, [brand.id, platform, contentGoal, brandDna, products, lang]);

  return (
    <div className="space-y-6">
      <GeneratingOverlay visible={generating} progress={overlayProgress} message={overlayMessage} />

      {/* Platform */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          {lang === "nl" ? "Platform" : "Platform"}
        </p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p.value}
              onClick={() => setPlatform(p.value as Platform)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                platform === p.value ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
              }`}
            >
              {PLATFORM_LABELS[p.value as Platform] ?? p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content goal */}
      <div>
        <p className="mb-3 text-xs font-medium text-gray-500 dark:text-gray-400">
          {lang === "nl" ? "Wat is je doel?" : "What is your goal?"}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CONTENT_GOALS.map(g => (
            <button
              key={g.value}
              onClick={() => setContentGoal(g.value)}
              className={`flex flex-col rounded-xl border-2 p-3 text-left transition-colors ${
                contentGoal === g.value ? "border-[#C7F56F] bg-[#C7F56F]/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <span className="text-base mb-1">{g.icon}</span>
              <span className={`text-xs font-semibold ${contentGoal === g.value ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"}`}>{g.label}</span>
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

      {/* Auto-configured summary */}
      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-xs text-gray-400 dark:text-gray-500 space-y-0.5">
        <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">
          {lang === "nl" ? "Automatisch ingesteld:" : "Auto-configured:"}
        </p>
        <p>Template: {resolveContentConfig(contentGoal).templateName}</p>
        <p>Platform: {PLATFORM_LABELS[platform]}</p>
        <p>Desire: {brandDna.customer_desires?.[0] ?? "from brand DNA"}</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

      {done && (
        <div className="rounded-xl bg-[#C7F56F]/10 border border-[#C7F56F]/30 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-800 dark:text-white">
            {lang === "nl" ? "Content klaar!" : "Content ready!"}
          </p>
          <Link href={`/brands/${brand.id}/content-gallery`} className="text-xs font-semibold text-[#C7F56F] hover:underline">
            {lang === "nl" ? "Bekijk content →" : "View Content →"}
          </Link>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {lang === "nl" ? "Genereer Content" : "Generate Content"}
      </button>
    </div>
  );
}

// ─── Recent Sessions Strip ────────────────────────────────────────────────────

interface ContentSessionItem {
  id: string;
  template_name: string;
  platform: string;
  caption: string | null;
  image_url: string | null;
  created_at: string;
  product_id: string | null;
}

function RecentContentSessions({ brandId }: { brandId: string }) {
  const { lang } = useLanguage();
  const [sessions, setSessions] = useState<ContentSessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/brands/${brandId}/content`)
      .then(r => r.json())
      .then(d => { setSessions(Array.isArray(d) ? d.slice(0, 6) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [brandId]);

  if (loading || sessions.length === 0) return null;

  function relativeDate(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (h < 1) return lang === "nl" ? "Zojuist" : "Just now";
    if (h < 24) return lang === "nl" ? `${h}u geleden` : `${h}h ago`;
    return lang === "nl" ? `${d}d geleden` : `${d}d ago`;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          {lang === "nl" ? "Recente content" : "Recent content"}
        </p>
        <Link href={`/brands/${brandId}/content-gallery`}
          className="text-[10px] text-gray-400 hover:text-[#C7F56F] transition-colors">
          {lang === "nl" ? "Alle bekijken →" : "View all →"}
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {sessions.map(s => (
          <Link key={s.id} href={`/brands/${brandId}/content-gallery`}
            className="flex-shrink-0 group relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-[#C7F56F] transition-colors"
            style={{ width: 72 }}>
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
              {s.image_url ? (
                <Image src={s.image_url} alt={s.template_name} fill className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xl text-gray-300 dark:text-gray-600">
                  {s.platform === "instagram" ? "📷" : s.platform === "linkedin" ? "💼" : "📄"}
                </div>
              )}
            </div>
            <div className="px-1.5 py-1 bg-white dark:bg-gray-900">
              <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate">{s.template_name.replace(/-/g, " ")}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500">{relativeDate(s.created_at)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GenerationContentPage() {
  const { lang } = useLanguage();
  const { brand: selectedBrand, loading: brandCtxLoading } = useBrand();
  const [dna, setDna] = useState<BrandDna | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [strategy, setStrategy] = useState<CreativeStrategy | null>(null);
  const [mode, setMode] = useState<Mode>("quick");
  const [loadingBrand, setLoadingBrand] = useState(false);
  const loadedBrandIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedBrand || selectedBrand.id === loadedBrandIdRef.current) return;
    loadedBrandIdRef.current = selectedBrand.id;
    setLoadingBrand(true);
    Promise.all([
      fetch(`/api/brands/${selectedBrand.id}`),
      fetch(`/api/brands/${selectedBrand.id}/products`),
      fetch(`/api/brands/${selectedBrand.id}/creative-strategy`),
    ]).then(async ([brandRes, prodsRes, stratRes]) => {
      const brandJson = await brandRes.json();
      const prods = await prodsRes.json();
      setDna(brandJson.brand_dna ?? null);
      setProducts(Array.isArray(prods) ? prods : []);
      if (stratRes.ok) {
        const s = await stratRes.json();
        setStrategy(s.strategy ?? null);
      }
    }).finally(() => setLoadingBrand(false));
  }, [selectedBrand?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleContentCreated(_session: { id: string }) {}

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link href="/generation" className="hover:text-gray-700 dark:hover:text-gray-200">
          {lang === "nl" ? "Genereren" : "Generate"}
        </Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">Content</span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {lang === "nl" ? "Kant-en-klare organische posts met captions" : "Ready-to-post organic content with captions"}
          </p>
        </div>
        {selectedBrand && (
          <Link href={`/brands/${selectedBrand.id}/content-gallery`}
            className="rounded-full bg-[#C7F56F] px-4 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors">
            {lang === "nl" ? "Content gallery" : "Content Gallery"}
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        {brandCtxLoading || loadingBrand ? (
          <p className="text-sm text-gray-400 py-6 text-center">Loading…</p>
        ) : !selectedBrand ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            {lang === "nl" ? "Selecteer een brand via het menu linksonder." : "Select a brand from the bottom-left menu."}
          </p>
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
            </div>

            {/* Recent sessions */}
            <RecentContentSessions brandId={selectedBrand.id} />

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
              <QuickContentPanel
                brand={selectedBrand}
                brandDna={dna.data}
                products={products}
                strategy={strategy}
              />
            ) : (
              <ContentGenerator
                brandId={selectedBrand.id}
                brandDna={dna.data}
                products={products}
                onCreated={handleContentCreated}
                onClose={() => setMode("quick")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
