"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { useBrand } from "@/lib/brand-context";
import type { Brand, BrandDna, Product, SceneScript, VideoSession, CreativeStrategy, CreativeAngle, ImageModel, VideoModel } from "@/types";
import type { VideoStyle, VideoPlatform } from "@/lib/video-script-generator";
import { VIDEO_PRESETS } from "@/lib/video-presets";
import { IMAGE_MODEL_CONFIGS, VIDEO_MODEL_CONFIGS } from "@/lib/model-configs";
import { ENVIRONMENT_PRESETS } from "@/lib/environment-presets";
import { AVATAR_PRESETS } from "@/lib/avatar-presets";
import {
  Film, MapPin, User, SlidersHorizontal, Package, X, ChevronDown, Check, Copy,
  Smartphone, Clapperboard, Cpu, Video,
} from "lucide-react";

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

// ─── Session helpers ─────────────────────────────────────────────────────────

function phaseToStep(phase: string): number {
  const map: Record<string, number> = {
    references: 2, script: 3, frames: 4, prompt: 5,
    generating_video: 6, done: 6, failed: 6,
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
  is_pinned: boolean;
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
  const [pinningId, setPinningId] = useState<string | null>(null);

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

  async function handlePin(s: SessionListItem) {
    setPinningId(s.id);
    const res = await fetch(`/api/brands/${brand.id}/video-sessions/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !s.is_pinned }),
    });
    if (res.ok) {
      setSessions(prev => prev.map(x => x.id === s.id ? { ...x, is_pinned: !s.is_pinned } : x));
    }
    setPinningId(null);
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

                {/* Pin button */}
                <button
                  onClick={() => handlePin(s)}
                  disabled={pinningId === s.id}
                  title={s.is_pinned ? (lang === "nl" ? "Losmaken" : "Unpin") : (lang === "nl" ? "Vastzetten (nooit verwijderen)" : "Pin (never delete)")}
                  className={`flex-shrink-0 rounded-lg border px-2 py-1.5 text-[10px] transition-colors disabled:opacity-40 ${
                    s.is_pinned
                      ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-800 dark:text-white"
                      : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300"
                  }`}>
                  {pinningId === s.id ? "…" : "📌"}
                </button>

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

const STEPS = ["Setup", "Ideeën", "Referenties", "Script", "Frames", "Prompt", "Video"];

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

const PLATFORMS: Array<{ value: VideoPlatform; label: string; ratio: string }> = [
  { value: "tiktok", label: "TikTok", ratio: "9:16" },
  { value: "instagram-reels", label: "Reels", ratio: "9:16" },
  { value: "youtube-shorts", label: "Shorts", ratio: "9:16" },
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
  environmentPresetKey: string;
  avatarPresetKey: string;
  imageModel: ImageModel;
  videoModel: VideoModel;
  customAvatarId: string | null;
  customEnvId: string | null;
  voiceover: boolean;
}

interface GalleryAvatar {
  id: string;
  name: string;
  photo_url: string | null;
  prompt_hint: string;
}

interface GalleryEnvironment {
  id: string;
  name: string;
  photo_url: string | null;
  prompt_hint: string;
}

function SetupStep({
  products, desires, angles, customAvatars, customEnvs, onNext,
}: {
  products: Product[];
  desires: string[];
  angles: CreativeAngle[];
  customAvatars: GalleryAvatar[];
  customEnvs: GalleryEnvironment[];
  onNext: (cfg: SetupConfig) => void;
}) {
  const { lang } = useLanguage();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [productImageIndex, setProductImageIndex] = useState(0);
  const [selectedPresetKey, setSelectedPresetKey] = useState(VIDEO_PRESETS[0].key);
  const [platform, setPlatform] = useState<VideoPlatform>(VIDEO_PRESETS[0].platform);
  const [numScenes, setNumScenes] = useState(VIDEO_PRESETS[0].num_scenes);
  const [activeDesire, setActiveDesire] = useState<string | null>(desires[0] ?? null);
  const [awarenessLevel, setAwarenessLevel] = useState<AwarenessLevel>("problem-aware");
  const [activeAngleKey, setActiveAngleKey] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [environmentPresetKey, setEnvironmentPresetKey] = useState("studio");
  const [avatarPresetKey, setAvatarPresetKey] = useState("young-woman");
  const [imageModel, setImageModel] = useState<ImageModel>("nano-banana-2");
  const [videoModel, setVideoModel] = useState<VideoModel>("seedance-2");
  const [customAvatarId, setCustomAvatarId] = useState<string | null>(null);
  const [customEnvId, setCustomEnvId] = useState<string | null>(null);
  const [voiceover, setVoiceover] = useState(true);

  const selectedPreset = VIDEO_PRESETS.find(p => p.key === selectedPresetKey) ?? VIDEO_PRESETS[0];
  const videoStyle = selectedPreset.video_style;
  const includesPerson = selectedPreset.includes_person;

  function handlePresetSelect(key: string) {
    const preset = VIDEO_PRESETS.find(p => p.key === key);
    if (!preset) return;
    setSelectedPresetKey(key);
    setPlatform(preset.platform);
    setNumScenes(preset.num_scenes);
  }

  const selectedProduct = products.find(p => p.id === productId);

  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const togglePanel = (name: string) => setOpenPanel(p => p === name ? null : name);
  const closePanel = () => setOpenPanel(null);

  const selectedEnvLabel = customEnvId
    ? (customEnvs.find(e => e.id === customEnvId)?.name ?? "Aangepast")
    : (ENVIRONMENT_PRESETS.find(e => e.key === environmentPresetKey)?.[lang === "nl" ? "labelNl" : "label"] ?? environmentPresetKey);
  const selectedAvatarLabel = customAvatarId
    ? (customAvatars.find(a => a.id === customAvatarId)?.name ?? "Aangepast")
    : (AVATAR_PRESETS.find(a => a.key === avatarPresetKey)?.[lang === "nl" ? "labelNl" : "label"] ?? avatarPresetKey);

  const PRESET_GRADIENTS: Record<string, string> = {
    "ugc-review":   "from-rose-500 via-orange-400 to-amber-300",
    "lifestyle":    "from-amber-500 via-yellow-400 to-lime-300",
    "product-hero": "from-slate-700 via-slate-800 to-slate-900",
    "animation":    "from-purple-500 via-pink-500 to-rose-400",
    "cinematic":    "from-gray-800 via-gray-900 to-black",
  };
  const AVATAR_GRADIENTS: Record<string, string> = {
    "young-woman":   "from-rose-300 to-pink-500",
    "young-man":     "from-blue-300 to-indigo-500",
    "influencer":    "from-purple-300 to-fuchsia-500",
    "fitness":       "from-orange-300 to-red-500",
    "professional":  "from-slate-300 to-slate-600",
    "mom":           "from-amber-300 to-orange-400",
    "custom":        "from-gray-300 to-gray-500",
  };

  const placeholderImg = products[0]?.image_urls?.[0] ?? null;

  return (
    <div className="space-y-5">

      {/* ── Format modal ─────────────────────────────────────────── */}
      {openPanel === "format" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={closePanel}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#111] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 pb-3">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white">
                  {lang === "nl" ? "Kies het juiste format" : "Pick the format that hits"}
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  {lang === "nl" ? "Van UGC tot cinematic — kies wat past bij jouw product." : "From UGC to cinematic — choose what fits your product."}
                </p>
              </div>
              <button onClick={closePanel} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 p-6 pt-2 sm:grid-cols-3">
              {VIDEO_PRESETS.map(preset => {
                const isSelected = selectedPresetKey === preset.key;
                return (
                  <button key={preset.key} onClick={() => { handlePresetSelect(preset.key); closePanel(); }}
                    className={`group relative flex flex-col overflow-hidden rounded-xl text-left transition-all ${
                      isSelected ? "ring-2 ring-[#C7F56F]" : "ring-1 ring-white/10 hover:ring-white/30"
                    }`}>
                    <div className={`relative h-36 bg-gradient-to-br ${PRESET_GRADIENTS[preset.key] ?? "from-gray-700 to-gray-900"} flex items-center justify-center`}>
                      {placeholderImg && (
                        <Image src={placeholderImg} alt="" fill className="object-cover opacity-30 mix-blend-overlay" unoptimized />
                      )}
                      <Film size={40} className="text-white/80 drop-shadow-lg relative z-10" />
                      {preset.badge && (
                        <span className="absolute top-2 right-2 z-10 rounded-full bg-[#C7F56F] px-2 py-0.5 text-[9px] font-bold text-[#1a1a1a]">{preset.badge}</span>
                      )}
                      {isSelected && (
                        <div className="absolute bottom-2 right-2 z-10 rounded-full bg-[#C7F56F] p-1">
                          <Check size={12} className="text-[#1a1a1a]" />
                        </div>
                      )}
                    </div>
                    <div className="bg-[#1a1a1a] px-3 py-2.5">
                      <p className="text-xs font-bold text-white">{lang === "nl" ? preset.labelNl : preset.label}</p>
                      <p className="mt-0.5 text-[10px] text-white/50 leading-tight">{lang === "nl" ? preset.descNl : preset.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Product modal ─────────────────────────────────────────── */}
      {openPanel === "product" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={closePanel}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#111] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="text-lg font-black uppercase tracking-tight text-white">
                {lang === "nl" ? "Selecteer product" : "Select product"}
              </h2>
              <button onClick={closePanel} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5 pt-2 sm:grid-cols-3">
              {products.map(p => {
                const isSelected = productId === p.id;
                return (
                  <button key={p.id} onClick={() => { setProductId(p.id); setProductImageIndex(0); closePanel(); }}
                    className={`group relative flex flex-col overflow-hidden rounded-xl text-left transition-all ${
                      isSelected ? "ring-2 ring-[#C7F56F]" : "ring-1 ring-white/10 hover:ring-white/30"
                    }`}>
                    <div className="relative h-32 bg-[#222] flex items-center justify-center overflow-hidden">
                      {p.image_urls?.[0] ? (
                        <Image src={p.image_urls[0]} alt={p.name} fill className="object-cover" unoptimized />
                      ) : (
                        <Package size={32} className="text-white/30" />
                      )}
                      {isSelected && (
                        <div className="absolute bottom-2 right-2 rounded-full bg-[#C7F56F] p-1">
                          <Check size={12} className="text-[#1a1a1a]" />
                        </div>
                      )}
                    </div>
                    <div className="bg-[#1a1a1a] px-3 py-2">
                      <p className="text-xs font-semibold text-white leading-snug line-clamp-2">{p.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Image index picker if product has multiple images */}
            {selectedProduct && (selectedProduct.image_urls?.length ?? 0) > 1 && (
              <div className="px-5 pb-5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                  {lang === "nl" ? "Foto" : "Photo"}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {selectedProduct.image_urls!.slice(0, 6).map((url, i) => (
                    <button key={i} onClick={() => setProductImageIndex(i)}
                      className={`relative size-12 overflow-hidden rounded-lg transition-all ${productImageIndex === i ? "ring-2 ring-[#C7F56F]" : "ring-1 ring-white/10 hover:ring-white/30"}`}>
                      <Image src={url} alt="" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Avatar modal ─────────────────────────────────────────── */}
      {openPanel === "avatar" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={closePanel}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#111] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="text-lg font-black uppercase tracking-tight text-white">
                {lang === "nl" ? "Selecteer personage" : "Select avatar"}
              </h2>
              <button onClick={closePanel} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh] px-5 pb-5 space-y-4">
              {customAvatars.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">Mijn personages</p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {customAvatars.map(a => {
                      const isSelected = customAvatarId === a.id;
                      return (
                        <button key={a.id} onClick={() => { setCustomAvatarId(a.id); setAvatarPresetKey("custom"); closePanel(); }}
                          className={`group relative flex flex-col overflow-hidden rounded-xl text-left transition-all ${
                            isSelected ? "ring-2 ring-[#C7F56F]" : "ring-1 ring-white/10 hover:ring-white/30"
                          }`}>
                          <div className="relative h-28 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden">
                            {a.photo_url ? (
                              <Image src={a.photo_url} alt={a.name} fill className="object-cover" unoptimized />
                            ) : (
                              <User size={36} className="text-white/70 relative z-10" />
                            )}
                            {isSelected && (
                              <div className="absolute bottom-2 right-2 z-10 rounded-full bg-[#C7F56F] p-1">
                                <Check size={12} className="text-[#1a1a1a]" />
                              </div>
                            )}
                          </div>
                          <div className="bg-[#1a1a1a] px-2.5 py-2">
                            <p className="text-xs font-bold text-white truncate">{a.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                {customAvatars.length > 0 && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">Presets</p>
                )}
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {AVATAR_PRESETS.map(a => {
                    const isSelected = !customAvatarId && avatarPresetKey === a.key;
                    return (
                      <button key={a.key} onClick={() => { setAvatarPresetKey(a.key); setCustomAvatarId(null); closePanel(); }}
                        className={`group relative flex flex-col overflow-hidden rounded-xl text-left transition-all ${
                          isSelected ? "ring-2 ring-[#C7F56F]" : "ring-1 ring-white/10 hover:ring-white/30"
                        }`}>
                        <div className={`relative h-28 bg-gradient-to-br ${AVATAR_GRADIENTS[a.key] ?? "from-gray-500 to-gray-700"} flex items-center justify-center`}>
                          <User size={36} className="text-white/70 relative z-10" />
                          {isSelected && (
                            <div className="absolute bottom-2 right-2 z-10 rounded-full bg-[#C7F56F] p-1">
                              <Check size={12} className="text-[#1a1a1a]" />
                            </div>
                          )}
                        </div>
                        <div className="bg-[#1a1a1a] px-2.5 py-2">
                          <p className="text-xs font-bold text-white">{lang === "nl" ? a.labelNl : a.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Environment modal ───────────────────────────────────── */}
      {openPanel === "env" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={closePanel}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#111] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="text-lg font-black uppercase tracking-tight text-white">
                {lang === "nl" ? "Selecteer omgeving" : "Select environment"}
              </h2>
              <button onClick={closePanel} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh] px-5 pb-5 space-y-4">
              {customEnvs.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">Mijn omgevingen</p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {customEnvs.map(env => {
                      const isSelected = customEnvId === env.id;
                      return (
                        <button key={env.id} onClick={() => { setCustomEnvId(env.id); setEnvironmentPresetKey("custom"); closePanel(); }}
                          className={`group relative flex flex-col overflow-hidden rounded-xl text-left transition-all ${
                            isSelected ? "ring-2 ring-[#C7F56F]" : "ring-1 ring-white/10 hover:ring-white/30"
                          }`}>
                          <div className="relative h-24 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden">
                            {env.photo_url ? (
                              <Image src={env.photo_url} alt={env.name} fill className="object-cover" unoptimized />
                            ) : (
                              <MapPin size={28} className="text-white/70 relative z-10 drop-shadow" />
                            )}
                            {isSelected && (
                              <div className="absolute bottom-2 right-2 z-10 rounded-full bg-[#C7F56F] p-1">
                                <Check size={12} className="text-[#1a1a1a]" />
                              </div>
                            )}
                          </div>
                          <div className="bg-[#1a1a1a] px-2.5 py-2">
                            <p className="text-xs font-bold text-white truncate">{env.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                {customEnvs.length > 0 && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">Presets</p>
                )}
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {ENVIRONMENT_PRESETS.map(e => {
                    const envGradients: Record<string, string> = {
                      studio:       "from-gray-200 to-gray-400",
                      bedroom:      "from-rose-200 to-orange-300",
                      kitchen:      "from-amber-200 to-yellow-300",
                      "living-room":"from-emerald-200 to-teal-300",
                      outdoor:      "from-green-300 to-emerald-500",
                      beach:        "from-sky-300 to-blue-400",
                      gym:          "from-slate-400 to-gray-600",
                      cafe:         "from-amber-400 to-orange-500",
                      forest:       "from-green-500 to-emerald-700",
                      abstract:     "from-purple-400 to-pink-500",
                      neon:         "from-cyan-400 to-purple-600",
                      space:        "from-indigo-600 to-slate-900",
                      custom:       "from-gray-400 to-gray-600",
                    };
                    const isSelected = !customEnvId && environmentPresetKey === e.key;
                    return (
                      <button key={e.key} onClick={() => { setEnvironmentPresetKey(e.key); setCustomEnvId(null); closePanel(); }}
                        className={`group relative flex flex-col overflow-hidden rounded-xl text-left transition-all ${
                          isSelected ? "ring-2 ring-[#C7F56F]" : "ring-1 ring-white/10 hover:ring-white/30"
                        }`}>
                        <div className={`relative h-24 bg-gradient-to-br ${envGradients[e.key] ?? "from-gray-500 to-gray-700"} flex items-center justify-center`}>
                          {placeholderImg && (
                            <Image src={placeholderImg} alt="" fill className="object-cover opacity-20 mix-blend-overlay" unoptimized />
                          )}
                          <MapPin size={28} className="text-white/70 relative z-10 drop-shadow" />
                          {isSelected && (
                            <div className="absolute bottom-2 right-2 z-10 rounded-full bg-[#C7F56F] p-1">
                              <Check size={12} className="text-[#1a1a1a]" />
                            </div>
                          )}
                        </div>
                        <div className="bg-[#1a1a1a] px-2.5 py-2">
                          <p className="text-xs font-bold text-white">{lang === "nl" ? e.labelNl : e.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main chat panel ─────────────────────────────────────── */}
      <div className="relative">
        {openPanel && !["format", "product", "avatar", "env"].includes(openPanel) && (
          <div className="fixed inset-0 z-40" onClick={closePanel} />
        )}

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
          <div className="flex">
            {/* Left: textarea + pills */}
            <div className="flex flex-1 flex-col min-w-0 p-4">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {lang === "nl" ? "Extra opmerkingen (optioneel)" : "Extra notes (optional)"}
              </p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder={lang === "nl"
                  ? "Stijl, toon, speciale wensen…"
                  : "Style, tone, special requests…"}
                className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none"
              />
              <div className="mt-3 h-px bg-gray-100 dark:bg-gray-800" />
              {/* Pills row */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">

                {/* Format */}
                <button onClick={() => togglePanel("format")}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Film size={13} className="opacity-60" />
                  <span>{lang === "nl" ? selectedPreset.labelNl : selectedPreset.label}</span>
                  <ChevronDown size={11} className="opacity-40" />
                </button>

                {/* Environment */}
                <button onClick={() => togglePanel("env")}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <MapPin size={13} className="opacity-60" />
                  <span>{selectedEnvLabel}</span>
                  <ChevronDown size={11} className="opacity-40" />
                </button>

                {/* Avatar (only for presets that include a person) */}
                {includesPerson && (
                  <button onClick={() => togglePanel("avatar")}
                    className="flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <User size={13} className="opacity-60" />
                    <span>{selectedAvatarLabel}</span>
                    <ChevronDown size={11} className="opacity-40" />
                  </button>
                )}

                {/* Settings (platform + scenes + models) */}
                <div className="relative z-50">
                  <button onClick={() => togglePanel("settings")}
                    className="flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <SlidersHorizontal size={13} className="opacity-60" />
                    <span>{lang === "nl" ? "Instellingen" : "Settings"}</span>
                    <ChevronDown size={11} className="opacity-40" />
                  </button>
                  {openPanel === "settings" && (
                    <div className="absolute bottom-full mb-2 left-0 z-50 w-72 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-3 space-y-3">
                      {/* Platform + Scenes side-by-side */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            <Smartphone size={10} /> Platform
                          </p>
                          <div className="flex flex-col gap-1">
                            {PLATFORMS.map(p => (
                              <button key={p.value} onClick={() => setPlatform(p.value)}
                                className={`rounded-lg border px-2 py-1 text-left text-[11px] font-medium transition-colors ${
                                  platform === p.value ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                                }`}>
                                {p.label} <span className="opacity-50 font-normal">{p.ratio}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            <Clapperboard size={10} /> {lang === "nl" ? "Scènes" : "Scenes"}
                          </p>
                          <div className="grid grid-cols-3 gap-1">
                            {[4, 5, 6, 7, 8].map(n => (
                              <button key={n} onClick={() => setNumScenes(n)}
                                className={`rounded-lg border py-1 text-xs font-bold transition-colors ${
                                  numScenes === n ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                                }`}>
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-gray-100 dark:bg-gray-800" />

                      {/* Frame model */}
                      <div>
                        <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          <Cpu size={10} /> {lang === "nl" ? "Framemodel" : "Frame model"}
                        </p>
                        <div className="space-y-0.5">
                          {(Object.entries(IMAGE_MODEL_CONFIGS) as [ImageModel, typeof IMAGE_MODEL_CONFIGS[ImageModel]][]).map(([key, cfg]) => (
                            <button key={key} onClick={() => setImageModel(key)}
                              className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                                imageModel === key ? "bg-[#C7F56F]/10 ring-1 ring-[#C7F56F]/40" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                              }`}>
                              <span className="flex-1 text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">{cfg.label}</span>
                              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${cfg.api === "kie.ai" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"}`}>
                                {cfg.api}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Video model */}
                      <div>
                        <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          <Video size={10} /> {lang === "nl" ? "Videomodel" : "Video model"}
                        </p>
                        <div className="space-y-0.5">
                          {(Object.entries(VIDEO_MODEL_CONFIGS) as [VideoModel, typeof VIDEO_MODEL_CONFIGS[VideoModel]][]).map(([key, cfg]) => (
                            <button key={key} onClick={() => setVideoModel(key)}
                              className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                                videoModel === key ? "bg-[#C7F56F]/10 ring-1 ring-[#C7F56F]/40" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                              }`}>
                              <span className="flex-1 text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">{cfg.label}</span>
                              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${cfg.api === "kie.ai" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"}`}>
                                {cfg.api}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-gray-100 dark:bg-gray-800" />

                      {/* Voice-over */}
                      <button onClick={() => setVoiceover(v => !v)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-200">Voice-over</span>
                        <div className={`relative h-5 w-9 rounded-full transition-colors ${voiceover ? "bg-[#C7F56F]" : "bg-gray-200 dark:bg-gray-700"}`}>
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${voiceover ? "translate-x-4" : "translate-x-0.5"}`} />
                        </div>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Right: product thumbnail + next */}
            <div className="flex shrink-0 flex-col items-end justify-between gap-3 p-4 pl-0">
              <button onClick={() => togglePanel("product")}
                className="relative size-20 shrink-0 overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#C7F56F] transition-colors bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                {selectedProduct?.image_urls?.[productImageIndex] ? (
                  <Image src={selectedProduct.image_urls[productImageIndex]} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <Package size={24} className="text-gray-400" />
                )}
                <div className="absolute bottom-0 inset-x-0 flex justify-center pb-1">
                  <span className="rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] text-white leading-tight">
                    {selectedProduct?.name?.split(" ").slice(0, 2).join(" ") ?? "Product"}
                  </span>
                </div>
              </button>

              <button
                onClick={() => onNext({ productId, productImageIndex, videoStyle, platform, numScenes, includesPerson, activeDesire, awarenessLevel, activeAngleKey, notes, environmentPresetKey, avatarPresetKey, imageModel, videoModel, customAvatarId, customEnvId, voiceover })}
                disabled={!productId}
                className="rounded-xl bg-[#C7F56F] px-4 py-3 text-sm font-bold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 whitespace-nowrap transition-colors">
                {lang === "nl" ? "Volgende →" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desire + Awareness + Angles ─────────────────────────── */}
      <div className="space-y-2.5">
        {desires.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Desire</span>
            {desires.map(d => (
              <button key={d} onClick={() => setActiveDesire(activeDesire === d ? null : d)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  activeDesire === d ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}>{d}</button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Awareness</span>
          {AWARENESS_LEVELS.map(a => (
            <button key={a.value} onClick={() => setAwarenessLevel(a.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                awarenessLevel === a.value ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
              }`}>{lang === "nl" ? a.labelNl : a.label}</button>
          ))}
        </div>
        {angles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{lang === "nl" ? "Hoek" : "Angle"}</span>
            {angles.map(a => (
              <button key={a.key} onClick={() => setActiveAngleKey(activeAngleKey === a.key ? null : a.key)}
                title={a.description}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  activeAngleKey === a.key ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}>{a.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── Genereer across formats ──────────────────────────────── */}
      <div className="pt-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-base font-black uppercase tracking-tight text-gray-900 dark:text-white">
            {lang === "nl" ? "Genereer across formats" : "Generate across formats"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {VIDEO_PRESETS.map(preset => (
            <button key={preset.key}
              onClick={() => { handlePresetSelect(preset.key); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`group relative flex flex-col overflow-hidden rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                selectedPresetKey === preset.key ? "ring-2 ring-[#C7F56F]" : "ring-1 ring-gray-200 dark:ring-gray-700"
              }`}>
              {/* Portrait-ratio thumbnail */}
              <div className={`relative w-full bg-gradient-to-br ${PRESET_GRADIENTS[preset.key] ?? "from-gray-700 to-gray-900"}`} style={{ paddingTop: "133%" }}>
                {placeholderImg && (
                  <Image src={placeholderImg} alt="" fill className="object-cover opacity-40 mix-blend-overlay" unoptimized />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-3">
                  <p className="text-xs font-black uppercase tracking-tight text-white leading-tight">
                    {lang === "nl" ? preset.labelNl : preset.label}
                  </p>
                  <p className="mt-0.5 text-[9px] text-white/60 leading-tight line-clamp-2">
                    {lang === "nl" ? preset.descNl : preset.desc}
                  </p>
                </div>
                {preset.badge && (
                  <span className="absolute top-2 left-2 rounded-full bg-[#C7F56F] px-1.5 py-0.5 text-[8px] font-bold text-[#1a1a1a]">
                    {preset.badge}
                  </span>
                )}
                {selectedPresetKey === preset.key && (
                  <div className="absolute top-2 right-2 rounded-full bg-[#C7F56F] p-1">
                    <Check size={10} className="text-[#1a1a1a]" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Step 1: Ideas ────────────────────────────────────────────────────────────

function IdeasStep({
  brandId, setupConfig, onSelect, onNext,
}: {
  brandId: string;
  setupConfig: SetupConfig;
  onSelect: (idea: string) => void;
  onNext: () => void;
}) {
  const { lang } = useLanguage();
  const [ideas, setIdeas] = useState<string[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(setupConfig.notes ?? "");
  const [customText, setCustomText] = useState(setupConfig.notes ?? "");

  const fetchIdeas = useCallback(() => {
    setLoadingIdeas(true);
    setIdeasError(null);
    fetch(`/api/brands/${brandId}/video-sessions/ideas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: setupConfig.productId,
        video_style: setupConfig.videoStyle,
        active_desire: setupConfig.activeDesire || undefined,
        awareness_level: setupConfig.awarenessLevel,
        notes: setupConfig.notes || undefined,
      }),
    })
      .then(async r => {
        const d = await r.json() as { ideas?: string[]; error?: string };
        if (!r.ok || d.error) {
          setIdeasError(d.error ?? "Laden mislukt");
        } else {
          setIdeas(d.ideas ?? []);
        }
        setLoadingIdeas(false);
      })
      .catch(err => {
        setIdeasError(err instanceof Error ? err.message : "Laden mislukt");
        setLoadingIdeas(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  function handleChip(idea: string) {
    setSelected(idea);
    setCustomText("");
    onSelect(idea);
  }

  function handleCustomChange(val: string) {
    setCustomText(val);
    setSelected(val);
    onSelect(val);
  }

  const hasSelection = selected.trim().length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          {lang === "nl" ? "Wat is het concept van je video?" : "What is the concept of your video?"}
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          {lang === "nl"
            ? "Kies een idee hieronder als startpunt, of schrijf je eigen concept."
            : "Pick an idea below as a starting point, or write your own concept."}
        </p>
      </div>

      {loadingIdeas ? (
        <div className="flex items-center gap-3 py-8 justify-center">
          <svg className="h-5 w-5 animate-spin text-[#C7F56F]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-gray-500">{lang === "nl" ? "Ideeën genereren…" : "Generating ideas…"}</p>
        </div>
      ) : ideasError ? (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-red-600 dark:text-red-400">{ideasError}</p>
          <button onClick={fetchIdeas} className="ml-3 shrink-0 text-xs font-medium text-red-600 dark:text-red-400 underline">
            {lang === "nl" ? "Opnieuw" : "Retry"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {ideas.map((idea, i) => (
            <button key={i} onClick={() => handleChip(idea)}
              className={`w-full text-left rounded-xl border px-4 py-3 text-sm leading-snug transition-colors ${
                selected === idea && !customText
                  ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white"
                  : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}>
              {idea}
            </button>
          ))}
        </div>
      )}

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
          {lang === "nl" ? "Of schrijf je eigen concept" : "Or write your own concept"}
        </p>
        <textarea
          value={customText}
          onChange={e => handleCustomChange(e.target.value)}
          onFocus={() => { if (ideas.includes(selected)) setSelected(customText); }}
          rows={3}
          placeholder={lang === "nl" ? "Beschrijf het concept van je video…" : "Describe the concept of your video…"}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50 resize-none"
        />
      </div>

      <button
        onClick={onNext}
        disabled={!hasSelection}
        className="w-full rounded-xl bg-[#C7F56F] py-3 text-sm font-bold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 transition-colors">
        {lang === "nl" ? "Volgende →" : "Next →"}
      </button>
    </div>
  );
}

// ─── Step 2: References ───────────────────────────────────────────────────────

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

const ANIMATION_CHARACTER_SUGGESTIONS = [
  "Pixar-style 3D animated girl, early 20s, big expressive eyes, warm skin tone, wavy chestnut hair, wearing a cozy oversized sweater, friendly smile",
  "Pixar-style 3D animated boy, late teens, freckles, bright blue eyes, casual hoodie, energetic and curious expression",
  "Pixar-style 3D animated woman, 30s, elegant, sharp cheekbones, dark hair in a bun, stylish minimal outfit, confident",
  "Pixar-style 3D animated man, 40s, warm smile, slight stubble, casual blazer, approachable authority",
  "Pixar-style 3D animated child, 8 years old, giant eyes, messy red hair, playful mischievous grin",
];

const ANIMATION_ENVIRONMENT_SUGGESTIONS = [
  "Pixar-style 3D animated cozy kitchen, warm pastel colors, rounded furniture, soft morning light streaming through window",
  "Pixar-style 3D animated living room, vibrant color palette, plush couch, large windows with golden hour light, playful details",
  "Pixar-style 3D animated magical shop interior, whimsical shelves, warm glowing lights, rich saturated colors",
  "Pixar-style 3D animated outdoor garden, lush saturated greens, dappled sunlight, whimsical flowers and butterflies",
  "Pixar-style 3D animated minimalist studio, clean white space, dramatic cinematic rim lighting, colorful accent props",
];

function ReferencesStep({
  brandId, sessionId, includesPerson, videoStyle, initialCharacterUrl, initialEnvironmentUrl, onGenerateScript,
}: {
  brandId: string;
  sessionId: string;
  includesPerson: boolean;
  videoStyle: VideoStyle;
  initialCharacterUrl?: string | null;
  initialEnvironmentUrl?: string | null;
  onGenerateScript: (characterPrompt?: string, environmentPrompt?: string, characterUrl?: string, environmentUrl?: string) => void;
}) {
  const { lang } = useLanguage();
  const isAnimation = videoStyle === "animation";
  const charSuggestions = isAnimation ? ANIMATION_CHARACTER_SUGGESTIONS : CHARACTER_SUGGESTIONS;
  const envSuggestions = isAnimation ? ANIMATION_ENVIRONMENT_SUGGESTIONS : ENVIRONMENT_SUGGESTIONS;
  const [character, setCharacter] = useState<RefState>({ tab: "generate", prompt: charSuggestions[0], url: initialCharacterUrl ?? null, loading: false });
  const [environment, setEnvironment] = useState<RefState>({ tab: "generate", prompt: envSuggestions[0], url: initialEnvironmentUrl ?? null, loading: false });

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
              suggestions={charSuggestions}
              state={character}
              brandId={brandId}
              sessionId={sessionId}
              onChange={setCharacter}
            />
          )}

          <RefPanel
            type="environment"
            label={lang === "nl" ? "Omgeving" : "Environment"}
            suggestions={envSuggestions}
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
                character.url ?? undefined,
                environment.url ?? undefined,
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

// ─── Step 3: Script ───────────────────────────────────────────────────────────

function ScriptStep({
  scenes, product, onSave, onRegenerate, onNext,
}: {
  scenes: SceneScript[];
  product: Product | null;
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

  function toggleProduct(index: number) {
    setLocalScenes(prev => prev.map(s => s.index === index ? { ...s, product_in_frame: !s.product_in_frame } : s));
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

            {product && (
              <button
                onClick={() => toggleProduct(scene.index)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[10px] font-medium transition-colors ${
                  scene.product_in_frame
                    ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white"
                    : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500"
                }`}
              >
                {product.image_urls?.[0] && (
                  <Image src={product.image_urls[0]} alt="" width={14} height={14} className="rounded object-cover flex-shrink-0" unoptimized />
                )}
                <span>{lang === "nl" ? "Product meesturen" : "Include product"}: {product.name}</span>
                <span className="ml-1">{scene.product_in_frame ? "✓" : "+"}</span>
              </button>
            )}
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
  scene, brandId, sessionId, charRefUrl, envRefUrl, productImageUrl, onUpdated,
}: {
  scene: SceneScript;
  brandId: string;
  sessionId: string;
  charRefUrl: string | null;
  envRefUrl: string | null;
  productImageUrl: string | null;
  onUpdated: (index: number, updates: Partial<SceneScript>) => void;
}) {
  const { lang } = useLanguage();
  const [showEdit, setShowEdit] = useState(false);
  const [editMode, setEditMode] = useState<"regenerate" | "adjust">("regenerate");
  const [adjustment, setAdjustment] = useState("");
  const [busy, setBusy] = useState(false);
  const [excludeRefs, setExcludeRefs] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const variants = scene.image_url_variants ?? (scene.image_url ? [scene.image_url] : []);
  const hasFailed = !!scene.frame_error && !busy;
  const isGenerating = (!scene.image_url && !scene.frame_error) || busy;

  async function handleSelectVariant(variantUrl: string) {
    if (variantUrl === scene.image_url) return;
    const res = await fetch(`/api/brands/${brandId}/video-sessions/${sessionId}/frames`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scene_index: scene.index, action: "select_variant", variant_url: variantUrl }),
    });
    if (res.ok) onUpdated(scene.index, { image_url: variantUrl });
  }

  async function handleAction() {
    setBusy(true);
    setShowEdit(false);
    onUpdated(scene.index, { image_url: null, image_url_variants: null, frame_error: false });
    const res = await fetch(`/api/brands/${brandId}/video-sessions/${sessionId}/frames`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scene_index: scene.index,
        action: editMode,
        adjustment: editMode === "adjust" ? adjustment : undefined,
        reference_url: editMode === "adjust" ? scene.image_url : undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json() as { url: string | null; variants?: string[] };
      onUpdated(scene.index, { image_url: data.url, image_url_variants: data.variants ?? null, frame_error: !data.url });
    } else {
      onUpdated(scene.index, { image_url: null, frame_error: true });
    }
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
    const res = await fetch(`/api/brands/${brandId}/video-sessions/${sessionId}/frames`, { method: "PATCH", body: fd });
    if (res.ok) {
      const { url } = await res.json() as { url: string };
      onUpdated(scene.index, { image_url: url, image_url_variants: [url], frame_error: false });
    }
    setBusy(false);
    e.target.value = "";
  }

  const toggleExclude = (key: string) => setExcludeRefs(prev => {
    const next = new Set(prev);
    if (next.has(key)) { next.delete(key); } else { next.add(key); }
    return next;
  });

  const refs: Array<{ key: string; url: string; label: string }> = [
    ...(charRefUrl && scene.character_in_frame ? [{ key: "char", url: charRefUrl, label: lang === "nl" ? "Personage" : "Character" }] : []),
    ...(envRefUrl ? [{ key: "env", url: envRefUrl, label: lang === "nl" ? "Omgeving" : "Environment" }] : []),
    ...(productImageUrl && scene.product_in_frame ? [{ key: "product", url: productImageUrl, label: lang === "nl" ? "Product" : "Product" }] : []),
  ];

  return (
    <div className={`rounded-xl border overflow-hidden ${hasFailed ? "border-red-400 dark:border-red-500" : "border-gray-200 dark:border-gray-700"} bg-white dark:bg-gray-900`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${hasFailed ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-[#C7F56F]/20 text-gray-800 dark:text-[#C7F56F]"}`}>
          {hasFailed ? "!" : scene.index}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{scene.title}</p>
          <p className="text-[10px] text-gray-400 truncate">{scene.visual_description}</p>
        </div>
        <span className="shrink-0 text-[10px] text-gray-400">{scene.duration_s}s</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Variants row */}
        <div className="flex gap-2">
          {isGenerating && variants.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1 aspect-[9/16] rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center">
                  {i === 0 && (
                    <svg className="h-4 w-4 animate-spin text-[#C7F56F]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                </div>
              ))
            : variants.length > 0
              ? variants.map((url, i) => {
                  const isSelected = url === scene.image_url;
                  return (
                    <button key={i} onClick={() => handleSelectVariant(url)}
                      className={`relative flex-1 aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all ${isSelected ? "border-[#C7F56F] shadow-md" : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"}`}>
                      <Image src={url} alt={`Variant ${i + 1}`} fill className="object-cover" unoptimized />
                      {isSelected && (
                        <div className="absolute top-1 right-1 rounded-full bg-[#C7F56F] p-0.5">
                          <Check size={9} className="text-[#1a1a1a]" />
                        </div>
                      )}
                    </button>
                  );
                })
              : hasFailed
                ? (
                  <div className="flex-1 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 flex flex-col items-center justify-center gap-2 py-6">
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/></svg>
                    <p className="text-[10px] text-red-500 font-medium">{lang === "nl" ? "Mislukt" : "Failed"}</p>
                    <button onClick={() => { setEditMode("regenerate"); handleAction(); }}
                      className="rounded-md bg-red-500 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-red-600">
                      {lang === "nl" ? "Opnieuw" : "Retry"}
                    </button>
                  </div>
                )
                : (
                  <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center py-6 text-[10px] text-gray-400">
                    {lang === "nl" ? "Wacht..." : "Waiting..."}
                  </div>
                )
          }
        </div>

        {/* Reference thumbnails */}
        {refs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">{lang === "nl" ? "Refs:" : "Refs:"}</span>
            {refs.map(ref => (
              <button key={ref.key} onClick={() => toggleExclude(ref.key)}
                title={ref.label}
                className={`relative h-8 w-8 rounded-md overflow-hidden border-2 transition-all ${excludeRefs.has(ref.key) ? "border-gray-200 dark:border-gray-700 opacity-30 grayscale" : "border-[#C7F56F]/60"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ref.url} alt={ref.label} className="h-full w-full object-cover" />
              </button>
            ))}
            {excludeRefs.size > 0 && (
              <span className="text-[9px] text-gray-400">
                {lang === "nl" ? "(grijs = uitgesloten)" : "(grey = excluded)"}
              </span>
            )}
          </div>
        )}

        {/* Voiceover */}
        {scene.voiceover && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed italic line-clamp-2">
            &ldquo;{scene.voiceover}&rdquo;
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-1.5">
          <button onClick={() => setShowEdit(v => !v)} disabled={busy}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-1.5 text-[10px] font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300 disabled:opacity-40 transition-colors">
            {lang === "nl" ? "Bewerken" : "Edit"}
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-1.5 text-[10px] font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300 disabled:opacity-40 transition-colors">
            {lang === "nl" ? "Uploaden" : "Upload"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>

        {showEdit && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2.5 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex gap-2">
              {(["regenerate", "adjust"] as const).map(m => (
                <button key={m} onClick={() => setEditMode(m)}
                  className={`flex-1 rounded-lg border py-1.5 text-[10px] font-medium transition-colors ${
                    editMode === m ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                  {m === "regenerate" ? (lang === "nl" ? "Nieuwe foto's" : "New photos") : (lang === "nl" ? "Aanpassen" : "Adjust")}
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
              {lang === "nl" ? "Genereer 4 opties" : "Generate 4 options"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FramesStep({
  scenes, brandId, sessionId, charRefUrl, envRefUrl, productImageUrl, onScenesUpdate, onNext,
}: {
  scenes: SceneScript[];
  brandId: string;
  sessionId: string;
  charRefUrl: string | null;
  envRefUrl: string | null;
  productImageUrl: string | null;
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
    const ready = localScenes.length > 0 && localScenes.every(s => !!s.image_url && !s.frame_error);
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
      const allSettled = updated.every(s => !!s.image_url || !!s.frame_error);
      if (allSettled) {
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

  function handleFrameUpdated(index: number, updates: Partial<SceneScript>) {
    setLocalScenes(prev => {
      const updated = prev.map(s => s.index === index ? { ...s, ...updates } : s);
      onScenesUpdate(updated);
      return updated;
    });
  }

  const doneCount = localScenes.filter(s => !!s.image_url && !s.frame_error).length;
  const failedCount = localScenes.filter(s => !!s.frame_error).length;

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
            {lang === "nl" ? "Per scène worden 4 opties gegenereerd — kies de beste." : "4 options are generated per scene — pick the best."}
          </p>
        </div>
        <button onClick={handleGenerateAll} disabled={generating}
          className="rounded-lg bg-[#C7F56F] px-4 py-2 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40">
          {generating ? (lang === "nl" ? "Genereren..." : "Generating...") : (lang === "nl" ? "Alles genereren" : "Generate All")}
        </button>
      </div>

      {failedCount > 0 && !generating && (
        <div className="flex items-center gap-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5">
          <svg className="h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          <p className="text-xs text-red-600 dark:text-red-400">
            {lang === "nl"
              ? `${failedCount} frame${failedCount > 1 ? "s" : ""} mislukt — klik Opnieuw per frame of genereer alles opnieuw.`
              : `${failedCount} frame${failedCount > 1 ? "s" : ""} failed — click Retry per frame or regenerate all.`}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {localScenes.map(scene => (
          <FrameCard
            key={scene.index}
            scene={scene}
            brandId={brandId}
            sessionId={sessionId}
            charRefUrl={charRefUrl}
            envRefUrl={envRefUrl}
            productImageUrl={productImageUrl}
            onUpdated={handleFrameUpdated}
          />
        ))}
      </div>

      <button
        onClick={async () => {
          await fetch(`/api/brands/${brandId}/video-sessions/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phase: "prompt" }),
          });
          onNext();
        }}
        disabled={!allReady}
        className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed">
        {lang === "nl" ? "Prompt bekijken →" : "Review Prompt →"}
      </button>
      {!allReady && (
        <p className="text-xs text-gray-400">
          {failedCount > 0
            ? (lang === "nl" ? "Herstel de mislukte frames om door te gaan." : "Fix the failed frames to continue.")
            : (lang === "nl" ? "Alle frames moeten een foto hebben voordat je verder kunt." : "All frames need an image before you can continue.")}
        </p>
      )}
    </div>
  );
}

// ─── Step 4: Prompt ───────────────────────────────────────────────────────────

function parsePrompt(raw: string, numScenes: number): { intro: string; frameActions: string[] } {
  // Split off @image tagged lines — handles @image1, @Image1, etc.
  const lines = raw.split(/\n/);
  const actionMap: Record<number, string> = {};
  const introLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^@[Ii]mage(\d+):\s*(.*)/);
    if (match) {
      actionMap[parseInt(match[1])] = match[2].trim();
    } else {
      introLines.push(line);
    }
  }

  // Build frame actions array indexed 1..numScenes
  const frameActions = Array.from({ length: numScenes }, (_, i) => actionMap[i + 1] ?? "");

  return { intro: introLines.join("\n").trimEnd(), frameActions };
}

function assemblePrompt(intro: string, frameActions: string[]): string {
  const tagged = frameActions.map((a, i) => `@image${i + 1}: ${a}`).join("\n");
  return `${intro.trimEnd()}\n\n${tagged}`;
}

function PromptStep({
  scenes, seedancePrompt, numScenes, productImageUrl, onSave, onGenerate,
}: {
  scenes: SceneScript[];
  seedancePrompt: string;
  numScenes: number;
  productImageUrl: string | null;
  onSave: (prompt: string) => void;
  onGenerate: (prompt: string) => void;
}) {
  const { lang } = useLanguage();
  const parsed = useMemo(() => parsePrompt(seedancePrompt, numScenes), [seedancePrompt, numScenes]);
  const [introText, setIntroText] = useState(parsed.intro);
  const [frameActions, setFrameActions] = useState<string[]>(parsed.frameActions);

  const sortedScenes = useMemo(() => [...scenes].sort((a, b) => a.index - b.index), [scenes]);

  const assembled = assemblePrompt(introText, frameActions);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Seedance 2 Prompt</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {lang === "nl"
            ? "Pas de globale sfeer aan bovenaan, en de actie per frame hieronder."
            : "Edit the global mood at the top, and per-frame action below."}
        </p>
      </div>

      {/* Global intro textarea */}
      <div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">
          {lang === "nl" ? "Globale instructies" : "Global instructions"}
        </p>
        <textarea
          value={introText}
          onChange={e => setIntroText(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-xs font-mono text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50 leading-relaxed"
        />
      </div>

      {/* Per-frame action rows */}
      <div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">
          {lang === "nl" ? "Actie per frame" : "Action per frame"}
        </p>
        <div className="space-y-2">
          {sortedScenes.map((scene, i) => (
            <div key={scene.index} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
              {/* Thumbnail */}
              <div className="relative h-14 w-9 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                {scene.image_url && (
                  <Image src={scene.image_url} alt={scene.title} fill className="object-cover" unoptimized />
                )}
              </div>
              {/* Label + input */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  @image{scene.index} — {scene.title}
                </p>
                <input
                  type="text"
                  value={frameActions[i] ?? ""}
                  onChange={e => {
                    const next = [...frameActions];
                    next[i] = e.target.value;
                    setFrameActions(next);
                  }}
                  placeholder={lang === "nl" ? "Beschrijf de beweging / actie…" : "Describe the motion / action…"}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C7F56F]/50"
                />
              </div>
            </div>
          ))}
          {/* Product ref row */}
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2 opacity-60">
            <div className="relative h-14 w-9 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
              {productImageUrl && (
                <Image src={productImageUrl} alt="Product" fill className="object-cover" unoptimized />
              )}
            </div>
            <p className="text-[10px] text-gray-500">@image{numScenes + 1} — {lang === "nl" ? "Productreferentie (vast)" : "Product reference (fixed)"}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => onSave(assembled)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300">
          {lang === "nl" ? "Opslaan" : "Save"}
        </button>
        <button onClick={() => onGenerate(assembled)}
          className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
          {lang === "nl" ? "Video genereren →" : "Generate Video →"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Video ────────────────────────────────────────────────────────────

function VideoStep({ brandId, sessionId }: { brandId: string; sessionId: string }) {
  const { lang } = useLanguage();
  const [phase, setPhase] = useState("generating_video");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoClips, setVideoClips] = useState<string[]>([]);
  const [videoModel, setVideoModel] = useState<VideoModel>("seedance-2");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scenes, setScenes] = useState<SceneScript[]>([]);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/brands/${brandId}/video-sessions/${sessionId}`);
      if (!res.ok) return;
      const { session } = await res.json() as { session: VideoSession };
      setPhase(session.phase);
      setVideoModel(session.video_model ?? "seedance-2");
      if (session.phase === "done") {
        setVideoUrl(session.video_url);
        setVideoClips(session.video_clips ?? []);
        setScenes((session.scenes ?? []) as SceneScript[]);
        clearInterval(interval);
      } else if (session.phase === "failed") {
        setErrorMsg(session.error_msg);
        clearInterval(interval);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [brandId, sessionId]);

  const generatingLabel = videoModel === "veo-3.1"
    ? (lang === "nl" ? "Renderen met Veo 3.1… dit duurt 2–5 minuten" : "Rendering with Veo 3.1… this takes 2–5 minutes")
    : (lang === "nl" ? "Renderen met Seedance 2… dit duurt 3–8 minuten" : "Rendering with Seedance 2… this takes 3–8 minutes");

  const isMultiClip = videoClips.length > 1;
  const sortedScenes = useMemo(() => [...scenes].sort((a, b) => a.index - b.index), [scenes]);
  const hasVoiceover = sortedScenes.some(s => s.voiceover && s.voiceover.trim().length > 0);

  function copyVoiceover() {
    const text = sortedScenes.map(s => s.voiceover?.trim()).filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      {phase === "generating_video" && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-4">
          <svg className="h-5 w-5 animate-spin text-[#C7F56F] flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-gray-700 dark:text-gray-200">{generatingLabel}</p>
        </div>
      )}
      {phase === "failed" && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {errorMsg ?? (lang === "nl" ? "Generatie mislukt" : "Generation failed")}
        </div>
      )}
      {phase === "done" && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {lang === "nl" ? "Klaar!" : "Done!"}
          </p>

          {isMultiClip ? (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lang === "nl"
                  ? "Veo 3.1 heeft 2 clips gegenereerd. Download beide en voeg ze samen in je video-editor."
                  : "Veo 3.1 generated 2 clips. Download both and stitch them in your video editor."}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {videoClips.map((url, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {lang === "nl" ? `Clip ${i + 1}` : `Clip ${i + 1}`}
                    </p>
                    <video src={url} controls playsInline className="w-full rounded-xl" />
                    <a href={url} download target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#C7F56F] px-4 py-2 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
                      ↓ {lang === "nl" ? `Clip ${i + 1}` : `Clip ${i + 1}`}
                    </a>
                  </div>
                ))}
              </div>
            </>
          ) : videoUrl ? (
            <>
              <video src={videoUrl} controls playsInline className="w-full max-w-xs rounded-xl mx-auto block" />
              <a href={videoUrl} download target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#C7F56F] px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
                {lang === "nl" ? "Download video" : "Download video"}
              </a>
            </>
          ) : null}

          {/* Script & Voice-over collapsible */}
          {sortedScenes.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setScriptOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {lang === "nl" ? "Script & voice-over" : "Script & voice-over"}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${scriptOpen ? "rotate-180" : ""}`} />
              </button>
              {scriptOpen && (
                <div className="px-4 py-3 space-y-4 bg-white dark:bg-gray-900">
                  {sortedScenes.map(scene => (
                    <div key={scene.index} className="flex gap-3">
                      <div className="relative h-16 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {scene.image_url && (
                          <Image src={scene.image_url} alt={scene.title} fill className="object-cover" unoptimized />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                          Scène {scene.index} — {scene.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-1 line-clamp-1">{scene.visual_description}</p>
                        {scene.voiceover ? (
                          <p className="text-xs italic text-gray-700 dark:text-gray-200">&ldquo;{scene.voiceover}&rdquo;</p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">{lang === "nl" ? "(geen voice-over)" : "(no voiceover)"}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {hasVoiceover && (
                    <button
                      onClick={copyVoiceover}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300 transition-colors"
                    >
                      {copied
                        ? <><Check className="h-3.5 w-3.5 text-[#C7F56F]" /> {lang === "nl" ? "Gekopieerd!" : "Copied!"}</>
                        : <><Copy className="h-3.5 w-3.5" /> {lang === "nl" ? "Kopieer voice-over" : "Copy voice-over"}</>
                      }
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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
  const [videoStyle, setVideoStyle] = useState<VideoStyle>((initialSession?.video_style as VideoStyle) ?? "ugc");
  const [setupConfig, setSetupConfig] = useState<SetupConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customAvatars, setCustomAvatars] = useState<GalleryAvatar[]>([]);
  const [customEnvs, setCustomEnvs] = useState<GalleryEnvironment[]>([]);
  const [charRefUrl, setCharRefUrl] = useState<string | null>(initialSession?.character_ref_url ?? null);
  const [envRefUrl, setEnvRefUrl] = useState<string | null>(initialSession?.environment_ref_url ?? null);
  const { lang } = useLanguage();

  useEffect(() => {
    fetch(`/api/brands/${brand.id}/gallery/avatars`)
      .then(r => r.json())
      .then(d => setCustomAvatars(d.avatars ?? []))
      .catch(() => {});
    fetch(`/api/brands/${brand.id}/gallery/environments`)
      .then(r => r.json())
      .then(d => setCustomEnvs(d.environments ?? []))
      .catch(() => {});
  }, [brand.id]);

  // Step 0 → 1: create session, store config, advance to references
  function handleSetupNext(cfg: SetupConfig) {
    setProductId(cfg.productId);
    setProductImageIndex(cfg.productImageIndex);
    setNumScenes(cfg.numScenes);
    setIncludesPerson(cfg.includesPerson);
    setVideoStyle(cfg.videoStyle);
    setSetupConfig(cfg);
    setStep(1);
  }

  // Step 1 → 2: user picked an idea, now create the session and advance
  async function handleIdeasNext(selectedIdea: string) {
    if (!setupConfig) return;
    setLoading(true);
    setError(null);

    const cfgWithIdea: SetupConfig = { ...setupConfig, notes: selectedIdea };
    setSetupConfig(cfgWithIdea);

    const res = await fetch(`/api/brands/${brand.id}/video-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: cfgWithIdea.productId,
        video_style: cfgWithIdea.videoStyle,
        platform: cfgWithIdea.platform,
        num_scenes: cfgWithIdea.numScenes,
        duration: 15,
        includes_person: cfgWithIdea.includesPerson,
        image_model: cfgWithIdea.imageModel,
        video_model: cfgWithIdea.videoModel,
        voiceover_enabled: cfgWithIdea.voiceover,
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
    setStep(2);
  }

  // Step 2 → 3: generate script using stored setup config + reference prompts
  async function handleGenerateScript(characterRefPrompt?: string, environmentRefPrompt?: string, characterUrl?: string, environmentUrl?: string) {
    if (characterUrl) setCharRefUrl(characterUrl);
    if (environmentUrl) setEnvRefUrl(environmentUrl);
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
        environment_preset_key: setupConfig?.environmentPresetKey || undefined,
        avatar_preset_key: setupConfig?.avatarPresetKey || undefined,
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
    setStep(3);
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

    setStep(6);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <svg className="h-8 w-8 animate-spin text-[#C7F56F]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {step === 2
            ? (lang === "nl" ? "Script genereren..." : "Generating script…")
            : step === 1
            ? (lang === "nl" ? "Sessie aanmaken..." : "Creating session…")
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
          customAvatars={customAvatars}
          customEnvs={customEnvs}
          onNext={handleSetupNext}
        />
      )}

      {step === 1 && setupConfig && (
        <IdeasStep
          brandId={brand.id}
          setupConfig={setupConfig}
          onSelect={idea => setSetupConfig(c => c ? { ...c, notes: idea } : c)}
          onNext={() => handleIdeasNext(setupConfig.notes)}
        />
      )}

      {step === 2 && sessionId && (
        <ReferencesStep
          brandId={brand.id}
          sessionId={sessionId}
          includesPerson={includesPerson}
          videoStyle={videoStyle}
          initialCharacterUrl={initialSession?.character_ref_url}
          initialEnvironmentUrl={initialSession?.environment_ref_url}
          onGenerateScript={handleGenerateScript}
        />
      )}

      {step === 3 && sessionId && (
        <ScriptStep
          scenes={scenes}
          product={products.find(p => p.id === productId) ?? null}
          onSave={handleSaveScript}
          onRegenerate={handleRegenScript}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && sessionId && (
        <FramesStep
          scenes={scenes}
          brandId={brand.id}
          sessionId={sessionId}
          charRefUrl={charRefUrl}
          envRefUrl={envRefUrl}
          productImageUrl={products.find(p => p.id === productId)?.image_urls?.[productImageIndex] ?? null}
          onScenesUpdate={setScenes}
          onNext={() => setStep(5)}
        />
      )}

      {step === 5 && sessionId && (
        <PromptStep
          scenes={scenes}
          seedancePrompt={seedancePrompt}
          numScenes={numScenes}
          productImageUrl={products.find(p => p.id === productId)?.image_urls?.[productImageIndex] ?? null}
          onSave={handleSavePrompt}
          onGenerate={handleGenerate}
        />
      )}

      {step === 6 && sessionId && (
        <VideoStep brandId={brand.id} sessionId={sessionId} />
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GenerationVideoPage() {
  const { lang } = useLanguage();
  const { brand: selectedBrand, loading: brandCtxLoading } = useBrand();
  const [dna, setDna] = useState<BrandDna | null>(null);
  const [strategy, setStrategy] = useState<CreativeStrategy | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [viewMode, setViewMode] = useState<"picker" | "wizard">("picker");
  const [initialSession, setInitialSession] = useState<VideoSession | null>(null);
  const loadedBrandIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedBrand || selectedBrand.id === loadedBrandIdRef.current) return;
    loadedBrandIdRef.current = selectedBrand.id;
    setLoadingBrand(true);
    setViewMode("picker");
    setInitialSession(null);
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

  function handleResume(session: VideoSession) {
    setInitialSession(session);
    setViewMode("wizard");
  }

  function handleStartNew() {
    setInitialSession(null);
    setViewMode("wizard");
  }

  function handleChangeBrand() {
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
