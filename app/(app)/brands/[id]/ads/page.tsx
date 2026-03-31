"use client";

import { useEffect, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import InspoPicker from "@/components/InspoPicker";
import InspoLibrary from "@/components/InspoLibrary";
import GeneratingOverlay from "@/components/GeneratingOverlay";
import type { Brand, Product, KieModel } from "@/types";
import { MODEL_CONFIGS } from "@/types";

const AD_TEMPLATES = [
  { number: 1, name: "headline", label: "Headline" },
  { number: 2, name: "offer-promotion", label: "Offer / Promo" },
  { number: 3, name: "testimonial", label: "Testimonial" },
  { number: 4, name: "vs-them", label: "Us vs Them" },
  { number: 5, name: "ugc-lifestyle", label: "UGC Lifestyle" },
];

type Resolution = "1K" | "2K" | "4K";

export default function AdsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [adMode, setAdMode] = useState<"regular" | "batch">("regular");
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([1, 2, 3, 4, 5]);
  const [numImages, setNumImages] = useState(2);
  const [resolution, setResolution] = useState<Resolution>("2K");
  const [model, setModel] = useState<KieModel>("nano-banana-2");
  const [selectedInspo, setSelectedInspo] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState<10 | 20 | 50>(10);
  const [batchTemplates, setBatchTemplates] = useState<string[]>(["headline", "offer-promotion", "testimonial", "vs-them", "ugc-lifestyle"]);

  // Generation progress
  const [generating, setGenerating] = useState(false);
  const [overlayProgress, setOverlayProgress] = useState(0);
  const [overlayMessage, setOverlayMessage] = useState("");
  const [genError, setGenError] = useState<string | null>(null);
  const [genDone, setGenDone] = useState(false);

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

  // Switch model — update resolution to a valid option
  function selectModel(m: KieModel) {
    setModel(m);
    const allowed = MODEL_CONFIGS[m].resolutions;
    if (!allowed.includes(resolution)) {
      setResolution(allowed[0]);
    }
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

    if (!genRes.ok || !genRes.body) {
      const d = await genRes.json().catch(() => ({}));
      setGenError(d.error ?? "Generation failed.");
      setGenerating(false);
      return;
    }

    const { job_ids } = await genRes.json();
    const total = job_ids.length;

    const poll = async () => {
      const jobsRes = await fetch(`/api/brands/${id}/jobs?prompt_set_id=${prompt_set.id}`);
      if (!jobsRes.ok) return;
      const jobs = await jobsRes.json();
      const done = jobs.filter((j: { status: string }) => j.status === "done" || j.status === "failed").length;
      setOverlayProgress(30 + Math.round((done / total) * 70));
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
  }, [id, selectedProductIds, selectedTemplates, numImages, resolution, model, selectedInspo]);

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

  const currentModelConfig = MODEL_CONFIGS[model];

  return (
    <div>
      <GeneratingOverlay visible={generating} progress={overlayProgress} message={overlayMessage} />

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link href="/stores" className="hover:text-gray-700 dark:hover:text-gray-200">Stores</Link>
        <span>/</span>
        <Link href={`/brands/${id}`} className="hover:text-gray-700 dark:hover:text-gray-200">{brand.name}</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">Ad Generator</span>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ad Generator</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{brand.name}</p>
        </div>
        <Link href={`/brands/${id}/gallery`}
          className="rounded-full bg-[#1a1a1a] dark:bg-white px-4 py-1.5 text-xs font-semibold text-[#C7F56F] dark:text-[#1a1a1a] hover:opacity-90 transition-opacity">
          View Gallery →
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">

        {/* Product selection */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Select products <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(max 3)</span>
          </p>
          {products.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              No products yet.{" "}
              <Link href={`/brands/${id}/products/new`} className="text-[#C7F56F] hover:underline">Add one first →</Link>
            </p>
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

                {/* Model */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Generation model</p>
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
                    {currentModelConfig.resolutions.map((r) => (
                      <button key={r} onClick={() => setResolution(r)}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${resolution === r ? "border-[#C7F56F] bg-[#C7F56F]/10 text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                        {r}
                      </button>
                    ))}
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

                {genDone && (
                  <div className="rounded-xl bg-[#C7F56F]/10 border border-[#C7F56F]/30 px-4 py-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Ads generated!</p>
                    <Link href={`/brands/${id}/gallery`} className="text-xs font-semibold text-[#C7F56F] hover:underline">View Gallery →</Link>
                  </div>
                )}

                <button onClick={handleGenerateRegular} disabled={generating || selectedTemplates.length === 0}
                  className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed">
                  Generate Ads ▶
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
                    <strong>Batch mode</strong> uses AI to generate many unique ads automatically. Results may vary. Uses significantly more credits.
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
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Batch complete!</p>
                    <Link href={`/brands/${id}/gallery`} className="text-xs font-semibold text-[#C7F56F] hover:underline">View Gallery →</Link>
                  </div>
                )}

                <button onClick={handleGenerateBatch} disabled={generating || batchTemplates.length === 0}
                  className="rounded-lg bg-[#C7F56F] px-6 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-40 disabled:cursor-not-allowed">
                  Generate Batch ▶
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ad Inspo Library */}
      <details className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <summary className="cursor-pointer px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none hover:text-gray-600 dark:hover:text-gray-300">
          Ad Inspo Library ▼
        </summary>
        <div className="border-t border-gray-100 dark:border-gray-800 p-5">
          <InspoLibrary brandId={id} type="ad" label="Reference images used as style guide during ad generation (max 20)" />
        </div>
      </details>
    </div>
  );
}
