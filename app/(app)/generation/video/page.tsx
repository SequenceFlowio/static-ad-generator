"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import type { Brand, BrandDna, Product, SceneScript, VideoSession, CreativeStrategy, CreativeAngle } from "@/types";
import type { VideoStyle, VideoPlatform } from "@/lib/video-script-generator";

const AWARENESS_LEVELS = [
  { value: "unaware",        label: "Unaware",        labelNl: "Onbewust",         desc: "Geen probleem in beeld — pure curiosity hook", descNl: "Geen probleem in beeld — pure curiosity hook" },
  { value: "problem-aware",  label: "Problem-aware",  labelNl: "Probleembewust",   desc: "Herkent het probleem, zoekt nog oplossing", descNl: "Herkent het probleem, zoekt nog oplossing" },
  { value: "solution-aware", label: "Solution-aware", labelNl: "Oplossingsbewust", desc: "Weet dat oplossingen bestaan, vergelijkt", descNl: "Weet dat oplossingen bestaan, vergelijkt" },
  { value: "product-aware",  label: "Product-aware",  labelNl: "Productbewust",    desc: "Kent het product, overtuigd nog niet", descNl: "Kent het product, overtuigd nog niet" },
  { value: "most-aware",     label: "Most-aware",     labelNl: "Klaar om te kopen", desc: "Direct aanbod en urgentie werkt", descNl: "Direct aanbod en urgentie werkt" },
] as const;
type AwarenessLevel = typeof AWARENESS_LEVELS[number]["value"];

// ─── Suggestion prompts ───────────────────────────────────────────────────────

const CHARACTER_SUGGESTIONS = [
  "Woman, early 30s, warm natural skin, medium brown hair, wearing a beige linen shirt and cream pants, approachable smile",
  "Man, late 20s, athletic build, casual gray tee and dark jeans, clean grooming, confident",
  "Woman, mid-20s, curly dark hair, natural no-makeup look, wearing a white oversized tee, expressive",
  "Woman, 35-45, refined style, soft blonde highlights, light neutral outfit, warm and polished",
  "Man, 30s, dark skin tone, friendly expression, casual navy hoodie, relaxed energy",
  "Woman, late 20s, fair skin, straight black hair, minimal stylish outfit, modern aesthetic",
  "Man, early 30s, light stubble, creative casual style, rolled sleeves, relaxed confidence",
  "Woman, 20s, petite, Scandinavian look, natural makeup, soft earth tones, calm presence",
  "Man, 40s, distinguished salt-and-pepper stubble, relaxed open-collar shirt, approachable authority",
  "Woman, 28-35, fitness-focused, athletic wear, healthy glow, motivational energy",
];

const ENVIRONMENT_SUGGESTIONS = [
  "Modern minimalist kitchen, warm oak lower cabinets, white marble countertop, large window, warm morning light",
  "Cozy living room, natural linen couch, warm wood floor, soft indirect lighting, indoor plants",
  "Bright spa-like bathroom, white subway tiles, clean surfaces, soft diffused light from above",
  "Neutral home office, light wooden desk, warm lamp, organized minimal background",
  "Outdoor garden patio, warm golden afternoon light, natural greenery, relaxed summer feel",
  "Light airy bedroom, neutral linen bedding, sheer curtains, soft morning window light",
  "Open-plan modern apartment, high ceilings, white walls, minimal Scandinavian furniture, natural light",
  "Urban rooftop terrace, city skyline background, warm golden hour lighting",
  "Scandinavian-style interior, light pine wood, muted sage and cream tones, calm atmosphere",
  "Clean studio setup, neutral light gray gradient backdrop, professional soft-box lighting",
];

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
        <Link href="/stores" className="rounded-full bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a]">
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
          <button key={b.id} onClick={() => onSelect(b)}
            className="rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 text-left hover:border-[#C7F56F]">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{b.name}</p>
            {b.url && <p className="text-[11px] text-gray-400 truncate mt-0.5">{b.url}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Session helpers ─────────────────────────────────────────────────────────

function phaseToStep(phase: string): number {
  const map: Record<string, number> = {
    references: 1, script: 2, frames: 3, prompt: 4,
    generating_video: 5, done: 5, failed: 5,
  };
  return map[phase] ?? 0;
}

const PHASE_LABELS: Record<string, { nl: string; en: string; color: string }> = {
  references:       { nl: "Referenties",  en: "References",    color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  script:           { nl: "Script",       en: "Script",        color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  frames:           { nl: "Frames",       en: "Frames",        color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  prompt:           { nl: "Prompt",       en: "Prompt",        color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  generating_video: { nl: "Genereren…",   en: "Generating…",   color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  done:             { nl: "Klaar ✓",      en: "Done ✓",        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  failed:           { nl: "Mislukt",      en: "Failed",        color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
};

const STYLE_ICONS: Record<string, string> = { ugc: "📱", lifestyle: "✨", "product-hero": "🎬" };

interface SessionListItem {
  id: string;
  phase: string;
  video_style: string;
  platform: string;
  num_scenes: number;
  duration: number;
  created_at: string;
  video_url: string | null;
  product_id: string | null;
  includes_person: boolean;
  scenes: SceneScript[];
}

function VideoSessionPicker({
  brand, products, onResume, onStartNew,
}: {
  brand: Brand;
  products: Product[];
  onResume: (session: VideoSession) => void;
  onStartNew: () => void;
}) {
  const { lang } = useLanguage();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumingId, setResumingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/brands/${brand.id}/video-sessions`)
      .then(r => r.json())
      .then(d => { setSessions(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [brand.id]);

  function productName(productId: string | null) {
    if (!productId) return "—";
    return products.find(p => p.id === productId)?.name ?? "—";
  }

  function relativeDate(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (h < 1) return lang === "nl" ? "Zojuist" : "Just now";
    if (h < 24) return lang === "nl" ? `${h}u geleden` : `${h}h ago`;
    return lang === "nl" ? `${d}d geleden` : `${d}d ago`;
  }

  async function handleResume(s: SessionListItem) {
    setResumingId(s.id);
    const res = await fetch(`/api/brands/${brand.id}/video-sessions/${s.id}`);
    if (res.ok) {
      const { session } = await res.json() as { session: VideoSession };
      onResume(session);
    }
    setResumingId(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {lang === "nl" ? "Video generaties" : "Video generations"}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {lang === "nl" ? "Hervat een lopende generatie of start een nieuwe." : "Resume a recent session or start a new one."}
          </p>
        </div>
        <button onClick={onStartNew}
          className="rounded-lg bg-[#C7F56F] px-4 py-2 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
          {lang === "nl" ? "+ Nieuwe video" : "+ New video"}
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 py-4 text-center">Loading…</p>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {lang === "nl" ? "Nog geen video generaties" : "No video generations yet"}
          </p>
          <button onClick={onStartNew}
            className="rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
            {lang === "nl" ? "Eerste video starten →" : "Start first video →"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => {
            const phase = PHASE_LABELS[s.phase] ?? PHASE_LABELS.script;
            const isDone = s.phase === "done";
            const isFailed = s.phase === "failed";
            const isGenerating = s.phase === "generating_video";
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
                {/* Style icon */}
                <span className="text-xl flex-shrink-0">{STYLE_ICONS[s.video_style] ?? "🎬"}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                      {productName(s.product_id)}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 ${phase.color}`}>
                      {lang === "nl" ? phase.nl : phase.en}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {s.video_style} · {s.num_scenes} {lang === "nl" ? "scènes" : "scenes"} · {relativeDate(s.created_at)}
                  </p>
                </div>

                {/* Action */}
                {isDone && s.video_url ? (
                  <a href={s.video_url} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[10px] font-medium text-gray-600 dark:text-gray-300 hover:border-[#C7F56F]">
                    {lang === "nl" ? "Bekijken" : "View"}
                  </a>
                ) : isFailed ? (
                  <button onClick={() => handleResume(s)} disabled={!!resumingId}
                    className="flex-shrink-0 rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-[10px] font-medium text-red-500 hover:border-red-400 disabled:opacity-40">
                    {lang === "nl" ? "Opnieuw" : "Retry"}
                  </button>
                ) : (
                  <button onClick={() => handleResume(s)} disabled={!!resumingId}
                    className="flex-shrink-0 rounded-lg bg-[#C7F56F]/20 border border-[#C7F56F]/40 px-3 py-1.5 text-[10px] font-semibold text-gray-800 dark:text-white hover:bg-[#C7F56F]/40 disabled:opacity-40">
                    {resumingId === s.id
                      ? "…"
                      : isGenerating
                        ? (lang === "nl" ? "Volgen" : "Follow")
                        : (lang === "nl" ? "Hervatten →" : "Resume →")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-gray-400 dark:text-gray-500">
        {lang === "nl" ? "Sessies worden 7 dagen bewaard." : "Sessions are kept for 7 days."}
      </p>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ["Setup", "Referenties", "Script", "Frames", "Prompt", "Video"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-shrink-0">
          <div className={`flex items-center gap-1.5 ${i <= current ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"}`}>
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              i < current ? "bg-[#C7F56F] text-[#1a1a1a]" : i === current ? "bg-[#C7F56F]/20 text-gray-800 dark:text-white border-2 border-[#C7F56F]" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
            }`}>
              {i < current ? "✓" : i + 1}
            </div>
            <span className="text-xs font-medium hidden sm:inline">{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`mx-2 h-px w-6 sm:w-10 flex-shrink-0 ${i < current ? "bg-[#C7F56F]" : "bg-gray-200 dark:bg-gray-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 0: Setup ────────────────────────────────────────────────────────────

const VIDEO_STYLES: Array<{ value: VideoStyle; label: string; desc: string; icon: string }> = [
  { value: "ugc", label: "UGC", desc: "Authentic creator-style, handheld", icon: "📱" },
  { value: "lifestyle", label: "Lifestyle", desc: "Real-world aspirational scene", icon: "✨" },
  { value: "product-hero", label: "Product Hero", desc: "Cinematic product reveal", icon: "🎬" },
];

const PLATFORMS: Array<{ value: VideoPlatform; label: string; icon: string }> = [
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "instagram-reels", label: "Reels", icon: "📸" },
  { value: "youtube-shorts", label: "Shorts", icon: "▶️" },
];

interface SetupConfig {
  productId: string;
  productImageIndex: number;
  videoStyle: VideoStyle;
  platform: VideoPlatform;
  numScenes: number;
  includesPerson: boolean;
  activeDesire: string | null;
  awarenessLevel: AwarenessLevel;
  activeAngleKey: string | null;
  notes: string;
}

function SetupStep({
  products, desires, angles, onNext,
}: {
  products: Product[];
  desires: string[];
  angles: CreativeAngle[];
  onNext: (cfg: SetupConfig) => void;
}) {
  const { lang } = useLanguage();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [productImageIndex, setProductImageIndex] = useState(0);
  const [videoStyle, setVideoStyle] = useState<VideoStyle>("ugc");
  const [platform, setPlatform] = useState<VideoPlatform>("tiktok");
  const [numScenes, setNumScenes] = useState(5);
  const [includesPerson, setIncludesPerson] = useState(true);
  const [activeDesire, setActiveDesire] = useState<string | null>(desires[0] ?? null);
  const [awarenessLevel, setAwarenessLevel] = useState<AwarenessLevel>("problem-aware");
  const [activeAngleKey, setActiveAngleKey] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const selectedProduct = products.find(p => p.id === productId);
  const productImages = selectedProduct?.image_urls ?? [];

  return (
    <div className="space-y-6">
      {/* Product */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Product</p>
        <div className="flex flex-wrap gap-2">
          {products.map(p => (
            <button key={p.id} onClick={() => { setProductId(p.id); setProductImageIndex(0); }}
              className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-colors ${
                productId === p.id ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
              }`}>
              {p.image_urls?.[0] && <Image src={p.image_urls[0]} alt="" width={18} height={18} className="rounded object-cover" unoptimized />}
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {productImages.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {lang === "nl" ? "Productreferentie foto" : "Product reference photo"}
          </p>
          <div className="flex gap-2">
            {productImages.slice(0, 6).map((url, i) => (
              <button key={i} onClick={() => setProductImageIndex(i)}
                className={`relative rounded-lg overflow-hidden border-2 transition-colors ${productImageIndex === i ? "border-[#C7F56F]" : "border-transparent"}`}>
                <Image src={url} alt={`Product ${i + 1}`} width={56} height={72} className="object-cover" unoptimized />
                {productImageIndex === i && (
                  <div className="absolute inset-0 bg-[#C7F56F]/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#1a1a1a]">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video style */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          {lang === "nl" ? "Videostijl" : "Video style"}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {VIDEO_STYLES.map(s => (
            <button key={s.value} onClick={() => setVideoStyle(s.value)}
              className={`flex flex-col rounded-xl border-2 p-3 text-left transition-colors ${
                videoStyle === s.value ? "border-[#C7F56F] bg-[#C7F56F]/10" : "border-gray-200 dark:border-gray-700"
              }`}>
              <span className="text-lg mb-1">{s.icon}</span>
              <span className={`text-xs font-semibold ${videoStyle === s.value ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"}`}>{s.label}</span>
              <span className="text-[10px] text-gray-400 mt-0.5 leading-tight">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Platform + scenes + person */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Platform</p>
          <div className="flex flex-col gap-1.5">
            {PLATFORMS.map(p => (
              <button key={p.value} onClick={() => setPlatform(p.value)}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  platform === p.value ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                }`}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {lang === "nl" ? "Scènes" : "Scenes"}
          </p>
          <div className="flex flex-col gap-1.5">
            {[4, 5, 6, 7, 8, 9].map(n => (
              <button key={n} onClick={() => setNumScenes(n)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-center transition-colors ${
                  numScenes === n ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                }`}>
                {n} <span className="font-normal text-gray-400">({(15 / n).toFixed(1)}s)</span>
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
              { v: true, label: lang === "nl" ? "Met persoon" : "With person" },
              { v: false, label: lang === "nl" ? "Alleen product" : "Product only" },
            ].map(opt => (
              <button key={String(opt.v)} onClick={() => setIncludesPerson(opt.v)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium text-left transition-colors ${
                  includesPerson === opt.v ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer desire */}
      {desires.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Customer desire
            <span className="ml-1 font-normal text-gray-400">{lang === "nl" ? "(script wordt hierop gefocust)" : "(script will focus on this)"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {desires.map(d => (
              <button key={d} onClick={() => setActiveDesire(activeDesire === d ? null : d)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeDesire === d ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Awareness level */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Awareness level</p>
        <div className="flex flex-wrap gap-2">
          {AWARENESS_LEVELS.map(a => (
            <button key={a.value} onClick={() => setAwarenessLevel(a.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                awarenessLevel === a.value ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
              }`}>
              {lang === "nl" ? a.labelNl : a.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
          {lang === "nl"
            ? AWARENESS_LEVELS.find(a => a.value === awarenessLevel)?.descNl
            : AWARENESS_LEVELS.find(a => a.value === awarenessLevel)?.desc}
        </p>
      </div>

      {/* Creative angle */}
      {angles.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {lang === "nl" ? "Creatieve invalshoek" : "Creative angle"}
            <span className="ml-1 font-normal text-gray-400">{lang === "nl" ? "(optioneel)" : "(optional)"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {angles.map(a => (
              <button key={a.key} onClick={() => setActiveAngleKey(activeAngleKey === a.key ? null : a.key)}
                title={a.description}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeAngleKey === a.key ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                }`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          {lang === "nl" ? "Extra notities (optioneel)" : "Extra notes (optional)"}
        </p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder={lang === "nl" ? "Bijv: maak scène 1 heel direct, gebruik een kookthema..." : "E.g: make scene 1 very direct, use a cooking theme..."}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50"
        />
      </div>

      <button
        onClick={() => onNext({ productId, productImageIndex, videoStyle, platform, numScenes, includesPerson, activeDesire, awarenessLevel, activeAngleKey, notes })}
        disabled={!productId}
        className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40"
      >
        {lang === "nl" ? "Volgende →" : "Next →"}
      </button>
    </div>
  );
}

// ─── Step 1: References ───────────────────────────────────────────────────────

interface RefState {
  tab: "upload" | "generate";
  prompt: string;
  url: string | null;
  loading: boolean;
}

function RefPanel({
  type, label, suggestions, state, brandId, sessionId, onChange,
}: {
  type: "character" | "environment";
  label: string;
  suggestions: string[];
  state: RefState;
  brandId: string;
  sessionId: string;
  onChange: (s: RefState) => void;
}) {
  const { lang } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);

  function randomSuggestion() {
    const current = state.prompt;
    const others = suggestions.filter(s => s !== current);
    const pick = others[Math.floor(Math.random() * others.length)];
    onChange({ ...state, prompt: pick });
  }

  async function handleGenerate() {
    if (!state.prompt.trim()) return;
    onChange({ ...state, loading: true });
    const res = await fetch(`/api/brands/${brandId}/video-sessions/${sessionId}/references`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, prompt: state.prompt }),
    });
    if (res.ok) {
      const { url } = await res.json() as { url: string };
      onChange({ ...state, loading: false, url });
    } else {
      onChange({ ...state, loading: false });
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ ...state, loading: true });
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    const res = await fetch(`/api/brands/${brandId}/video-sessions/${sessionId}/references`, {
      method: "PATCH",
      body: fd,
    });
    if (res.ok) {
      const { url } = await res.json() as { url: string };
      onChange({ ...state, loading: false, url });
    } else {
      onChange({ ...state, loading: false });
    }
    e.target.value = "";
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <span className="text-base">{type === "character" ? "👤" : "🏠"}</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-white">{label}</span>
        {/* Tabs */}
        <div className="ml-auto flex gap-1">
          {(["generate", "upload"] as const).map(t => (
            <button key={t} onClick={() => onChange({ ...state, tab: t })}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                state.tab === t ? "bg-[#C7F56F] text-[#1a1a1a]" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}>
              {t === "generate" ? (lang === "nl" ? "Genereren" : "Generate") : (lang === "nl" ? "Uploaden" : "Upload")}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Current image preview or placeholder */}
        {state.url ? (
          <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-[9/16] max-w-[120px]">
            <Image src={state.url} alt={label} fill className="object-cover" unoptimized />
            <button
              onClick={() => onChange({ ...state, url: null })}
              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-[10px] hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        ) : state.loading ? (
          <div className="flex h-20 items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin text-[#C7F56F]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-xs text-gray-400">{lang === "nl" ? "Genereren..." : "Generating..."}</span>
          </div>
        ) : null}

        {state.tab === "generate" && (
          <>
            {/* Suggestion chips + random button */}
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                {lang === "nl" ? "Prompt of kies een suggestie:" : "Prompt or pick a suggestion:"}
              </p>
              <button onClick={randomSuggestion}
                title={lang === "nl" ? "Willekeurige suggestie" : "Random suggestion"}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:border-[#C7F56F] hover:text-gray-700 dark:hover:text-white transition-colors text-sm">
                ⟳
              </button>
            </div>

            {/* Suggestion pills */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {suggestions.map(s => (
                <button key={s} onClick={() => onChange({ ...state, prompt: s })}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors text-left leading-tight ${
                    state.prompt === s ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                  }`}>
                  {s.length > 55 ? s.slice(0, 55) + "…" : s}
                </button>
              ))}
            </div>

            {/* Prompt textarea */}
            <textarea
              value={state.prompt}
              onChange={e => onChange({ ...state, prompt: e.target.value })}
              rows={2}
              placeholder={type === "character"
                ? (lang === "nl" ? "Beschrijf het karakter (leeftijd, haar, kleding, stijl)..." : "Describe the character (age, hair, outfit, style)...")
                : (lang === "nl" ? "Beschrijf de ruimte (kamer, kleuren, licht, sfeer)..." : "Describe the space (room, colors, light, mood)...")}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50"
            />

            <button onClick={handleGenerate} disabled={!state.prompt.trim() || state.loading}
              className="rounded-lg bg-[#C7F56F] px-4 py-2 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40">
              {state.loading
                ? (lang === "nl" ? "Genereren..." : "Generating...")
                : (lang === "nl" ? "Referentie genereren" : "Generate reference")}
            </button>
          </>
        )}

        {state.tab === "upload" && (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lang === "nl"
                ? "Upload een foto als referentie. Zorg dat de achtergrond neutraal is en de persoon/ruimte duidelijk zichtbaar."
                : "Upload a photo as reference. Make sure the background is neutral and the person/space is clearly visible."}
            </p>
            <button onClick={() => fileRef.current?.click()} disabled={state.loading}
              className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hover:border-[#C7F56F] hover:text-gray-700 dark:hover:text-white transition-colors disabled:opacity-40">
              <span>📎</span>
              {lang === "nl" ? "Afbeelding kiezen" : "Choose image"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </>
        )}
      </div>
    </div>
  );
}

function ReferencesStep({
  brandId, sessionId, includesPerson, initialCharacterUrl, initialEnvironmentUrl, onGenerateScript,
}: {
  brandId: string;
  sessionId: string;
  includesPerson: boolean;
  initialCharacterUrl?: string | null;
  initialEnvironmentUrl?: string | null;
  onGenerateScript: (characterPrompt?: string, environmentPrompt?: string) => void;
}) {
  const { lang } = useLanguage();
  const [character, setCharacter] = useState<RefState>({ tab: "generate", prompt: CHARACTER_SUGGESTIONS[0], url: initialCharacterUrl ?? null, loading: false });
  const [environment, setEnvironment] = useState<RefState>({ tab: "generate", prompt: ENVIRONMENT_SUGGESTIONS[0], url: initialEnvironmentUrl ?? null, loading: false });

  const isGenerating = character.loading || environment.loading;

  return (
    <div className="space-y-6">
      {/* Layout: left panel + right sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Left: panels */}
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {lang === "nl" ? "Referentieafbeeldingen" : "Reference images"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {lang === "nl"
                ? "Genereer of upload referenties. Nano Banana gebruikt deze als visueel anker voor alle scènes."
                : "Generate or upload references. Nano Banana uses these as a visual anchor across all scenes."}
            </p>
          </div>

          {includesPerson && (
            <RefPanel
              type="character"
              label={lang === "nl" ? "Karakter" : "Character"}
              suggestions={CHARACTER_SUGGESTIONS}
              state={character}
              brandId={brandId}
              sessionId={sessionId}
              onChange={setCharacter}
            />
          )}

          <RefPanel
            type="environment"
            label={lang === "nl" ? "Omgeving" : "Environment"}
            suggestions={ENVIRONMENT_SUGGESTIONS}
            state={environment}
            brandId={brandId}
            sessionId={sessionId}
            onChange={setEnvironment}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={() => onGenerateScript(
                character.url ? character.prompt : undefined,
                environment.url ? environment.prompt : undefined,
              )}
              disabled={isGenerating}
              className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40"
            >
              {lang === "nl" ? "Script genereren →" : "Generate Script →"}
            </button>
            <span className="text-xs text-gray-400">
              {lang === "nl" ? "Referenties zijn optioneel" : "References are optional"}
            </span>
          </div>
        </div>

        {/* Right: explainer sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {lang === "nl" ? "Wat is een goede referentie?" : "What makes a good reference?"}
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Character example */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  {lang === "nl" ? "Karakter" : "Character"}
                </p>
                {/* Placeholder image */}
                <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 aspect-[3/4] w-full flex items-center justify-center mb-2">
                  <div className="text-center">
                    <div className="text-3xl mb-1">👤</div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Placeholder</p>
                  </div>
                </div>
                <ul className="space-y-1">
                  {[
                    lang === "nl" ? "Neutrale achtergrond" : "Neutral background",
                    lang === "nl" ? "Gezicht + bovenlijf zichtbaar" : "Face + upper body visible",
                    lang === "nl" ? "Goede belichting" : "Good lighting",
                    lang === "nl" ? "1 persoon" : "1 person only",
                  ].map(t => (
                    <li key={t} className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                      <span className="text-[#C7F56F]">✓</span> {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700" />

              {/* Environment example */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  {lang === "nl" ? "Omgeving" : "Environment"}
                </p>
                <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 aspect-[3/4] w-full flex items-center justify-center mb-2">
                  <div className="text-center">
                    <div className="text-3xl mb-1">🏠</div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Placeholder</p>
                  </div>
                </div>
                <ul className="space-y-1">
                  {[
                    lang === "nl" ? "Leeg, geen mensen" : "Empty, no people",
                    lang === "nl" ? "Herkenbare ruimte" : "Recognizable space",
                    lang === "nl" ? "Consistente belichting" : "Consistent lighting",
                    lang === "nl" ? "Passend bij je brand" : "Matches your brand",
                  ].map(t => (
                    <li key={t} className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                      <span className="text-[#C7F56F]">✓</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
            {lang === "nl"
              ? "De referentiebeelden worden als visueel anker meegestuurd bij elke scène-generatie. Hoe gedetailleerder de beschrijving, hoe consistenter het resultaat."
              : "Reference images are sent as visual anchors with every scene frame generation. The more detailed your description, the more consistent the result."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Script ───────────────────────────────────────────────────────────

function ScriptStep({
  scenes, onSave, onRegenerate, onNext,
}: {
  scenes: SceneScript[];
  onSave: (scenes: SceneScript[]) => void;
  onRegenerate: (notes?: string) => void;
  onNext: () => void;
}) {
  const { lang } = useLanguage();
  const [localScenes, setLocalScenes] = useState<SceneScript[]>(scenes);
  const [regenNotes, setRegenNotes] = useState("");
  const [showRegen, setShowRegen] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setLocalScenes(scenes); setDirty(false); }, [scenes]);

  function updateScene(index: number, field: keyof SceneScript, value: string) {
    setLocalScenes(prev => prev.map(s => s.index === index ? { ...s, [field]: value } : s));
    setDirty(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Script
            <span className="ml-2 text-xs text-gray-400 font-normal">{scenes.length} {lang === "nl" ? "scènes" : "scenes"} · 15s</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {lang === "nl" ? "Pas het script aan of regenereer het." : "Edit the script or regenerate it."}
          </p>
        </div>
        <button onClick={() => setShowRegen(v => !v)}
          className="text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:border-gray-300">
          {lang === "nl" ? "Regenereren" : "Regenerate"}
        </button>
      </div>

      {showRegen && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {lang === "nl" ? "Geef punten mee (optioneel):" : "Add notes (optional):"}
          </p>
          <textarea
            value={regenNotes}
            onChange={e => setRegenNotes(e.target.value)}
            rows={3}
            placeholder={lang === "nl" ? "Bijv: maak scène 2 grappiger, begin met een probleem-hook..." : "E.g: make scene 2 funnier, start with a problem-hook..."}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50"
          />
          <div className="flex gap-2">
            <button onClick={() => { onRegenerate(regenNotes || undefined); setShowRegen(false); setRegenNotes(""); }}
              className="rounded-lg bg-[#C7F56F] px-4 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
              {lang === "nl" ? "Regenereren" : "Regenerate"}
            </button>
            <button onClick={() => setShowRegen(false)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-1.5 text-xs text-gray-500 dark:text-gray-400">
              {lang === "nl" ? "Annuleren" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {localScenes.map((scene) => (
          <div key={scene.index} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C7F56F]/20 text-[10px] font-bold text-gray-800 dark:text-[#C7F56F]">
                {scene.index}
              </span>
              <input
                value={scene.title}
                onChange={e => updateScene(scene.index, "title", e.target.value)}
                className="flex-1 bg-transparent text-xs font-semibold text-gray-800 dark:text-white focus:outline-none"
                placeholder="Scene title"
              />
              <span className="text-[10px] text-gray-400">{scene.duration_s}s</span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wide">
                  {lang === "nl" ? "Visueel" : "Visual"}
                </p>
                <textarea
                  value={scene.visual_description}
                  onChange={e => updateScene(scene.index, "visual_description", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-2 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#C7F56F]/50"
                />
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wide">
                  Voiceover / Caption
                </p>
                <textarea
                  value={scene.voiceover}
                  onChange={e => updateScene(scene.index, "voiceover", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-2 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#C7F56F]/50"
                />
              </div>
            </div>

            <details className="group">
              <summary className="cursor-pointer text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 select-none">
                {lang === "nl" ? "Nano Banana prompt (voor beeldgeneratie)" : "Nano Banana prompt (for frame generation)"}
              </summary>
              <textarea
                value={scene.nano_prompt}
                onChange={e => updateScene(scene.index, "nano_prompt", e.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-2 text-[10px] font-mono text-gray-500 dark:text-gray-400 focus:outline-none"
              />
            </details>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {dirty && (
          <button onClick={() => { onSave(localScenes); setDirty(false); }}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300">
            {lang === "nl" ? "Opslaan" : "Save changes"}
          </button>
        )}
        <button onClick={() => { if (dirty) onSave(localScenes); onNext(); }}
          className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
          {lang === "nl" ? "Frames genereren →" : "Generate Frames →"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Frames ───────────────────────────────────────────────────────────

function FrameCard({
  scene, brandId, sessionId, onUpdated,
}: {
  scene: SceneScript;
  brandId: string;
  sessionId: string;
  onUpdated: (index: number, url: string) => void;
}) {
  const { lang } = useLanguage();
  const [showEdit, setShowEdit] = useState(false);
  const [editMode, setEditMode] = useState<"regenerate" | "adjust">("regenerate");
  const [adjustment, setAdjustment] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAction() {
    setBusy(true);
    setShowEdit(false);
    await fetch(`/api/brands/${brandId}/video-sessions/${sessionId}/frames`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scene_index: scene.index,
        action: editMode,
        adjustment: editMode === "adjust" ? adjustment : undefined,
        reference_url: editMode === "adjust" ? scene.image_url : undefined,
      }),
    });
    setBusy(false);
    setAdjustment("");
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("scene_index", String(scene.index));
    const res = await fetch(`/api/brands/${brandId}/video-sessions/${sessionId}/frames`, {
      method: "PATCH",
      body: fd,
    });
    if (res.ok) {
      const { url } = await res.json() as { url: string };
      onUpdated(scene.index, url);
    }
    setBusy(false);
    e.target.value = "";
  }

  const hasImage = !!scene.image_url && !busy;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C7F56F]/20 text-[10px] font-bold text-gray-800 dark:text-[#C7F56F]">
          {scene.index}
        </span>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{scene.title}</span>
        <span className="ml-auto text-[10px] text-gray-400">{scene.duration_s}s</span>
      </div>

      <div className="relative bg-gray-50 dark:bg-gray-800 aspect-[9/16]">
        {hasImage ? (
          <Image src={scene.image_url!} alt={scene.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {busy || (!scene.image_url) ? (
              <>
                <svg className="h-5 w-5 animate-spin text-[#C7F56F]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-[10px] text-gray-400">{lang === "nl" ? "Genereren..." : "Generating..."}</p>
              </>
            ) : (
              <p className="text-[10px] text-gray-400">{lang === "nl" ? "Geen afbeelding" : "No image"}</p>
            )}
          </div>
        )}
      </div>

      <div className="px-3 py-2 text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 line-clamp-2">
        {scene.voiceover}
      </div>

      <div className="flex gap-1.5 px-3 pb-3">
        <button onClick={() => setShowEdit(v => !v)} disabled={busy}
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-1.5 text-[10px] font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300 disabled:opacity-40">
          {lang === "nl" ? "Bewerken" : "Edit"}
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={busy}
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-1.5 text-[10px] font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300 disabled:opacity-40">
          {lang === "nl" ? "Uploaden" : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {showEdit && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-3 space-y-2.5 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-2">
            {(["regenerate", "adjust"] as const).map(m => (
              <button key={m} onClick={() => setEditMode(m)}
                className={`flex-1 rounded-lg border py-1.5 text-[10px] font-medium transition-colors ${
                  editMode === m ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                }`}>
                {m === "regenerate" ? (lang === "nl" ? "Nieuwe foto" : "New photo") : (lang === "nl" ? "Aanpassen" : "Adjust")}
              </button>
            ))}
          </div>
          {editMode === "adjust" && (
            <textarea
              value={adjustment}
              onChange={e => setAdjustment(e.target.value)}
              rows={2}
              placeholder={lang === "nl" ? "Bijv: lichter maken, meer product zichtbaar..." : "E.g: make it brighter, show more product..."}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 px-2.5 py-2 text-[10px] text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none"
            />
          )}
          <button onClick={handleAction}
            className="w-full rounded-lg bg-[#C7F56F] py-1.5 text-[10px] font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
            {lang === "nl" ? "Toepassen" : "Apply"}
          </button>
        </div>
      )}
    </div>
  );
}

function FramesStep({
  scenes, brandId, sessionId, onScenesUpdate, onNext,
}: {
  scenes: SceneScript[];
  brandId: string;
  sessionId: string;
  onScenesUpdate: (scenes: SceneScript[]) => void;
  onNext: () => void;
}) {
  const { lang } = useLanguage();
  const [localScenes, setLocalScenes] = useState<SceneScript[]>(scenes);
  const [generating, setGenerating] = useState(false);
  const [allReady, setAllReady] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setLocalScenes(scenes); }, [scenes]);

  useEffect(() => {
    const ready = localScenes.length > 0 && localScenes.every(s => !!s.image_url);
    setAllReady(ready);
  }, [localScenes]);

  const pollFrames = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/brands/${brandId}/video-sessions/${sessionId}`);
      if (!res.ok) return;
      const { session } = await res.json() as { session: VideoSession };
      const updated = session.scenes;
      setLocalScenes(updated);
      onScenesUpdate(updated);
      if (updated.every(s => !!s.image_url)) {
        clearInterval(pollRef.current!);
        setGenerating(false);
      }
    }, 5000);
  }, [brandId, sessionId, onScenesUpdate]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function handleGenerateAll() {
    setGenerating(true);
    await fetch(`/api/brands/${brandId}/video-sessions/${sessionId}/frames`, { method: "POST" });
    pollFrames();
  }

  function handleFrameUpdated(index: number, url: string) {
    setLocalScenes(prev => {
      const updated = prev.map(s => s.index === index ? { ...s, image_url: url } : s);
      onScenesUpdate(updated);
      return updated;
    });
  }

  const doneCount = localScenes.filter(s => !!s.image_url).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {lang === "nl" ? "Scèneframes" : "Scene Frames"}
            {generating && (
              <span className="ml-2 text-xs text-gray-400 font-normal">
                {doneCount}/{localScenes.length} {lang === "nl" ? "klaar" : "done"}
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {lang === "nl" ? "Genereer alle frames of upload eigen foto's per scène." : "Generate all frames or upload your own photo per scene."}
          </p>
        </div>
        <button onClick={handleGenerateAll} disabled={generating}
          className="rounded-lg bg-[#C7F56F] px-4 py-2 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40">
          {generating ? (lang === "nl" ? "Genereren..." : "Generating...") : (lang === "nl" ? "Alles genereren" : "Generate All")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {localScenes.map(scene => (
          <FrameCard
            key={scene.index}
            scene={scene}
            brandId={brandId}
            sessionId={sessionId}
            onUpdated={handleFrameUpdated}
          />
        ))}
      </div>

      <button onClick={onNext} disabled={!allReady}
        className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed">
        {lang === "nl" ? "Prompt bekijken →" : "Review Prompt →"}
      </button>
      {!allReady && (
        <p className="text-xs text-gray-400">
          {lang === "nl" ? "Alle frames moeten een foto hebben voordat je verder kunt." : "All frames need an image before you can continue."}
        </p>
      )}
    </div>
  );
}

// ─── Step 4: Prompt ───────────────────────────────────────────────────────────

function PromptStep({
  scenes, seedancePrompt, numScenes, onSave, onGenerate,
}: {
  scenes: SceneScript[];
  seedancePrompt: string;
  numScenes: number;
  onSave: (prompt: string) => void;
  onGenerate: (prompt: string) => void;
}) {
  const { lang } = useLanguage();
  const [prompt, setPrompt] = useState(seedancePrompt);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Seedance 2 Prompt</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {lang === "nl"
            ? `@Image1–@Image${numScenes} zijn jouw scèneframes. @Image${numScenes + 1} is de productreferentie.`
            : `@Image1–@Image${numScenes} are your scene frames. @Image${numScenes + 1} is the product reference.`}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {scenes.sort((a, b) => a.index - b.index).map(scene => (
          <div key={scene.index} className="flex-shrink-0 text-center">
            <div className="relative h-16 w-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              {scene.image_url && (
                <Image src={scene.image_url} alt={scene.title} fill className="object-cover" unoptimized />
              )}
            </div>
            <p className="text-[9px] text-gray-400 mt-0.5">@Image{scene.index}</p>
          </div>
        ))}
        <div className="flex-shrink-0 text-center">
          <div className="flex h-16 w-12 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 items-center justify-center">
            <span className="text-[10px] text-gray-400">📦</span>
          </div>
          <p className="text-[9px] text-gray-400 mt-0.5">@Image{numScenes + 1}</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">
          {lang === "nl" ? "Prompt (aanpasbaar)" : "Prompt (editable)"}
        </p>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={10}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-xs font-mono text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50 leading-relaxed"
        />
      </div>

      <div className="flex gap-3">
        <button onClick={() => onSave(prompt)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300">
          {lang === "nl" ? "Opslaan" : "Save"}
        </button>
        <button onClick={() => onGenerate(prompt)}
          className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
          {lang === "nl" ? "Video genereren →" : "Generate Video →"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Video ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { en: string; nl: string }> = {
  generating_video: { en: "Rendering with Seedance 2… this takes 3–8 minutes", nl: "Renderen met Seedance 2… dit duurt 3–8 minuten" },
  done: { en: "Done!", nl: "Klaar!" },
  failed: { en: "Generation failed", nl: "Generatie mislukt" },
};

function VideoStep({ brandId, sessionId }: { brandId: string; sessionId: string }) {
  const { lang } = useLanguage();
  const [phase, setPhase] = useState("generating_video");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/brands/${brandId}/video-sessions/${sessionId}`);
      if (!res.ok) return;
      const { session } = await res.json() as { session: VideoSession };
      setPhase(session.phase);
      if (session.phase === "done") {
        setVideoUrl(session.video_url);
        clearInterval(interval);
      } else if (session.phase === "failed") {
        setErrorMsg(session.error_msg);
        clearInterval(interval);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [brandId, sessionId]);

  const label = STATUS_LABELS[phase]?.[lang] ?? phase;

  return (
    <div className="space-y-6">
      {phase === "generating_video" && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-4">
          <svg className="h-5 w-5 animate-spin text-[#C7F56F] flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-gray-700 dark:text-gray-200">{label}</p>
        </div>
      )}
      {phase === "failed" && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {errorMsg ?? label}
        </div>
      )}
      {videoUrl && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
          <video src={videoUrl} controls playsInline className="w-full max-w-xs rounded-xl mx-auto block" />
          <a href={videoUrl} download target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#C7F56F] px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
            {lang === "nl" ? "Download video" : "Download video"}
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

function VideoWizard({
  brand, products, dna, strategy, initialSession, onBack,
}: {
  brand: Brand;
  products: Product[];
  dna: BrandDna | null;
  strategy: CreativeStrategy | null;
  initialSession?: VideoSession | null;
  onBack?: () => void;
}) {
  const [step, setStep] = useState(() => initialSession ? phaseToStep(initialSession.phase) : 0);
  const [sessionId, setSessionId] = useState<string | null>(initialSession?.id ?? null);
  const [scenes, setScenes] = useState<SceneScript[]>(initialSession?.scenes ?? []);
  const [seedancePrompt, setSeedancePrompt] = useState(initialSession?.seedance_prompt ?? "");
  const [numScenes, setNumScenes] = useState(initialSession?.num_scenes ?? 5);
  const [productId, setProductId] = useState(initialSession?.product_id ?? products[0]?.id ?? "");
  const [productImageIndex, setProductImageIndex] = useState(0);
  const [includesPerson, setIncludesPerson] = useState(initialSession?.includes_person ?? true);
  const [setupConfig, setSetupConfig] = useState<SetupConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { lang } = useLanguage();

  // Step 0 → 1: create session, store config, advance to references
  async function handleSetupNext(cfg: SetupConfig) {
    setLoading(true);
    setError(null);
    setProductId(cfg.productId);
    setProductImageIndex(cfg.productImageIndex);
    setNumScenes(cfg.numScenes);
    setIncludesPerson(cfg.includesPerson);
    setSetupConfig(cfg);

    const res = await fetch(`/api/brands/${brand.id}/video-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: cfg.productId,
        video_style: cfg.videoStyle,
        platform: cfg.platform,
        num_scenes: cfg.numScenes,
        duration: 15,
        includes_person: cfg.includesPerson,
      }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Failed to create session.");
      setLoading(false);
      return;
    }

    const { session } = await res.json() as { session: VideoSession };
    setSessionId(session.id);
    setLoading(false);
    setStep(1);
  }

  // Step 1 → 2: generate script using stored setup config + reference prompts
  async function handleGenerateScript(characterRefPrompt?: string, environmentRefPrompt?: string) {
    if (!sessionId) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/brands/${brand.id}/video-sessions/${sessionId}/script`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_image_index: setupConfig?.productImageIndex ?? 0,
        active_desire: setupConfig?.activeDesire || undefined,
        awareness_level: setupConfig?.awarenessLevel ?? "problem-aware",
        active_angle_key: setupConfig?.activeAngleKey || undefined,
        notes: setupConfig?.notes || undefined,
        character_ref_prompt: characterRefPrompt,
        environment_ref_prompt: environmentRefPrompt,
      }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Failed to generate script.");
      setLoading(false);
      return;
    }

    const { scenes: newScenes, seedance_prompt } = await res.json() as { scenes: SceneScript[]; seedance_prompt: string };
    setScenes(newScenes);
    setSeedancePrompt(seedance_prompt ?? "");
    setLoading(false);
    setStep(2);
  }

  async function handleSaveScript(updatedScenes: SceneScript[]) {
    if (!sessionId) return;
    await fetch(`/api/brands/${brand.id}/video-sessions/${sessionId}/script`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", scenes: updatedScenes }),
    });
    setScenes(updatedScenes);
  }

  async function handleRegenScript(notes?: string) {
    if (!sessionId) return;
    setLoading(true);
    const res = await fetch(`/api/brands/${brand.id}/video-sessions/${sessionId}/script`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "regenerate", notes, includes_person: includesPerson, product_image_index: productImageIndex }),
    });
    if (res.ok) {
      const { scenes: newScenes, seedance_prompt } = await res.json() as { scenes: SceneScript[]; seedance_prompt: string };
      setScenes(newScenes);
      if (seedance_prompt) setSeedancePrompt(seedance_prompt);
    }
    setLoading(false);
  }

  async function handleSavePrompt(prompt: string) {
    if (!sessionId) return;
    await fetch(`/api/brands/${brand.id}/video-sessions/${sessionId}/prompt`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seedance_prompt: prompt }),
    });
    setSeedancePrompt(prompt);
  }

  async function handleGenerate(prompt: string) {
    if (!sessionId) return;
    await handleSavePrompt(prompt);

    const product = products.find(p => p.id === productId);
    const productImageUrl = product?.image_urls?.[productImageIndex] ?? null;

    await fetch(`/api/brands/${brand.id}/video-sessions/${sessionId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_image_url: productImageUrl }),
    });

    setStep(5);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <svg className="h-8 w-8 animate-spin text-[#C7F56F]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {step === 1
            ? (lang === "nl" ? "Script genereren..." : "Generating script…")
            : (lang === "nl" ? "Laden..." : "Loading…")}
        </p>
      </div>
    );
  }

  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          ← {lang === "nl" ? "Terug naar overzicht" : "Back to sessions"}
        </button>
      )}
      <StepBar current={step} />
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {step === 0 && (
        <SetupStep
          products={products}
          desires={dna?.data?.customer_desires ?? []}
          angles={strategy?.creative_angles ?? []}
          onNext={handleSetupNext}
        />
      )}

      {step === 1 && sessionId && (
        <ReferencesStep
          brandId={brand.id}
          sessionId={sessionId}
          includesPerson={includesPerson}
          initialCharacterUrl={initialSession?.character_ref_url}
          initialEnvironmentUrl={initialSession?.environment_ref_url}
          onGenerateScript={handleGenerateScript}
        />
      )}

      {step === 2 && sessionId && (
        <ScriptStep
          scenes={scenes}
          onSave={handleSaveScript}
          onRegenerate={handleRegenScript}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && sessionId && (
        <FramesStep
          scenes={scenes}
          brandId={brand.id}
          sessionId={sessionId}
          onScenesUpdate={setScenes}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && sessionId && (
        <PromptStep
          scenes={scenes}
          seedancePrompt={seedancePrompt}
          numScenes={numScenes}
          onSave={handleSavePrompt}
          onGenerate={handleGenerate}
        />
      )}

      {step === 5 && sessionId && (
        <VideoStep brandId={brand.id} sessionId={sessionId} />
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GenerationVideoPage() {
  const { lang } = useLanguage();
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [dna, setDna] = useState<BrandDna | null>(null);
  const [strategy, setStrategy] = useState<CreativeStrategy | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [viewMode, setViewMode] = useState<"picker" | "wizard">("picker");
  const [initialSession, setInitialSession] = useState<VideoSession | null>(null);

  async function handleSelectBrand(brand: Brand) {
    setSelectedBrand(brand);
    setLoadingBrand(true);
    setViewMode("picker");
    setInitialSession(null);
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

  function handleResume(session: VideoSession) {
    setInitialSession(session);
    setViewMode("wizard");
  }

  function handleStartNew() {
    setInitialSession(null);
    setViewMode("wizard");
  }

  function handleChangeBrand() {
    setSelectedBrand(null);
    setDna(null);
    setStrategy(null);
    setProducts([]);
    setViewMode("picker");
    setInitialSession(null);
  }

  return (
    <div>
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
            ? "Multi-scène UGC en lifestyle videos — stap voor stap"
            : "Multi-scene UGC and lifestyle videos — step by step"}
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
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C7F56F]/20 text-sm font-bold text-[#1a1a1a] dark:text-[#C7F56F]">
                  {selectedBrand.name[0]}
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedBrand.name}</span>
              </div>
              <button onClick={handleChangeBrand}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {lang === "nl" ? "Wijzigen" : "Change"}
              </button>
            </div>
            {viewMode === "picker" ? (
              <VideoSessionPicker
                brand={selectedBrand}
                products={products}
                onResume={handleResume}
                onStartNew={handleStartNew}
              />
            ) : (
              <VideoWizard
                brand={selectedBrand}
                products={products}
                dna={dna}
                strategy={strategy}
                initialSession={initialSession}
                onBack={() => setViewMode("picker")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
