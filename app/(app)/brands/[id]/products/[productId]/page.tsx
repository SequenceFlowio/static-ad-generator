"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Brand, BrandDnaData, Product, PromptSet, PromptItem, Resolution, KieModel } from "@/types";
import { MODEL_CONFIGS } from "@/types";

const TEMPLATES = [
  { number: 1, name: "headline", label: "01 Headline", thumb: "/template thumbnails/headline.jpg" },
  { number: 2, name: "offer-promotion", label: "02 Offer / Promo", thumb: "/template thumbnails/offer.jpg" },
  { number: 3, name: "testimonial", label: "03 Testimonial", thumb: "/template thumbnails/testimonial.jpg" },
  { number: 4, name: "vs-them", label: "04 Us vs Them", thumb: "/template thumbnails/us_vs_them.jpg" },
  { number: 5, name: "ugc-lifestyle", label: "05 UGC Lifestyle", thumb: "/template thumbnails/ugc_lifestyle.jpg" },
];

const ASPECT_RATIOS = ["1:1", "3:4", "9:16"];

const MAX_IMAGES = 6;
const AVG_GEN_SECONDS = 35;
const AVG_PROMPT_SECONDS = 30;
const POLL_TIMEOUT_MS = 8 * 60 * 1000;

interface TemplateProgress {
  template_number: number;
  status: "idle" | "running" | "done" | "error";
  image_urls?: string[];
  error?: string;
  startedAt?: number;
  aspect_ratio: string;
}

function ProgressBar({ p }: { p: TemplateProgress }) {
  const tpl = TEMPLATES.find((t) => t.number === p.template_number);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (p.status !== "running") return;
    const interval = setInterval(() => {
      setElapsed(p.startedAt ? Math.floor((Date.now() - p.startedAt) / 1000) : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [p.status, p.startedAt]);

  const fillPct =
    p.status === "done" ? 100
    : p.status === "error" ? 100
    : p.status === "running"
      ? Math.min(92, Math.round((elapsed / AVG_GEN_SECONDS) * 92))
    : 0;

  const barColor =
    p.status === "done" ? "bg-[#C7F56F]"
    : p.status === "error" ? "bg-red-400"
    : "bg-[#C7F56F]/60";

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{tpl?.label ?? `Template ${p.template_number}`}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{p.aspect_ratio}</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {p.status === "done" && <span className="text-[#4a7c20] font-medium">✓ Done · {p.image_urls?.length} images</span>}
          {p.status === "error" && <span className="text-red-500 truncate max-w-[180px]">{p.error}</span>}
          {p.status === "running" && <span className="tabular-nums">{fillPct}%</span>}
          {p.status === "idle" && <span className="text-gray-300 dark:text-gray-600">Waiting…</span>}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  );
}

function PromptGenProgressBar({ active }: { active: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!active) { setElapsed(0); startRef.current = Date.now(); return; }
    startRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  const fillPct = Math.min(90, Math.round((elapsed / AVG_PROMPT_SECONDS) * 90));

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">Generating prompts…</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{fillPct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#C7F56F]/70 transition-all duration-1000"
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  );
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;
  const productId = params.productId as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [brandDna, setBrandDna] = useState<BrandDnaData | null>(null);
  const [loading, setLoading] = useState(true);

  // Product edit
  const [editingProduct, setEditingProduct] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);

  // Step 1 — prompts (always starts fresh, never preloaded from DB)
  const [promptSet, setPromptSet] = useState<PromptSet | null>(null);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([1, 2, 3, 4, 5]);
  const [backgroundIntent, setBackgroundIntent] = useState("");
  const [numVariants, setNumVariants] = useState(2);
  const [awarenessLevel, setAwarenessLevel] = useState("problem-aware");
  const [selectedDesire, setSelectedDesire] = useState<string | null>(null);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [promptError, setPromptError] = useState("");
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const [editedPrompts, setEditedPrompts] = useState<Record<number, Partial<PromptItem>>>({});
  const [savingPrompts, setSavingPrompts] = useState(false);

  // Step 2 — generation
  const [aspectRatio, setAspectRatio] = useState("3:4");
  const [model, setModel] = useState<KieModel>("nano-banana-2");
  const [resolution, setResolution] = useState<Resolution>("2K");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<TemplateProgress[]>([]);
  const [genError, setGenError] = useState("");

  // Images
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load brand + product + brand DNA (no prompt preloading — always start fresh)
  useEffect(() => {
    async function load() {
      const [brandRes, productRes] = await Promise.all([
        fetch(`/api/brands/${brandId}`),
        fetch(`/api/brands/${brandId}/products/${productId}`),
      ]);
      if (!brandRes.ok || !productRes.ok) { router.push(`/brands/${brandId}`); return; }
      const brandData = await brandRes.json();
      const productData = await productRes.json();
      setBrand(brandData.brand);
      setProduct(productData.product);
      const dna: BrandDnaData | null = brandData.brand_dna?.data ?? null;
      setBrandDna(dna);
      if (dna && (dna.customer_desires ?? []).length > 0) {
        setSelectedDesire(dna.customer_desires[0]);
      }
      setLoading(false);
    }
    load();
  }, [brandId, productId, router]);

  // Product edit handlers
  async function handleSaveProduct() {
    if (!product) return;
    setSavingProduct(true);
    const res = await fetch(`/api/brands/${brandId}/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim() || product.name,
        description: editDesc.trim() || null,
        url: editUrl.trim() || null,
      }),
    });
    const data = await res.json();
    setSavingProduct(false);
    if (res.ok) { setProduct(data); setEditingProduct(false); }
  }

  function startEditProduct() {
    if (!product) return;
    setEditName(product.name);
    setEditDesc(product.description ?? "");
    setEditUrl(product.url ?? "");
    setEditingProduct(true);
  }

  // Step 1 — generate prompts
  async function handleGeneratePrompts() {
    setGeneratingPrompts(true);
    setPromptError("");
    const res = await fetch(`/api/brands/${brandId}/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        num_variants: numVariants,
        hook_intent: null,
        background_intent: backgroundIntent.trim() || null,
        template_numbers: selectedTemplates,
        awareness_level: awarenessLevel,
        selected_desire: selectedDesire,
      }),
    });
    const data = await res.json();
    setGeneratingPrompts(false);
    if (!res.ok) { setPromptError(data.error ?? "Prompt generation failed."); return; }
    setPromptSet(data.prompt_set);
    setPrompts(data.prompt_set.prompts_json.prompts);
    setEditedPrompts({});
    setExpandedTemplate(null);
  }

  // Prompt editing
  async function handleSavePrompts() {
    if (!promptSet) return;
    setSavingPrompts(true);
    const updatedPrompts = prompts.map((p) => {
      const edits = editedPrompts[p.template_number];
      if (!edits) return p;
      return {
        ...p,
        background_prompt: edits.background_prompt ?? p.background_prompt,
        hook_variants: edits.hook_variants ?? p.hook_variants,
      };
    });
    const res = await fetch(`/api/brands/${brandId}/prompts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt_set_id: promptSet.id, prompts: updatedPrompts }),
    });
    const data = await res.json();
    setSavingPrompts(false);
    if (res.ok) {
      setPromptSet(data.prompt_set);
      setPrompts(data.prompt_set.prompts_json.prompts);
      setEditedPrompts({});
    }
  }

  function resetPrompt(templateNumber: number) {
    const original = promptSet?.prompts_json?.prompts_original?.find(
      (p) => p.template_number === templateNumber
    );
    if (!original) return;
    setEditedPrompts((prev) => ({
      ...prev,
      [templateNumber]: {
        background_prompt: original.background_prompt,
        hook_variants: [...original.hook_variants],
      },
    }));
  }

  function updateHookVariant(templateNumber: number, variantIndex: number, value: string) {
    setEditedPrompts((prev) => {
      const existing = prev[templateNumber] ?? {};
      const prompt = prompts.find((p) => p.template_number === templateNumber);
      const currentHooks = existing.hook_variants ?? prompt?.hook_variants ?? [];
      const newHooks = [...currentHooks];
      newHooks[variantIndex] = value;
      return { ...prev, [templateNumber]: { ...existing, hook_variants: newHooks } };
    });
  }

  function updateBackgroundPrompt(templateNumber: number, value: string) {
    setEditedPrompts((prev) => ({
      ...prev,
      [templateNumber]: { ...(prev[templateNumber] ?? {}), background_prompt: value },
    }));
  }

  const hasUnsavedPrompts = Object.keys(editedPrompts).length > 0;

  // Image upload
  async function handleUploadImages(files: FileList) {
    const currentCount = product?.image_urls.length ?? 0;
    if (currentCount >= MAX_IMAGES) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files).slice(0, MAX_IMAGES - currentCount).forEach((f) => formData.append("files", f));
    const res = await fetch(`/api/brands/${brandId}/products/${productId}/images`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploading(false);
    if (res.ok && product) setProduct({ ...product, image_urls: data.urls });
  }

  async function handleDeleteImages() {
    await fetch(`/api/brands/${brandId}/products/${productId}/images`, { method: "DELETE" });
    if (product) setProduct({ ...product, image_urls: [] });
  }

  // Step 2 — generate images
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  const handleGenerate = useCallback(async () => {
    if (!promptSet) return;
    const templatesWithPrompts = prompts.map((p) => p.template_number);
    if (templatesWithPrompts.length === 0) return;

    stopPolling();
    setGenerating(true);
    setGenError("");
    setProgress(templatesWithPrompts.map((n) => ({ template_number: n, status: "idle", aspect_ratio: aspectRatio })));

    const res = await fetch(`/api/brands/${brandId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_numbers: templatesWithPrompts,
        resolution,
        prompt_set_id: promptSet.id,
        model,
        aspect_ratio: aspectRatio,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setGenError(data.error ?? "Generation failed.");
      setGenerating(false);
      return;
    }

    const { prompt_set_id } = data as { job_ids: string[]; prompt_set_id: string };
    pollStartRef.current = Date.now();
    setProgress(templatesWithPrompts.map((n) => ({ template_number: n, status: "running", startedAt: Date.now(), aspect_ratio: aspectRatio })));

    pollIntervalRef.current = setInterval(async () => {
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        stopPolling();
        setGenerating(false);
        setProgress((prev) =>
          prev.map((p) => p.status === "running" ? { ...p, status: "error", error: "Timed out — please retry" } : p)
        );
        return;
      }

      const jobsRes = await fetch(`/api/brands/${brandId}/jobs?prompt_set_id=${prompt_set_id}`);
      if (!jobsRes.ok) return;
      const jobs: Array<{ template_number: number; status: string; image_urls: string[] | null; error: string | null }> = await jobsRes.json();

      setProgress((prev) =>
        prev.map((p) => {
          const job = jobs.find((j) => j.template_number === p.template_number);
          if (!job) return p;
          if (job.status === "done") return { ...p, status: "done", image_urls: job.image_urls ?? [] };
          if (job.status === "failed") return { ...p, status: "error", error: job.error ?? "Failed" };
          if (job.status === "running" && p.status === "idle") return { ...p, status: "running", startedAt: Date.now() };
          return p;
        })
      );

      const settled = jobs.filter((j) =>
        templatesWithPrompts.includes(j.template_number) && (j.status === "done" || j.status === "failed")
      );
      if (settled.length === templatesWithPrompts.length) {
        stopPolling();
        setGenerating(false);
        // Navigate to gallery — page state resets automatically on next mount
        router.push(`/brands/${brandId}/gallery`);
      }
    }, 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, promptSet, prompts, resolution, model, aspectRatio, router]);

  const modelConfig = MODEL_CONFIGS[model];
  const numVariantsFromSet = promptSet?.prompts_json?.num_variants ?? numVariants;
  const estimatedCost = prompts.length * numVariantsFromSet * (modelConfig.costPerImage[resolution] ?? 0.06);
  const inputBase = "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30";
  const textareaBase = `${inputBase} resize-y font-mono text-xs leading-relaxed text-gray-700 dark:text-gray-200`;
  const imageCount = product?.image_urls.length ?? 0;

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>;
  if (!product || !brand) return null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200">Brands</Link>
        <span>/</span>
        <Link href={`/brands/${brandId}`} className="hover:text-gray-700 dark:hover:text-gray-200">{brand.name}</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">{product.name}</span>
      </div>

      {/* Product info card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        {!editingProduct ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{product.name}</h1>
              {product.description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{product.description}</p>}
              {product.url && (
                <a href={product.url} target="_blank" rel="noopener noreferrer"
                  className="mt-1 block text-xs text-gray-400 dark:text-gray-500 hover:underline truncate max-w-sm">
                  {product.url}
                </a>
              )}
              <div className="mt-3">
                {product.image_urls.length > 0 ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    {product.image_urls.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={url} alt="" className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                    ))}
                    <button onClick={handleDeleteImages} className="text-xs text-red-400 hover:text-red-600">Remove all</button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 dark:text-gray-600">No reference images</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleUploadImages(e.target.files)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || imageCount >= MAX_IMAGES}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading…" : `+ Images (${imageCount} / ${MAX_IMAGES})`}
              </button>
              <button
                onClick={startEditProduct}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Edit
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputBase} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Product URL</label>
                <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://…" className={inputBase} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Description</label>
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} className={`${inputBase} resize-none`} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveProduct} disabled={savingProduct}
                className="rounded-lg bg-[#C7F56F] px-4 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50">
                {savingProduct ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditingProduct(false)} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Step 1 — Generate Prompts ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        {/* Step header */}
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 px-5 py-4">
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${prompts.length > 0 ? "bg-[#C7F56F] text-[#1a1a1a]" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
            {prompts.length > 0 ? "✓" : "1"}
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Generate Prompts</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {prompts.length > 0
                ? `${prompts.length} template${prompts.length !== 1 ? "s" : ""} ready — edit below or regenerate`
                : "Select templates, describe intent, generate"}
            </p>
          </div>
          {prompts.length > 0 && (
            <button
              onClick={() => { setPrompts([]); setPromptSet(null); setEditedPrompts({}); setExpandedTemplate(null); }}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Start over
            </button>
          )}
        </div>

        <div className="px-5 py-5 space-y-5">
          {promptError && <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">{promptError}</p>}

          {/* Template visual cards */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">Select templates</p>
            <div className="grid grid-cols-5 gap-2">
              {TEMPLATES.map((t) => {
                const isSelected = selectedTemplates.includes(t.number);
                return (
                  <button
                    key={t.number}
                    onClick={() => setSelectedTemplates((prev) =>
                      prev.includes(t.number) ? prev.filter((n) => n !== t.number) : [...prev, t.number]
                    )}
                    className={`relative rounded-xl border-2 overflow-hidden transition-all ${isSelected ? "border-[#C7F56F]" : "border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-80"}`}
                  >
                    <div className="relative w-full aspect-[3/4] bg-gray-100 dark:bg-gray-700">
                      <Image src={t.thumb} alt={t.label} fill className="object-cover" unoptimized />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-[#C7F56F] flex items-center justify-center">
                          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="px-1.5 py-1 text-left">
                      <p className="text-xs font-medium truncate leading-tight">{t.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background intent */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Background &amp; scene intent</label>
            <textarea
              value={backgroundIntent}
              onChange={(e) => setBackgroundIntent(e.target.value)}
              rows={2}
              placeholder="e.g. dark brown marble counter, minimal props, no extra objects"
              className={`${inputBase} resize-none text-xs`}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">What scene, surface, and props should the background use?</p>
          </div>

          {/* Customer desire selector */}
          {brandDna && (brandDna.customer_desires ?? []).length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Customer desire</label>
              <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">Every hook will be built around the selected desire.</p>
              <div className="flex flex-wrap gap-2">
                {(brandDna.customer_desires ?? []).map((desire) => (
                  <button
                    key={desire}
                    onClick={() => setSelectedDesire(desire)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${selectedDesire === desire ? "border-[#C7F56F] bg-[#C7F56F]/10 text-[#1a1a1a]" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"}`}
                  >
                    {desire}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Awareness level */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Audience awareness level</label>
            <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">Who is this ad targeting? Calibrates hook tone and angle.</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "unaware", label: "Unaware", desc: "Curiosity-first, no product" },
                { value: "problem-aware", label: "Problem Aware", desc: "Lead with pain" },
                { value: "solution-aware", label: "Solution Aware", desc: "Why this beats alternatives" },
                { value: "product-aware", label: "Product Aware", desc: "Proof & validation" },
                { value: "most-aware", label: "Most Aware", desc: "Direct offer, urgency" },
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => setAwarenessLevel(level.value)}
                  className={`rounded-lg border px-3 py-1.5 text-left transition-colors ${awarenessLevel === level.value ? "border-[#C7F56F] bg-[#C7F56F]/10 text-[#1a1a1a]" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}
                >
                  <span className="block text-xs font-medium">{level.label}</span>
                  <span className="block text-xs text-gray-400 dark:text-gray-500">{level.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Variant count */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">Variants per template</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setNumVariants(n)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${numVariants === n ? "border-[#C7F56F] bg-[#C7F56F]/10 text-[#1a1a1a]" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                  {n}
                </button>
              ))}
              <span className="self-center text-xs text-gray-400 dark:text-gray-500 ml-1">= {numVariants} unique hook{numVariants !== 1 ? "s" : ""} per template</span>
            </div>
          </div>

          {/* Generate button */}
          <div>
            <button
              onClick={handleGeneratePrompts}
              disabled={generatingPrompts || selectedTemplates.length === 0}
              className="rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
            >
              {generatingPrompts ? "Generating…" : prompts.length > 0 ? "Regenerate Prompts" : "Generate Prompts ▶"}
            </button>
            <PromptGenProgressBar active={generatingPrompts} />
          </div>

          {/* Prompt editor — always visible when prompts exist */}
          {prompts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Review &amp; Edit Prompts</p>
                {hasUnsavedPrompts && (
                  <button onClick={handleSavePrompts} disabled={savingPrompts}
                    className="rounded-lg bg-[#C7F56F] px-3 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50">
                    {savingPrompts ? "Saving…" : "Save Edits"}
                  </button>
                )}
              </div>
              {prompts.map((p) => {
                const edits = editedPrompts[p.template_number];
                const currentBg = edits?.background_prompt ?? p.background_prompt;
                const currentHooks = edits?.hook_variants ?? p.hook_variants;
                const isEdited = !!edits;
                const hasOriginals = !!promptSet?.prompts_json?.prompts_original;

                return (
                  <div key={p.template_number} className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <button
                      onClick={() => setExpandedTemplate((t) => t === p.template_number ? null : p.template_number)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono font-semibold">
                          {String(p.template_number).padStart(2, "0")}
                        </span>
                        <span className="font-medium capitalize">{p.template_name.replace(/-/g, " ")}</span>
                        {p.needs_product_images && (
                          <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded px-1.5 py-0.5">product ref</span>
                        )}
                        <span className="text-xs bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded px-1.5 py-0.5">{currentHooks.length} hook{currentHooks.length !== 1 ? "s" : ""}</span>
                        {isEdited && <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded px-1.5 py-0.5">edited</span>}
                      </div>
                      <span className="text-gray-300 dark:text-gray-600 text-xs">{expandedTemplate === p.template_number ? "▲" : "▼"}</span>
                    </button>

                    {expandedTemplate === p.template_number && (
                      <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 space-y-4">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Background / Scene Prompt</label>
                          <textarea
                            value={currentBg}
                            onChange={(e) => updateBackgroundPrompt(p.template_number, e.target.value)}
                            rows={5}
                            className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 ${textareaBase}`}
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hook Variants ({currentHooks.length})</label>
                          <div className="space-y-2">
                            {currentHooks.map((hook, i) => (
                              <div key={i}>
                                <label className="mb-1 block text-xs text-gray-400 dark:text-gray-500">Hook {i + 1}</label>
                                <textarea
                                  value={hook}
                                  onChange={(e) => updateHookVariant(p.template_number, i, e.target.value)}
                                  rows={2}
                                  className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 ${textareaBase}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        {hasOriginals && isEdited && (
                          <button onClick={() => resetPrompt(p.template_number)}
                            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2">
                            Reset to original
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Step 2 — Generate Images (only after prompts are ready) ── */}
      {prompts.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 px-5 py-4">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
              2
            </span>
            <div>
              <p className="text-sm font-semibold">Generate Images</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Choose aspect ratio, model &amp; resolution — then generate</p>
            </div>
          </div>

          <div className="px-5 py-5 space-y-5">
            {/* Aspect ratio */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">Aspect ratio</p>
              <div className="flex gap-2">
                {ASPECT_RATIOS.map((r) => (
                  <button key={r} onClick={() => setAspectRatio(r)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${aspectRatio === r ? "border-[#C7F56F] bg-[#C7F56F]/10 text-[#1a1a1a]" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Model + Resolution */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">Model &amp; resolution</p>
              <div className="space-y-2">
                {(Object.entries(MODEL_CONFIGS) as [KieModel, typeof MODEL_CONFIGS[KieModel]][]).map(([id, cfg]) => {
                  const isSelected = model === id;
                  return (
                    <div key={id} className={`rounded-xl border transition-colors ${isSelected ? "border-[#C7F56F] bg-[#C7F56F]/5" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 opacity-60"}`}>
                      <button
                        onClick={() => { setModel(id); if (!cfg.resolutions.includes(resolution)) setResolution(cfg.resolutions[0]); }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <div>
                          <span className="text-sm font-semibold">{cfg.label}</span>
                          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{cfg.description}</span>
                        </div>
                        <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${isSelected ? "border-[#C7F56F] bg-[#C7F56F]" : "border-gray-300 dark:border-gray-600"}`} />
                      </button>
                      {isSelected && (
                        <div className="flex flex-wrap items-center gap-2 border-t border-[#C7F56F]/20 px-4 py-3">
                          {cfg.resolutions.map((r) => (
                            <button key={r} onClick={() => setResolution(r)}
                              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${resolution === r ? "border-[#C7F56F] bg-[#C7F56F]/10 text-[#1a1a1a]" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                              {r}
                            </button>
                          ))}
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                            ~${estimatedCost.toFixed(2)} · {prompts.length * numVariantsFromSet} image{prompts.length * numVariantsFromSet !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {genError && <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">{genError}</p>}

            {progress.length > 0 && (
              <div className="space-y-2">
                {progress.map((p) => <ProgressBar key={p.template_number} p={p} />)}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
            >
              {generating
                ? `Generating… (${progress.filter((p) => p.status === "done").length}/${prompts.length} done)`
                : "Generate Ads ▶"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
