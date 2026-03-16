"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Brand, Product, PromptSet, PromptItem, SseEvent, Resolution } from "@/types";

const TEMPLATES = [
  { number: 1, name: "headline", label: "01 Headline", aspect: "4:5" },
  { number: 2, name: "offer-promotion", label: "02 Offer / Promotion", aspect: "4:5" },
  { number: 3, name: "testimonial", label: "03 Testimonial", aspect: "1:1" },
  { number: 4, name: "vs-them", label: "04 Us vs Them", aspect: "4:5" },
  { number: 5, name: "ugc-lifestyle", label: "05 UGC Lifestyle", aspect: "9:16" },
];

const COST_PER_IMAGE: Record<Resolution, number> = {
  "1K": 0.04,
  "2K": 0.06,
  "4K": 0.09,
};

interface TemplateProgress {
  template_number: number;
  status: "idle" | "running" | "done" | "error";
  image_urls?: string[];
  error?: string;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;
  const productId = params.productId as string;

  // Data
  const [brand, setBrand] = useState<Brand | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [promptSet, setPromptSet] = useState<PromptSet | null>(null);
  const [loading, setLoading] = useState(true);

  // Product editing
  const [editingProduct, setEditingProduct] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);

  // Prompts
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const [editedPrompts, setEditedPrompts] = useState<Record<number, string>>({});
  const [savingPrompts, setSavingPrompts] = useState(false);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [promptError, setPromptError] = useState("");

  // Image generation
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([1, 2, 3, 4, 5]);
  const [resolution, setResolution] = useState<Resolution>("2K");
  const [numImages, setNumImages] = useState(2);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<TemplateProgress[]>([]);
  const [genError, setGenError] = useState("");

  // Image upload
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
      }
      setLoading(false);
    }
    load();
  }, [brandId, productId, router]);

  // Product save
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

  // Generate prompts
  async function handleGeneratePrompts() {
    setGeneratingPrompts(true);
    setPromptError("");
    const res = await fetch(`/api/brands/${brandId}/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    });
    const data = await res.json();
    setGeneratingPrompts(false);
    if (!res.ok) { setPromptError(data.error ?? "Prompt generation failed."); return; }
    setPromptSet(data.prompt_set);
    setPrompts(data.prompt_set.prompts_json.prompts);
    setEditedPrompts({});
  }

  // Save edited prompts
  async function handleSavePrompts() {
    if (!promptSet) return;
    setSavingPrompts(true);
    const updatedPrompts = prompts.map((p) => ({
      ...p,
      prompt: editedPrompts[p.template_number] ?? p.prompt,
    }));
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

  // Reset a prompt to original
  function resetPrompt(templateNumber: number) {
    const originals = promptSet?.prompts_json?.prompts_original;
    if (!originals) return;
    const original = originals.find((p) => p.template_number === templateNumber);
    if (!original) return;
    setEditedPrompts((prev) => ({ ...prev, [templateNumber]: original.prompt }));
  }

  const hasUnsavedPrompts = Object.keys(editedPrompts).length > 0;

  // Upload product images
  async function handleUploadImages(files: FileList) {
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
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

  // Image generation
  const handleGenerate = useCallback(async () => {
    if (!promptSet || selectedTemplates.length === 0) return;
    setGenerating(true);
    setGenError("");
    setProgress(selectedTemplates.map((n) => ({ template_number: n, status: "idle" })));

    const res = await fetch(`/api/brands/${brandId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_numbers: selectedTemplates,
        resolution,
        num_images: numImages,
        prompt_set_id: promptSet.id,
      }),
    });

    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      setGenError((data as { error?: string }).error ?? "Generation failed.");
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
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const event: SseEvent = JSON.parse(raw);
          if (event.type === "start") {
            setProgress((prev) => prev.map((p) => p.template_number === event.template_number ? { ...p, status: "running" } : p));
          } else if (event.type === "done") {
            setProgress((prev) => prev.map((p) => p.template_number === event.template_number ? { ...p, status: "done", image_urls: event.image_urls } : p));
          } else if (event.type === "error") {
            setProgress((prev) => prev.map((p) => p.template_number === event.template_number ? { ...p, status: "error", error: event.error } : p));
          } else if (event.type === "complete") {
            setGenerating(false);
          }
        } catch { /* ignore */ }
      }
    }
    setGenerating(false);
  }, [brandId, promptSet, selectedTemplates, resolution, numImages]);

  const estimatedCost = selectedTemplates.length * numImages * (COST_PER_IMAGE[resolution] ?? 0.06);
  const inputBase = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30";

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
            <div className="flex gap-2 flex-shrink-0">
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
                disabled={uploading}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "+ Images"}
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
          {prompts.length > 0 && (
            <div className="flex gap-2">
              {hasUnsavedPrompts && (
                <button
                  onClick={handleSavePrompts}
                  disabled={savingPrompts}
                  className="rounded-lg bg-[#C7F56F] px-3 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
                >
                  {savingPrompts ? "Saving…" : "Save Edits"}
                </button>
              )}
              <button
                onClick={handleGeneratePrompts}
                disabled={generatingPrompts}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {generatingPrompts ? "Regenerating…" : "Regenerate All"}
              </button>
            </div>
          )}
        </div>

        {promptError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{promptError}</p>}

        {/* No prompts yet */}
        {prompts.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <p className="mb-4 text-sm text-gray-400">No prompts generated yet for this product.</p>
            <button
              onClick={handleGeneratePrompts}
              disabled={generatingPrompts}
              className="rounded-lg bg-[#C7F56F] px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
            >
              {generatingPrompts ? "Generating… (~30s)" : "Generate Prompts ▶"}
            </button>
          </div>
        )}

        {/* Prompt list */}
        {prompts.length > 0 && (
          <div className="space-y-2">
            {prompts.map((p) => {
              const tpl = TEMPLATES.find((t) => t.number === p.template_number);
              const currentText = editedPrompts[p.template_number] ?? p.prompt;
              const isEdited = editedPrompts[p.template_number] !== undefined;
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
                      {isEdited && (
                        <span className="text-xs bg-amber-50 text-amber-600 rounded px-1.5 py-0.5">edited</span>
                      )}
                    </div>
                    <span className="text-gray-300 text-xs">{expandedTemplate === p.template_number ? "▲" : "▼"}</span>
                  </button>
                  {expandedTemplate === p.template_number && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                      <textarea
                        value={currentText}
                        onChange={(e) => setEditedPrompts((prev) => ({ ...prev, [p.template_number]: e.target.value }))}
                        rows={6}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs leading-relaxed text-gray-700 outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30 resize-y font-mono"
                      />
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

          {/* Template checkboxes */}
          <div>
            <p className="mb-2 text-sm font-medium">Select templates</p>
            <div className="space-y-0.5">
              {TEMPLATES.map((t) => (
                <label key={t.number} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedTemplates.includes(t.number)}
                    onChange={() => setSelectedTemplates((prev) =>
                      prev.includes(t.number) ? prev.filter((n) => n !== t.number) : [...prev, t.number]
                    )}
                    className="rounded border-gray-300 accent-[#C7F56F]"
                  />
                  <span className="text-sm">{t.label}</span>
                  <span className="text-xs text-gray-400">{t.aspect}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images per template */}
          <div>
            <p className="mb-2 text-sm font-medium">Images per template</p>
            <div className="flex gap-2">
              {[1, 2, 4].map((n) => (
                <button key={n} onClick={() => setNumImages(n)}
                  className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${numImages === n ? "border-[#C7F56F] bg-[#C7F56F]/10 text-[#1a1a1a]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div>
            <p className="mb-2 text-sm font-medium">Resolution</p>
            <div className="flex flex-wrap items-center gap-2">
              {(["1K", "2K", "4K"] as Resolution[]).map((r) => (
                <button key={r} onClick={() => setResolution(r)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${resolution === r ? "border-[#C7F56F] bg-[#C7F56F]/10 text-[#1a1a1a]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  {r}
                </button>
              ))}
              <span className="text-xs text-gray-400">
                ~${estimatedCost.toFixed(2)} · {selectedTemplates.length * numImages} images
              </span>
            </div>
          </div>

          {genError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{genError}</p>}

          {/* Progress */}
          {progress.length > 0 && (
            <div className="space-y-2">
              {progress.map((p) => {
                const tpl = TEMPLATES.find((t) => t.number === p.template_number);
                return (
                  <div key={p.template_number} className="flex items-center gap-3 text-sm">
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${p.status === "done" ? "bg-[#C7F56F] text-[#1a1a1a]" : p.status === "error" ? "bg-red-100 text-red-500" : p.status === "running" ? "bg-blue-100 text-blue-600 animate-pulse" : "bg-gray-100 text-gray-400"}`}>
                      {p.status === "done" ? "✓" : p.status === "error" ? "✗" : p.status === "running" ? "…" : "○"}
                    </span>
                    <span className="text-gray-600">{tpl?.label ?? `Template ${p.template_number}`}</span>
                    {p.status === "error" && <span className="text-xs text-red-400 truncate max-w-[200px]">{p.error}</span>}
                    {p.status === "done" && p.image_urls && <span className="text-xs text-gray-400">{p.image_urls.length} images</span>}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleGenerate}
              disabled={generating || selectedTemplates.length === 0}
              className="rounded-lg bg-[#C7F56F] px-5 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
            >
              {generating
                ? `Generating… (${progress.filter((p) => p.status === "done").length}/${selectedTemplates.length} done)`
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
