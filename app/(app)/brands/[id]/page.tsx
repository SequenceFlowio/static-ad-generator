"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Phase1Research from "@/components/pipeline/Phase1Research";
import BrandDnaCard from "@/components/BrandDnaCard";
import BrandDnaForm from "@/components/BrandDnaForm";
import type { Brand, BrandDna, BrandDnaData, Product } from "@/types";

export default function BrandPage() {
  const params = useParams();
  const router = useRouter();
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

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>;
  if (!brand) return null;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200">Brands</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">{brand.name}</span>
      </div>

      {/* Brand header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{brand.name}</h1>
        {brand.url && (
          <a href={brand.url} target="_blank" rel="noopener noreferrer"
            className="mt-1 text-xs text-gray-400 dark:text-gray-500 hover:underline">
            {brand.url}
          </a>
        )}
      </div>

      {/* Brand DNA */}
      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Brand DNA</h2>
          {dna && !editingDna && (
            <button
              onClick={() => setDnaOpen((o) => !o)}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {dnaOpen ? "Collapse ▲" : "View / Edit ▼"}
            </button>
          )}
        </div>

        {/* No DNA yet — show research flow */}
        {!dna && (
          <Phase1Research
            brandId={id}
            brandUrl={brand.url ?? ""}
            initialDna={null}
            onComplete={(newDna) => { setDna(newDna); setDnaOpen(true); }}
          />
        )}

        {/* DNA exists — collapsed summary */}
        {dna && !dnaOpen && (
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
            <div className="flex gap-1.5">
              {[dna.data.accent_color, dna.data.lettertype_color, dna.data.background_color]
                .filter(Boolean)
                .map((c, i) => (
                  <div key={i} className="h-5 w-5 rounded-full border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: c! }} />
                ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{dna.data.name}</p>
              {dna.data.positioning && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{dna.data.positioning}</p>
              )}
            </div>
            <span className="text-xs text-gray-300 dark:text-gray-600 flex-shrink-0">
              {new Date(dna.generated_at).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* DNA exists — expanded view */}
        {dna && dnaOpen && !editingDna && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <BrandDnaCard
              data={dna.data}
              onEdit={() => setEditingDna(true)}
              onReResearch={handleReResearch}
              loading={reSearching}
            />
          </div>
        )}

        {/* DNA exists — edit form */}
        {dna && dnaOpen && editingDna && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <BrandDnaForm
              brandId={id}
              initialData={dna.data}
              onSave={handleSaveDna}
              onCancel={() => setEditingDna(false)}
              loading={savingDna}
              saveLabel="Save Changes"
            />
          </div>
        )}
      </section>

      {/* Products */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Products</h2>
          <Link href={`/brands/${id}/gallery`} className="rounded-full bg-[#1a1a1a] px-4 py-1.5 text-xs font-semibold text-[#C7F56F] hover:bg-black transition-colors">
            View Gallery →
          </Link>
        </div>
        {!dna && (
          <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">Complete Brand DNA first to enable product generation.</p>
        )}

        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${!dna ? "opacity-50 pointer-events-none" : ""}`}>
          {products.map((product) => (
            <div key={product.id} className="group relative">
              <Link
                href={`/brands/${id}/products/${product.id}`}
                className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 hover:border-[#C7F56F] hover:shadow-sm transition-all"
              >
                <p className="font-semibold text-sm">{product.name}</p>
                {product.description && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{product.description}</p>
                )}
                {product.url && (
                  <p className="mt-1 text-xs text-gray-300 dark:text-gray-600 truncate">{product.url}</p>
                )}
                <p className="mt-3 text-xs text-[#C7F56F] font-medium">Generate ads →</p>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); handleDeleteProduct(product.id); }}
                disabled={deletingProductId === product.id}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-red-50 dark:bg-red-900/20 px-2 py-1 text-xs text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
              >
                {deletingProductId === product.id ? "…" : "Delete"}
              </button>
            </div>
          ))}

          <Link
            href={`/brands/${id}/products/new`}
            className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-5 hover:border-[#C7F56F] transition-all flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 min-h-[100px]"
          >
            <span className="text-2xl font-light">+</span>
            <span className="text-sm font-medium">Add Product</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
