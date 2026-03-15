"use client";

import { useEffect, useRef, useState } from "react";
import type { Product, PromptSet } from "@/types";

interface Props {
  brandId: string;
  hasDna: boolean;
  initialPromptSet: PromptSet | null;
  onComplete: (ps: PromptSet) => void;
}

export default function Phase2Prompts({ brandId, hasDna, initialPromptSet, onComplete }: Props) {
  const [promptSet, setPromptSet] = useState<PromptSet | null>(initialPromptSet);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(!initialPromptSet && hasDna);
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasDna) return;
    fetch(`/api/brands/${brandId}/products`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setProducts(d);
      });
  }, [brandId, hasDna]);

  async function handleCreateProduct() {
    if (!newName.trim()) return;
    const res = await fetch(`/api/brands/${brandId}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to create product."); return; }
    setProducts((prev) => [data, ...prev]);
    setSelectedProduct(data);
    setShowNewProduct(false);
    setNewName("");
    setNewDesc("");
  }

  async function handleUploadImages(productId: string, files: FileList) {
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    const res = await fetch(`/api/brands/${brandId}/products/${productId}/images`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error ?? "Upload failed."); return; }
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, image_urls: data.urls } : p))
    );
    setSelectedProduct((prev) => prev?.id === productId ? { ...prev, image_urls: data.urls } : prev);
  }

  async function handleDeleteImages(productId: string) {
    await fetch(`/api/brands/${brandId}/products/${productId}/images`, { method: "DELETE" });
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, image_urls: [] } : p))
    );
    setSelectedProduct((prev) => prev?.id === productId ? { ...prev, image_urls: [] } : prev);
  }

  async function handleGenerate() {
    if (!selectedProduct) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/brands/${brandId}/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: selectedProduct.id }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Prompt generation failed."); return; }
    setPromptSet(data.prompt_set);
    onComplete(data.prompt_set);
  }

  const prompts = promptSet?.prompts_json?.prompts ?? [];

  return (
    <div className={`rounded-xl border bg-white overflow-hidden ${!hasDna ? "opacity-50 pointer-events-none" : "border-gray-200"}`}>
      <button
        onClick={() => hasDna && setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${promptSet ? "bg-[#C7F56F] text-[#1a1a1a]" : "bg-gray-100 text-gray-500"}`}>
            {promptSet ? "✓" : "2"}
          </span>
          <div>
            <p className="font-semibold text-sm">Phase 2 — Product & Prompts</p>
            <p className="text-xs text-gray-400">
              {promptSet
                ? `Prompts generated for "${promptSet.product_name}"`
                : hasDna ? "Select or create a product, then generate prompts"
                : "Complete Phase 1 first"}
            </p>
          </div>
        </div>
        <span className="text-gray-300 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && hasDna && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-5">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          {/* Product list */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Products</p>
              <button
                onClick={() => setShowNewProduct((s) => !s)}
                className="text-xs text-[#1a1a1a] underline underline-offset-2 hover:no-underline"
              >
                + New product
              </button>
            </div>

            {/* New product form */}
            {showNewProduct && (
              <div className="mb-3 rounded-xl border border-dashed border-gray-300 p-4 space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Product name (e.g. Cast Iron Skillet)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30"
                />
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Short product description (optional) — helps the AI write better copy"
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#C7F56F] focus:ring-2 focus:ring-[#C7F56F]/30 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateProduct}
                    disabled={!newName.trim()}
                    className="rounded-lg bg-[#C7F56F] px-3 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
                  >
                    Save Product
                  </button>
                  <button onClick={() => setShowNewProduct(false)} className="text-xs text-gray-400 hover:text-gray-600">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {products.length === 0 && !showNewProduct && (
              <p className="text-xs text-gray-400">No products yet. Create one above.</p>
            )}

            <div className="space-y-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 cursor-pointer transition-colors ${selectedProduct?.id === p.id ? "border-[#C7F56F] bg-[#C7F56F]/5" : "border-gray-200 hover:border-gray-300"}`}
                  onClick={() => setSelectedProduct(p)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      {p.description && <p className="mt-0.5 text-xs text-gray-400">{p.description}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {p.image_urls.length > 0 && (
                        <span className="text-xs text-gray-400">{p.image_urls.length} img</span>
                      )}
                      {selectedProduct?.id === p.id && (
                        <span className="ml-1 text-xs text-[#1a1a1a] font-medium">Selected</span>
                      )}
                    </div>
                  </div>

                  {/* Product images section (only for selected) */}
                  {selectedProduct?.id === p.id && (
                    <div className="mt-3 border-t border-gray-100 pt-3" onClick={(e) => e.stopPropagation()}>
                      <p className="mb-2 text-xs font-medium text-gray-500">Reference Images</p>
                      {p.image_urls.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {p.image_urls.map((url, i) => (
                            <img key={i} src={url} alt="" className="h-14 w-14 rounded-lg object-cover border border-gray-200" />
                          ))}
                          <button
                            onClick={() => handleDeleteImages(p.id)}
                            className="self-end text-xs text-red-400 hover:text-red-600"
                          >
                            Remove all
                          </button>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleUploadImages(p.id, e.target.files)}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-400 disabled:opacity-50"
                      >
                        {uploading ? "Uploading…" : "+ Upload product images"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !selectedProduct}
            className="w-full rounded-lg bg-[#C7F56F] px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50"
          >
            {loading
              ? "Generating prompts… (~30s)"
              : selectedProduct
              ? `Generate Prompts for "${selectedProduct.name}" ▶`
              : "Select a product first"}
          </button>

          {/* Prompt previews */}
          {prompts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Generated Prompts</p>
              {prompts.map((p) => (
                <div key={p.template_number} className="rounded-lg border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedTemplate((t) => t === p.template_number ? null : p.template_number)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-xs font-mono font-semibold">
                        {String(p.template_number).padStart(2, "0")}
                      </span>
                      <span className="font-medium capitalize">{p.template_name.replace(/-/g, " ")}</span>
                      <span className="text-gray-400 text-xs">{p.aspect_ratio}</span>
                      {p.needs_product_images && (
                        <span className="text-xs bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">product ref</span>
                      )}
                    </div>
                    <span className="text-gray-300">{expandedTemplate === p.template_number ? "▲" : "▼"}</span>
                  </button>
                  {expandedTemplate === p.template_number && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs leading-relaxed text-gray-600 whitespace-pre-wrap">{p.prompt}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
