"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import type { Brand, BrandDna, Product, VideoJob } from "@/types";
import type { VideoStyle, VideoPlatform } from "@/lib/video-prompt-generator";

// ─── Brand Picker ─────────────────────────────────────────────────────────────

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

// ─── Video Panel ─────────────────────────────────────────────────────────────

const VIDEO_STYLES: Array<{ value: VideoStyle; label: string; labelNl: string; desc: string; descNl: string; icon: string }> = [
  { value: "ugc", label: "UGC", labelNl: "UGC", desc: "Authentic creator-style, handheld", descNl: "Authentieke creator-stijl, handgehouden", icon: "📱" },
  { value: "lifestyle", label: "Lifestyle", labelNl: "Lifestyle", desc: "Real-world, aspirational scene", descNl: "Echte wereld, inspirerende scène", icon: "✨" },
  { value: "product-hero", label: "Product Hero", labelNl: "Product Hero", desc: "Cinematic product reveal", descNl: "Cinematische productpresentatie", icon: "🎬" },
];

const PLATFORMS: Array<{ value: VideoPlatform; label: string; icon: string }> = [
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "instagram-reels", label: "Reels", icon: "📸" },
  { value: "youtube-shorts", label: "Shorts", icon: "▶️" },
];

const STATUS_LABELS: Record<string, { en: string; nl: string }> = {
  pending:           { en: "Starting...",           nl: "Starten..." },
  generating_scenes: { en: "Generating scene frames...", nl: "Scèneframes genereren..." },
  generating_video:  { en: "Rendering video with Seedance 2...", nl: "Video renderen met Seedance 2..." },
  done:              { en: "Done!",                 nl: "Klaar!" },
  failed:            { en: "Generation failed",     nl: "Generatie mislukt" },
};

function VideoPanel({
  brand,
  products,
}: {
  brand: Brand;
  products: Product[];
}) {
  const { lang } = useLanguage();
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id ?? "");
  const [videoStyle, setVideoStyle] = useState<VideoStyle>("ugc");
  const [platform, setPlatform] = useState<VideoPlatform>("tiktok");
  const [duration, setDuration] = useState<5 | 10 | 15>(15);
  const [includesPerson, setIncludesPerson] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [sceneUrls, setSceneUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pollJob = useCallback((id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/brands/${brand.id}/video?job_id=${id}`);
        if (!res.ok) return;
        const job: VideoJob = await res.json();
        setJobStatus(job.status);
        if (job.scene_image_urls?.length) setSceneUrls(job.scene_image_urls);
        if (job.status === "done") {
          clearInterval(interval);
          setVideoUrl(job.video_url);
          setLoading(false);
        } else if (job.status === "failed") {
          clearInterval(interval);
          setError(job.error_msg ?? (lang === "nl" ? "Generatie mislukt." : "Generation failed."));
          setLoading(false);
        }
      } catch {
        // keep polling
      }
    }, 5000);
    return interval;
  }, [brand.id, lang]);

  async function handleGenerate() {
    if (!selectedProductId) return;
    setLoading(true);
    setError(null);
    setJobId(null);
    setJobStatus(null);
    setVideoUrl(null);
    setSceneUrls([]);

    const res = await fetch(`/api/brands/${brand.id}/video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: selectedProductId,
        video_style: videoStyle,
        platform,
        duration,
        includes_person: includesPerson,
      }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Failed to start video generation.");
      setLoading(false);
      return;
    }

    const { job_id } = await res.json() as { job_id: string };
    setJobId(job_id);
    setJobStatus("pending");
    pollJob(job_id);
  }

  const statusLabel = jobStatus
    ? (STATUS_LABELS[jobStatus]?.[lang] ?? jobStatus)
    : null;

  return (
    <div className="space-y-6">
      {/* Product */}
      {products.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {lang === "nl" ? "Product" : "Product"}
          </p>
          <div className="flex flex-wrap gap-2">
            {products.map(p => {
              const selected = selectedProductId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`relative flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-colors ${
                    selected ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {p.image_urls?.[0] && (
                    <Image src={p.image_urls[0]} alt="" width={20} height={20} className="rounded-md object-cover flex-shrink-0" unoptimized />
                  )}
                  {p.name}
                  {selected && <span className="ml-1 text-[#C7F56F]">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Video Style */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          {lang === "nl" ? "Videostijl" : "Video style"}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {VIDEO_STYLES.map(s => (
            <button
              key={s.value}
              onClick={() => setVideoStyle(s.value)}
              className={`flex flex-col rounded-xl border-2 p-3 text-left transition-colors ${
                videoStyle === s.value ? "border-[#C7F56F] bg-[#C7F56F]/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <span className="text-lg mb-1">{s.icon}</span>
              <span className={`text-xs font-semibold ${videoStyle === s.value ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"}`}>
                {lang === "nl" ? s.labelNl : s.label}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">
                {lang === "nl" ? s.descNl : s.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Platform + Duration + Person */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Platform</p>
          <div className="flex flex-col gap-1.5">
            {PLATFORMS.map(p => (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  platform === p.value ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                <span>{p.icon}</span>{p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {lang === "nl" ? "Duur" : "Duration"}
          </p>
          <div className="flex flex-col gap-1.5">
            {([5, 10, 15] as const).map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  duration === d ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {lang === "nl" ? "Persoon" : "Person"}
          </p>
          <div className="flex flex-col gap-1.5">
            {[
              { v: true,  label: lang === "nl" ? "Met persoon" : "With person" },
              { v: false, label: lang === "nl" ? "Alleen product" : "Product only" },
            ].map(opt => (
              <button
                key={String(opt.v)}
                onClick={() => setIncludesPerson(opt.v)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors text-left ${
                  includesPerson === opt.v ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Status + progress */}
      {jobId && jobStatus && jobStatus !== "done" && jobStatus !== "failed" && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin text-[#C7F56F] flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-300">{statusLabel}</p>
          </div>

          {/* Scene frames preview */}
          {sceneUrls.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5">
                {lang === "nl" ? "Scèneframes gegenereerd:" : "Scene frames generated:"}
              </p>
              <div className="flex gap-1.5">
                {sceneUrls.map((url, i) => (
                  <Image
                    key={i}
                    src={url}
                    alt={`Scene ${i + 1}`}
                    width={48}
                    height={72}
                    className="rounded-lg object-cover"
                    unoptimized
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Done — video */}
      {videoUrl && (
        <div className="rounded-xl border border-[#C7F56F]/30 bg-[#C7F56F]/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {lang === "nl" ? "Video klaar!" : "Video ready!"}
          </p>
          <video
            src={videoUrl}
            controls
            playsInline
            className="w-full max-w-xs rounded-xl mx-auto block"
          />
          <a
            href={videoUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]"
          >
            {lang === "nl" ? "Download video" : "Download video"}
          </a>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || !selectedProductId}
        className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading
          ? (lang === "nl" ? "Genereren..." : "Generating...")
          : (lang === "nl" ? "Genereer Video" : "Generate Video")}
      </button>

      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
        {lang === "nl"
          ? "Video generatie duurt 3-8 minuten. Scèneframes worden eerst gemaakt met Nano Banana 2, daarna animeerd Seedance 2 de video. Je kunt de pagina openlaten — de status wordt automatisch bijgewerkt."
          : "Video generation takes 3-8 minutes. Scene frames are first created with Nano Banana 2, then Seedance 2 animates the final video. Keep this page open — status updates automatically."}
      </p>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GenerationVideoPage() {
  const { lang } = useLanguage();
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [dna, setDna] = useState<BrandDna | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingBrand, setLoadingBrand] = useState(false);

  async function handleSelectBrand(brand: Brand) {
    setSelectedBrand(brand);
    setLoadingBrand(true);
    const [brandRes, prodsRes] = await Promise.all([
      fetch(`/api/brands/${brand.id}`),
      fetch(`/api/brands/${brand.id}/products`),
    ]);
    const brandJson = await brandRes.json();
    const prods = await prodsRes.json();
    setDna(brandJson.brand_dna ?? null);
    setProducts(Array.isArray(prods) ? prods : []);
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
        <span className="text-gray-700 dark:text-gray-200 font-medium">Video</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {lang === "nl"
            ? "15-seconde UGC en lifestyle videos voor TikTok en Reels — gegenereerd met Seedance 2"
            : "15-second UGC and lifestyle videos for TikTok and Reels — powered by Seedance 2"}
        </p>
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
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {lang === "nl" ? "Geen producten gevonden." : "No products found."}
            </p>
            <Link href={`/brands/${selectedBrand.id}/products/new`} className="text-[#C7F56F] text-sm hover:underline">
              {lang === "nl" ? "Product toevoegen →" : "Add a product →"}
            </Link>
          </div>
        ) : (
          <div>
            {/* Brand header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C7F56F]/20 text-sm font-bold text-[#1a1a1a] dark:text-[#C7F56F]">
                  {selectedBrand.name[0]}
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedBrand.name}</span>
              </div>
              <button
                onClick={() => { setSelectedBrand(null); setDna(null); setProducts([]); }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {lang === "nl" ? "Wijzigen" : "Change"}
              </button>
            </div>

            <VideoPanel brand={selectedBrand} products={products} />
          </div>
        )}
      </div>
    </div>
  );
}
