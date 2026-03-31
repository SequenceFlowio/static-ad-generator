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
        <Link href="/stores" className="hover:text-gray-700 dark:hover:text-gray-200">Stores</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">{brand.name}</span>
      </div>

      {/* Brand header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{brand.name}</h1>
          {brand.url && (
            <a href={brand.url} target="_blank" rel="noopener noreferrer"
              className="mt-1 text-xs text-gray-400 dark:text-gray-500 hover:underline">{brand.url}</a>
          )}
        </div>
        {dna && (
          <div className="flex items-center gap-2">
            <Link href={`/brands/${id}/gallery`}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Ad Gallery →
            </Link>
            <Link href={`/brands/${id}/content-gallery`}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Content Gallery →
            </Link>
          </div>
        )}
      </div>

      {/* Brand DNA */}
      <section className="mb-10">
        <div className="mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Brand DNA</h2>
        </div>

        {!dna && (
          <Phase1Research brandId={id} brandUrl={brand.url ?? ""} initialDna={null}
            onComplete={(newDna) => { setDna(newDna); }} />
        )}

        {dna && !editingDna && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <BrandDnaCard data={dna.data} onEdit={() => setEditingDna(true)} onReResearch={handleReResearch} loading={reSearching} />
          </div>
        )}

        {dna && editingDna && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <BrandDnaForm brandId={id} initialData={dna.data} onSave={handleSaveDna} onCancel={() => setEditingDna(false)} loading={savingDna} saveLabel="Save Changes" />
          </div>
        )}
      </section>

      {/* Quick actions — only shown when DNA exists */}
      {dna && (
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Generate</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href={`/brands/${id}/ads`}
              className="group rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-left hover:border-[#C7F56F] hover:shadow-sm transition-all">
              <div className="mb-3 text-3xl">🎯</div>
              <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Generate Ads</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">Product-based static ad creatives — headlines, offers, testimonials, UGC.</p>
              <p className="mt-4 text-xs font-semibold text-[#C7F56F]">Open Ad Generator →</p>
            </Link>
            <Link href={`/brands/${id}/content`}
              className="group rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-left hover:border-[#C7F56F] hover:shadow-sm transition-all">
              <div className="mb-3 text-3xl">📱</div>
              <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Generate Social Content</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">Brand-level social posts — tips, stories, lifestyle, behind the scenes.</p>
              <p className="mt-4 text-xs font-semibold text-[#C7F56F]">Open Content Generator →</p>
            </Link>
          </div>
        </section>
      )}

      {!dna && (
        <section className="mb-10">
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

      {/* Products */}
      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Products</h2>
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
      </section>
    </div>
  );
}
