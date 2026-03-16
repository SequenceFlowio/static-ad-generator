"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Brand, Product, PromptSet, PromptItem, Resolution, KieModel } from "@/types";
import { MODEL_CONFIGS } from "@/types";

const TEMPLATES = [
  { number: 1, name: "headline", label: "01 Headline", aspect: "3:4" },
  { number: 2, name: "offer-promotion", label: "02 Offer / Promo", aspect: "3:4" },
  { number: 3, name: "testimonial", label: "03 Testimonial", aspect: "1:1" },
  { number: 4, name: "vs-them", label: "04 Us vs Them", aspect: "3:4" },
  { number: 5, name: "ugc-lifestyle", label: "05 UGC Lifestyle", aspect: "9:16" },
];

const MAX_IMAGES = 6;
const AVG_GEN_SECONDS = 35;
const AVG_PROMPT_SECONDS = 30;
const POLL_TIMEOUT_MS = 8 * 60 * 1000; // 8 minutes

interface TemplateProgress {
  template_number: number;
  status: "idle" | "running" | "done" | "error";
  image_urls?: string[];
  error?: string;
  startedAt?: number;
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
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{tpl?.label ?? `Template ${p.template_number}`}</span>
          <span className="text-xs text-gray-400">{tpl?.aspect}</span>
        </div>
        <span className="text-xs text-gray-400">
          {p.status === "done" && <span className="text-[#4a7c20] font-medium">✓ Done · {p.image_urls?.length} images</span>}
          {p.status === "error" && <span className="text-red-500 truncate max-w-[180px]">{p.error}</span>}
          {p.status === "running" && <span className="tabular-nums">{fillPct}%</span>}
          {p.status === "idle" && <span className="text-gray-300">Waiting…</span>}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
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
        <span className="text-xs text-gray-400">Generating prompts…</span>
        <span className="text-xs text-gray-400 tabular-nums">{fillPct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
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
  const [promptSet, setPromptSet] = useState<PromptSet | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingProduct, setEditingProduct] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);

  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const [editedPrompts, setEditedPrompts] = useState<Record<number, Partial<PromptItem>>>({});
  const [savingPrompts, setSavingPrompts] = useState(false);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [promptError, setPromptError] = useState("");

  // Intent fields
  const [hookIntent, setHookIntent] = useState("");
  const [backgroundIntent, setBackgroundIntent] = useState("");
  const [numVariants, setNumVariants] = useState(2);

  // Template + model selection (shared between prompt gen and image gen)
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([1, 2, 3, 4, 5]);
  const [model, setModel] = useState<KieModel>("nano-banana-2");
  const [resolution, setResolution] = useState<Resolution>("2K");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<TemplateProgress[]>([]);
  const [genError, setGenError] = useState("");

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setPromptSet(productData.prompt_set);
      if (productData.prompt_set?.prompts_json?.prompts) {
        setPrompts(productData.prompt_set.prompts_json.prompts);
        const pj = productData.prompt_set.prompts_json;
        if (pj.hook_intent) setHookIntent(pj.hook_intent);
        if (pj.background_intent) setBackgroundIntent(pj.background_intent);
        if (pj.num_variants) setNumVariants(pj.num_variants);
      }
      setLoading(false);
    }
    load();
  }, [brandId, productId, router]);

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

  async function handleGeneratePrompts() {
    setGeneratingPrompts(true);
    setPromptError("");
    const res = await fetch(`/api/brands/${brandId}/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        num_variants: numVariants,
        hook_intent: hookIntent.trim() || null,
        background_intent: backgroundIntent.trim() || null,
        template_numbers: selectedTemplates,
      }),
    });
    const data = await res.json();
    setGeneratingPrompts(false);
    if (!res.ok) { setPromptError(data.error ?? "Prompt generation failed."); return; }
    setPromptSet(data.prompt_set);
    setPrompts(data.prompt_set.prompts_json.prompts);
    setEditedPrompts({});
  }

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
    const originals = promptSet?.prompts_json?.prompts_original;
    if (!originals) return;
    const original = originals.find((p) => p.template_number === templateNumber);
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

  async function handleUploadImages(files: FileList) {
    const currentCount = product?.image_urls.length ?? 0;
    if (currentCount >= MAX_IMAGES) return;
    setUploading(true);
    const formData = new FormData();
    // Only send as many files as we have slots for
    Array.from(files).slice(0, MAX_IMAGES - currentCount).forEach((f) => formData.append("files", f));
    const res = await fetch(`/api/brands/${brandId}/products/${productId}/images`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploading(false);
    if (res.ok && product) {
      setProduct({ ...product, image_urls: data.urls });
    }
  }

  async function handleDeleteImages() {
    await fetch(`/api/brands/${brandId}/products/${productId}/images`, { method: "DELETE" });
    if (product) setProduct({ ...product, image_urls: [] });
  }

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  const handleGenerate = useCallback(async () => {
    if (!promptSet || selectedTemplates.length === 0) return;
    // Only generate for templates that have prompts
    const templatesWithPrompts = selectedTemplates.filter((n) =>
      prompts.some((p) => p.template_number === n)
    );
    if (templatesWithPrompts.length === 0) return;

    stopPolling();
    setGenerating(true);
    setGenError("");
    setProgress(templatesWithPrompts.map((n) => ({ template_number: n, status: "idle" })));

    const res = await fetch(`/api/brands/${brandId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_numbers: templatesWithPrompts,
        resolution,
        prompt_set_id: promptSet.id,
        model,
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

    setProgress(templatesWithPrompts.map((n) => ({ template_number: n, status: "running", startedAt: Date.now() })));

    pollIntervalRef.current = setInterval(async () => {
      // Timeout check
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
      }
    }, 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, promptSet, selectedTemplates, prompts, resolution, model]);

  const modelConfig = MODEL_CONFIGS[model];
  const numVariantsFromSet = promptSet?.prompts_json?.num_variants ?? numVariants;
  const templatesWithPrompts = selectedTemplates.filter((n) => prompts.some((p) => p.template_number === n));
  const estimatedCost = templatesWithPrompts.length * numVariantsFromSet * (modelConfig.costPerImage[resolution] ?? 0.06);
  const inputBase = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30";
  const textareaBase = `${inputBase} resize-y font-mono text-xs leading-relaxed text-gray-700`;
  const imageCount = product?.image_urls.length ?? 0;

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;
  if (!product || !brand) return null;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-700">Brands</Link>
        <span>/</span>
        <Link href={`/brands/${brandId}`} className="hover:text-gray-700">{brand.name}</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{product.name}</span>
      </div>

      {/* Product info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        {!editingProduct ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{product.name}</h1>
              {product.description && <p className="mt-1 text-sm text-gray-500">{product.description}</p>}
              {product.url && (
                <a href={product.url} target="_blank" rel="noopener noreferrer"
                  className="mt-1 block text-xs text-gray-400 hover:underline truncate max-w-sm">
                  {product.url}
                </a>
              )}
              <div className="mt-3">
                {product.image_urls.length > 0 ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    {product.image_urls.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={url} alt="" className="h-12 w-12 rounded-lg object-cover border border-gray-200" />
                    ))}
                    <button onClick={handleDeleteImages} className="text-xs text-red-400 hover:text-red-600">Remove all</button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-300">No reference images</p>
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
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading…" : `+ Images (${imageCount} / ${MAX_IMAGES})`}
              </button>
              <button
                onClick={startEditProduct}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                Edit
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputBase} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Product URL</label>
                <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://…" className={inputBase} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} className={`${inputBase} resize-none`} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveProduct} disabled={savingProduct} className="rounded-lg bg-[#C7F56F] px-4 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50">
                {savingProduct ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditingProduct(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Prompts section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ad Prompts</h2>
            <p className="mt-0.5 text-xs text-gray-400">Each product gets its own unique prompts per template.</p>
          </div>
          {hasUnsavedPrompts && (
            <button
              onClick={handleSavePrompts}
              disabled={savingPrompts}
              className="rounded-lg bg-[#C7F56F] px-3 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
            >
              {savingPrompts ? "Saving…" : "Save Edits"}
            </button>
          )}
        </div>

        {promptError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{promptError}</p>}

        {/* Intent + template selection panel */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Templates &amp; Intent</p>

          {/* Template visual cards */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-600">Select templates to generate</p>
            <div className="grid grid-cols-5 gap-2">
              {TEMPLATES.map((t) => {
                const isSelected = selectedTemplates.includes(t.number);
                return (
                  <button
                    key={t.number}
                    onClick={() => setSelectedTemplates((prev) =>
                      prev.includes(t.number) ? prev.filter((n) => n !== t.number) : [...prev, t.number]
                    )}
                    className={`relative rounded-xl border-2 overflow-hidden transition-all ${isSelected ? "border-[#C7F56F]" : "border-gray-200 opacity-60 hover:opacity-80"}`}
                  >
                    <div className="relative w-full aspect-square bg-gray-100">
                      <Image
                        src={`/templates/template-${t.number}.svg`}
                        alt={t.label}
                        fill
                        className="object-cover"
                        unoptimized
                      />
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
                      <p className="text-xs text-gray-400">{t.aspect}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intent fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Hook &amp; copy intent
              </label>
              <textarea
                value={hookIntent}
                onChange={(e) => setHookIntent(e.target.value)}
                rows={2}
                placeholder="e.g. visual harmony with the kitchen, premium quality, confidence"
                className={`${inputBase} resize-none text-xs`}
              />
              <p className="mt-1 text-xs text-gray-400">What should the headline &amp; CTA communicate?</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Background &amp; scene intent
              </label>
              <textarea
                value={backgroundIntent}
                onChange={(e) => setBackgroundIntent(e.target.value)}
                rows={2}
                placeholder="e.g. dark brown marble counter, minimal props, no extra objects"
                className={`${inputBase} resize-none text-xs`}
              />
              <p className="mt-1 text-xs text-gray-400">What scene, surface, and props should the background use?</p>
            </div>
          </div>

          {/* Variant count */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600">Variants per template</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setNumVariants(n)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${numVariants === n ? "border-[#C7F56F] bg-[#C7F56F]/10 text-[#1a1a1a]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                >
                  {n}
                </button>
              ))}
              <span className="self-center text-xs text-gray-400 ml-1">= {numVariants} unique hook{numVariants !== 1 ? "s" : ""} per template</span>
            </div>
          </div>

          {/* Generate prompts button + progress bar */}
          <div>
            <button
              onClick={handleGeneratePrompts}
              disabled={generatingPrompts || selectedTemplates.length === 0}
              className="rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
            >
              {generatingPrompts
                ? "Generating…"
                : prompts.length > 0
                  ? "Regenerate Prompts"
                  : "Generate Prompts ▶"}
            </button>
            <PromptGenProgressBar active={generatingPrompts} />
          </div>
        </div>

        {/* Prompt list */}
        {prompts.length > 0 && (
          <div className="space-y-2">
            {prompts.map((p) => {
              const tpl = TEMPLATES.find((t) => t.number === p.template_number);
              const edits = editedPrompts[p.template_number];
              const currentBg = edits?.background_prompt ?? p.background_prompt;
              const currentHooks = edits?.hook_variants ?? p.hook_variants;
              const isEdited = !!edits;
              const hasOriginals = !!promptSet?.prompts_json?.prompts_original;

              return (
                <div key={p.template_number} className="rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedTemplate((t) => t === p.template_number ? null : p.template_number)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-xs font-mono font-semibold">
                        {String(p.template_number).padStart(2, "0")}
                      </span>
                      <span className="font-medium capitalize">{p.template_name.replace(/-/g, " ")}</span>
                      <span className="text-xs text-gray-400">{tpl?.aspect ?? p.aspect_ratio}</span>
                      {p.needs_product_images && (
                        <span className="text-xs bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">product ref</span>
                      )}
                      <span className="text-xs bg-gray-50 text-gray-500 rounded px-1.5 py-0.5">{currentHooks.length} hook{currentHooks.length !== 1 ? "s" : ""}</span>
                      {isEdited && (
                        <span className="text-xs bg-amber-50 text-amber-600 rounded px-1.5 py-0.5">edited</span>
                      )}
                    </div>
                    <span className="text-gray-300 text-xs">{expandedTemplate === p.template_number ? "▲" : "▼"}</span>
                  </button>

                  {expandedTemplate === p.template_number && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Background / Scene Prompt</label>
                        <textarea
                          value={currentBg}
                          onChange={(e) => updateBackgroundPrompt(p.template_number, e.target.value)}
                          rows={5}
                          className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 ${textareaBase}`}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-gray-500 uppercase tracking-wide">Hook Variants ({currentHooks.length})</label>
                        <div className="space-y-2">
                          {currentHooks.map((hook, i) => (
                            <div key={i}>
                              <label className="mb-1 block text-xs text-gray-400">Hook {i + 1}</label>
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
                        <button
                          onClick={() => resetPrompt(p.template_number)}
                          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
                        >
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

      {/* Generate Images section */}
      {prompts.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Generate Images</h2>

          {/* Model + Resolution */}
          <div>
            <p className="mb-2 text-sm font-medium">Model &amp; Resolution</p>
            <div className="space-y-2">
              {(Object.entries(MODEL_CONFIGS) as [KieModel, typeof MODEL_CONFIGS[KieModel]][]).map(([id, cfg]) => {
                const isSelected = model === id;
                return (
                  <div
                    key={id}
                    className={`rounded-xl border transition-colors ${isSelected ? "border-[#C7F56F] bg-[#C7F56F]/5" : "border-gray-200 bg-white opacity-60"}`}
                  >
                    <button
                      onClick={() => {
                        setModel(id);
                        if (!cfg.resolutions.includes(resolution)) setResolution(cfg.resolutions[0]);
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div>
                        <span className="text-sm font-semibold">{cfg.label}</span>
                        <span className="ml-2 text-xs text-gray-400">{cfg.description}</span>
                      </div>
                      <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${isSelected ? "border-[#C7F56F] bg-[#C7F56F]" : "border-gray-300"}`} />
                    </button>

                    {isSelected && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-[#C7F56F]/20 px-4 py-3">
                        {cfg.resolutions.map((r) => (
                          <button key={r} onClick={() => setResolution(r)}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${resolution === r ? "border-[#C7F56F] bg-[#C7F56F]/10 text-[#1a1a1a]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                            {r}
                          </button>
                        ))}
                        <span className="text-xs text-gray-400 ml-1">
                          ~${estimatedCost.toFixed(2)} · {templatesWithPrompts.length * numVariantsFromSet} image{templatesWithPrompts.length * numVariantsFromSet !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {genError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{genError}</p>}

          {progress.length > 0 && (
            <div className="space-y-2">
              {progress.map((p) => <ProgressBar key={p.template_number} p={p} />)}
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleGenerate}
              disabled={generating || templatesWithPrompts.length === 0}
              className="rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
            >
              {generating
                ? `Generating… (${progress.filter((p) => p.status === "done").length}/${templatesWithPrompts.length} done)`
                : "Generate Ads ▶"}
            </button>
            <Link href={`/brands/${brandId}/gallery`}
              className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              View Gallery →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
