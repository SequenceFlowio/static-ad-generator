"use client";

import { useEffect, useCallback, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Phase1Research from "@/components/pipeline/Phase1Research";
import BrandDnaCard from "@/components/BrandDnaCard";
import BrandDnaForm from "@/components/BrandDnaForm";
import InspoLibrary from "@/components/InspoLibrary";
import InspoPicker from "@/components/InspoPicker";
import GeneratingOverlay from "@/components/GeneratingOverlay";
import ContentGenerator from "@/components/content/ContentGenerator";
import { CONTENT_TEMPLATES } from "@/lib/content-templates";
import type { Brand, BrandDna, BrandDnaData, Product } from "@/types";

const AD_TEMPLATES = [
  { number: 1, name: "headline", label: "Headline" },
  { number: 2, name: "offer-promotion", label: "Offer / Promo" },
  { number: 3, name: "testimonial", label: "Testimonial" },
  { number: 4, name: "vs-them", label: "Us vs Them" },
  { number: 5, name: "ugc-lifestyle", label: "UGC Lifestyle" },
];

type Resolution = "1K" | "2K" | "4K";

export default function BrandPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [dna, setDna] = useState<BrandDna | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dnaOpen, setDnaOpen] = useState(false);
  const [editingDna, setEditingDna] = useState(false);
  const [savingDna, setSavingDna] = useState(false);
  const [reSearching, setReSearching] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Mode
  const [mode, setMode] = useState<"ads" | "content" | null>(null);

  // Ads generation state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [adMode, setAdMode] = useState<"regular" | "batch">("regular");
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([1, 2, 3, 4, 5]);
  const [numImages, setNumImages] = useState(2);
  const [resolution, setResolution] = useState<Resolution>("2K");
  const [selectedInspo, setSelectedInspo] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState<10 | 20 | 50>(10);
  const [batchTemplates, setBatchTemplates] = useState<string[]>(["headline", "offer-promotion", "testimonial", "vs-them", "ugc-lifestyle"]);

  // Generation progress
  const [generating, setGenerating] = useState(false);
  const [overlayProgress, setOverlayProgress] = useState(0);
  const [overlayMessage, setOverlayMessage] = useState("");
  const [genError, setGenError] = useState<string | null>(null);
  const [genDone, setGenDone] = useState(false);

  // Content modal
  const [contentModalTemplate, setContentModalTemplate] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [brandRes, productsRes] = await Promise.all([
        fetch(`/api/brands/${id}`),
        fetch(`/api/brands/${id}/products`),
      ]);
      if (!brandRes.ok) { router.push("/"); return; }
      const json = await brandRes.json();
      const prods = await productsRes.json();
      setBrand(json.brand);
      setDna(json.brand_dna);
      setProducts(Array.isArray(prods) ? prods : []);
      setLoading(false);
      if (!json.brand_dna) setDnaOpen(true);
    }
    load();
  }, [id, router]);

  // Initialize mode from URL param
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "ads" || urlMode === "content") setMode(urlMode);
  }, [searchParams]);

  async function handleSaveDna(formData: Partial<BrandDnaData>) {
    setSavingDna(true);
    const res = await fetch(`/api/brands/${id}/research`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    setSavingDna(false);
    if (!res.ok) return;
    setDna(data.brand_dna);
    setEditingDna(false);
  }

  async function handleDeleteProduct(productId: string) {
    setDeletingProductId(productId);
    await fetch(`/api/brands/${id}/products/${productId}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setSelectedProductIds((prev) => prev.filter((pid) => pid !== productId));
    setDeletingProductId(null);
  }

  async function handleReResearch() {
    setReSearching(true);
    const res = await fetch(`/api/brands/${id}/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manual: {} }),
    });
    const data = await res.json();
    setReSearching(false);
    if (!res.ok) return;
    setDna(data.brand_dna);
    setEditingDna(false);
  }

  function toggleProductSelect(productId: string) {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) return prev.filter((p) => p !== productId);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, productId];
    });
  }

  function toggleTemplate(n: number) {
    setSelectedTemplates((prev) => prev.includes(n) ? prev.filter((t) => t !== n) : [...prev, n]);
  }

  function toggleBatchTemplate(name: string) {
    setBatchTemplates((prev) => prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]);
  }

  const handleGenerateRegular = useCallback(async () => {
    if (selectedProductIds.length === 0 || selectedTemplates.length === 0) return;
    setGenerating(true);
    setGenDone(false);
    setGenError(null);
    setOverlayProgress(5);
    setOverlayMessage("Generating ad concepts...");

    // Step 1: Phase2 — create prompt set
    const promptRes = await fetch(`/api/brands/${id}/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_ids: selectedProductIds,
        product_id: selectedProductIds[0], // backwards compat
        num_variants: numImages,
        template_numbers: selectedTemplates,
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
    setOverlayMessage("Creating your ads...");

    // Step 2: Phase3 — generate images via SSE
    const genRes = await fetch(`/api/brands/${id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_numbers: selectedTemplates,
        resolution,
        num_images: numImages,
        prompt_set_id: prompt_set.id,
        inspo_image_urls: selectedInspo,
      }),
    });

    if (!genRes.ok || !genRes.body) {
      const d = await genRes.json().catch(() => ({}));
      setGenError(d.error ?? "Generation failed.");
      setGenerating(false);
      return;
    }

    // Poll for job completion
    const { job_ids } = await genRes.json();
    const total = job_ids.length;
    let done = 0;

    const poll = async () => {
      const jobsRes = await fetch(`/api/brands/${id}/jobs?prompt_set_id=${prompt_set.id}`);
      if (!jobsRes.ok) return;
      const jobs = await jobsRes.json();
      const completedJobs = jobs.filter((j: { status: string }) => j.status === "done" || j.status === "failed");
      done = completedJobs.length;
      const pct = 30 + Math.round((done / total) * 70);
      setOverlayProgress(pct);
      setOverlayMessage(`Creating your ads... (${done}/${total})`);

      if (done < total) {
        setTimeout(poll, 3000);
      } else {
        setOverlayProgress(100);
        setOverlayMessage("Done!");
        await new Promise((r) => setTimeout(r, 500));
        setGenerating(false);
        setGenDone(true);
      }
    };
    await poll();
  }, [id, selectedProductIds, selectedTemplates, numImages, resolution, selectedInspo]);

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

    // SSE stream
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
            const pct = Math.round(((event.done ?? 0) / (event.total ?? batchSize)) * 100);
            setOverlayProgress(pct);
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
      {/* Overlay */}
      <GeneratingOverlay visible={generating} progress={overlayProgress} message={overlayMessage} />

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link href="/stores" className="hover:text-gray-700 dark:hover:text-gray-200">Stores</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">{brand.name}</span>
      </div>

      {/* Brand header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{brand.name}</h1>
        {brand.url && (
          <a href={brand.url} target="_blank" rel="noopener noreferrer"
            className="mt-1 text-xs text-gray-400 dark:text-gray-500 hover:underline">{brand.url}</a>
        )}
      </div>

      {/* Brand DNA */}
      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Brand DNA</h2>
          {dna && !editingDna && (
            <button onClick={() => setDnaOpen((o) => !o)} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              {dnaOpen ? "Collapse ▲" : "View / Edit ▼"}
            </button>
          )}
        </div>

        {!dna && (
          <Phase1Research brandId={id} brandUrl={brand.url ?? ""} initialDna={null}
            onComplete={(newDna) => { setDna(newDna); setDnaOpen(true); }} />
        )}

        {dna && !dnaOpen && (
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
            <div className="flex gap-1.5">
              {[dna.data.accent_color, dna.data.lettertype_color, dna.data.background_color].filter(Boolean).map((c, i) => (
                <div key={i} className="h-5 w-5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: c! }} />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{dna.data.name}</p>
              {dna.data.positioning && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{dna.data.positioning}</p>}
            </div>
            <span className="text-xs text-gray-300 dark:text-gray-600 flex-shrink-0">{new Date(dna.generated_at).toLocaleDateString()}</span>
          </div>
        )}

        {dna && dnaOpen && !editingDna && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <BrandDnaCard data={dna.data} onEdit={() => setEditingDna(true)} onReResearch={handleReResearch} loading={reSearching} />
          </div>
        )}

        {dna && dnaOpen && editingDna && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <BrandDnaForm brandId={id} initialData={dna.data} onSave={handleSaveDna} onCancel={() => setEditingDna(false)} loading={savingDna} saveLabel="Save Changes" />
          </div>
        )}
      </section>

      {/* Mode selector */}
      {dna && !mode && (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">What do you want to create?</h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setMode("ads")}
              className="group rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-left hover:border-[#C7F56F] hover:shadow-sm transition-all">
              <div className="mb-3 text-3xl">🎯</div>
              <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Generate Ads</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">Product-based static ad creatives — headlines, offers, testimonials, UGC.</p>
              <p className="mt-4 text-xs font-semibold text-[#C7F56F]">Select →</p>
            </button>
            <button onClick={() => setMode("content")}
              className="group rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-left hover:border-[#C7F56F] hover:shadow-sm transition-all">
              <div className="mb-3 text-3xl">📱</div>
              <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Generate Social Content</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">Brand-level social posts — tips, stories, lifestyle, behind the scenes.</p>
              <p className="mt-4 text-xs font-semibold text-[#C7F56F]">Select →</p>
            </button>
          </div>
        </section>
      )}

      {!dna && (
        <section>
          <div className="grid grid-cols-2 gap-4 opacity-40 pointer-events-none">
            <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
              <div className="mb-3 text-3xl">🎯</div>
              <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Generate Ads</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Complete Brand DNA first.</p>
            </div>
            <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
              <div className="mb-3 text-3xl">📱</div>
              <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Generate Social Content</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Complete Brand DNA first.</p>
            </div>
          </div>
        </section>
      )}

      {/* ── ADS MODE ──────────────────────────────── */}
      {mode === "ads" && (
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setMode(null)} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">← Back</button>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Ad Generator</h2>
            </div>
            <Link href={`/brands/${id}/gallery`} className="rounded-full bg-[#1a1a1a] px-4 py-1.5 text-xs font-semibold text-[#C7F56F] hover:bg-black transition-colors">
              View Gallery →
            </Link>
          </div>

          {/* Products: manage */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Products</p>
              <Link href={`/brands/${id}/products/new`} className="text-xs font-medium text-[#C7F56F] hover:underline">+ Add product</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div key={product.id} className="group relative flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                  <Link href={`/brands/${id}/products/${product.id}`} className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{product.name}</p>
                    {product.description && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{product.description}</p>}
                    <p className="mt-2 text-[10px] text-gray-300 dark:text-gray-600">Click to edit →</p>
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); handleDeleteProduct(product.id); }}
                    disabled={deletingProductId === product.id}
                    className="opacity-0 group-hover:opacity-100 rounded-lg bg-red-50 dark:bg-red-900/20 px-2 py-1 text-xs text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-opacity flex-shrink-0"
                  >
                    {deletingProductId === product.id ? "…" : "Delete"}
                  </button>
                </div>
              ))}
              <Link
                href={`/brands/${id}/products/new`}
                className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-4 hover:border-[#C7F56F] transition-all flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 min-h-[80px]"
              >
                <span className="text-xl font-light">+</span>
                <span className="text-xs font-medium">Add Product</span>
              </Link>
            </div>
          </div>

          {/* Generate Ads section */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
            <p className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Generate Ads</p>

            {/* Product selection */}
            <div className="mb-5">
              <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Select products to advertise <span className="text-gray-400 dark:text-gray-500 font-normal">(max 3)</span></p>
              {products.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">Add a product first to generate ads.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {products.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    const isDisabled = !isSelected && selectedProductIds.length >= 3;
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleProductSelect(p.id)}
                        disabled={isDisabled}
                        title={isDisabled ? "Max 3 products" : undefined}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSelected
                            ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white font-medium"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] ${isSelected ? "border-[#C7F56F] bg-[#C7F56F] text-[#1a1a1a]" : "border-gray-300 dark:border-gray-600"}`}>
                          {isSelected ? "✓" : ""}
                        </span>
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedProductIds.length >= 3 && (
                <p className="mt-1.5 text-xs text-amber-500 dark:text-amber-400">Max 3 products selected.</p>
              )}
            </div>

            {/* Settings — only when products selected */}
            {selectedProductIds.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-5 space-y-5">
                {/* Regular / Batch toggle */}
                <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
                  {(["regular", "batch"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setAdMode(m)}
                      className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-colors capitalize ${adMode === m ? "bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {adMode === "regular" && (
                  <div className="space-y-4">
                    {/* Templates */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Templates</p>
                      <div className="flex flex-wrap gap-2">
                        {AD_TEMPLATES.map((t) => (
                          <button key={t.number} onClick={() => toggleTemplate(t.number)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${selectedTemplates.includes(t.number) ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Variants */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Images per template</p>
                      <div className="flex gap-2">
                        {[1, 2, 4].map((n) => (
                          <button key={n} onClick={() => setNumImages(n)}
                            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${numImages === n ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resolution */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Resolution</p>
                      <div className="flex gap-2">
                        {(["1K", "2K", "4K"] as Resolution[]).map((r) => (
                          <button key={r} onClick={() => setResolution(r)}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${resolution === r ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Inspo */}
                    <InspoPicker brandId={id} type="ad" selected={selectedInspo} onSelect={setSelectedInspo} />

                    {genError && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{genError}</div>}

                    {genDone && (
                      <div className="rounded-xl bg-[#C7F56F]/10 border border-[#C7F56F]/30 px-4 py-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">Ads generated!</p>
                        <Link href={`/brands/${id}/gallery`} className="text-xs font-semibold text-[#C7F56F] hover:underline">View Gallery →</Link>
                      </div>
                    )}

                    <button
                      onClick={handleGenerateRegular}
                      disabled={generating || selectedTemplates.length === 0}
                      className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Generate Ads ▶
                    </button>
                  </div>
                )}

                {adMode === "batch" && (
                  <div className="space-y-4">
                    {/* Warning */}
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
                      <svg className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        <strong>Batch mode</strong> uses AI to generate many unique ads automatically. Results may vary compared to manual generation. Uses significantly more credits.
                      </p>
                    </div>

                    {/* Templates */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Allowed templates <span className="text-gray-400 dark:text-gray-500 font-normal">(AI picks from these)</span></p>
                      <div className="flex flex-wrap gap-2">
                        {AD_TEMPLATES.map((t) => (
                          <button key={t.name} onClick={() => toggleBatchTemplate(t.name)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${batchTemplates.includes(t.name) ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Batch size */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Batch size</p>
                      <div className="flex gap-2">
                        {([10, 20, 50] as const).map((n) => (
                          <button key={n} onClick={() => setBatchSize(n)}
                            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${batchSize === n ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resolution */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Resolution</p>
                      <div className="flex gap-2">
                        {(["1K", "2K", "4K"] as Resolution[]).map((r) => (
                          <button key={r} onClick={() => setResolution(r)}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${resolution === r ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Variants — greyed out */}
                    <div className="opacity-40 pointer-events-none">
                      <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Images per template</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">AI decides — 1 unique image per concept</p>
                    </div>

                    {/* Inspo */}
                    <InspoPicker brandId={id} type="ad" selected={selectedInspo} onSelect={setSelectedInspo} />

                    {genError && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">{genError}</div>}

                    {genDone && (
                      <div className="rounded-xl bg-[#C7F56F]/10 border border-[#C7F56F]/30 px-4 py-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">Batch complete!</p>
                        <Link href={`/brands/${id}/gallery`} className="text-xs font-semibold text-[#C7F56F] hover:underline">View Gallery →</Link>
                      </div>
                    )}

                    <button
                      onClick={handleGenerateBatch}
                      disabled={generating || batchTemplates.length === 0}
                      className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Generate Batch ▶
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ad Inspo Library */}
          <details className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <summary className="cursor-pointer px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none hover:text-gray-600 dark:hover:text-gray-300">
              Ad Inspo Library ▼
            </summary>
            <div className="border-t border-gray-100 dark:border-gray-800 p-5">
              <InspoLibrary brandId={id} type="ad" label="Reference images used as style guide during ad generation (max 20)" />
            </div>
          </details>
        </section>
      )}

      {/* ── CONTENT MODE ──────────────────────────── */}
      {mode === "content" && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setMode(null)} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">← Back</button>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Social Content Generator</h2>
            </div>
            <Link href={`/brands/${id}/content-gallery`} className="rounded-full bg-[#1a1a1a] px-4 py-1.5 text-xs font-semibold text-[#C7F56F] hover:bg-black transition-colors">
              View Gallery →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {CONTENT_TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => setContentModalTemplate(t.name)}
                className="flex flex-col items-start gap-1 rounded-xl border-2 border-gray-200 dark:border-gray-700 px-4 py-3 text-left hover:border-[#C7F56F] hover:bg-[#C7F56F]/5 transition-colors">
                <span className="text-xl">{t.icon}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.label}</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">{t.description}</span>
              </button>
            ))}
          </div>

          <details className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <summary className="cursor-pointer px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none hover:text-gray-600 dark:hover:text-gray-300">
              Content Inspo Library ▼
            </summary>
            <div className="border-t border-gray-100 dark:border-gray-800 p-5">
              <InspoLibrary brandId={id} type="content" label="Reference images used as style guide during content generation (max 20)" />
            </div>
          </details>
        </section>
      )}

      {/* Content Generator modal */}
      {contentModalTemplate && dna && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <ContentGenerator
              brandId={id}
              brandDna={dna.data}
              products={products}
              initialTemplate={contentModalTemplate}
              onCreated={() => {}}
              onClose={() => setContentModalTemplate(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
