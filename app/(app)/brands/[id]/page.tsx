"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Phase1Research from "@/components/pipeline/Phase1Research";
import BrandDnaCard from "@/components/BrandDnaCard";
import BrandDnaForm from "@/components/BrandDnaForm";
import type { Brand, BrandDna, BrandDnaData } from "@/types";

export default function BrandPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [dna, setDna] = useState<BrandDna | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDna, setEditingDna] = useState(false);
  const [savingDna, setSavingDna] = useState(false);
  const [reSearching, setReSearching] = useState(false);

  useEffect(() => {
    async function load() {
      const brandRes = await fetch(`/api/brands/${id}`);
      if (!brandRes.ok) { router.push("/"); return; }
      const json = await brandRes.json();
      setBrand(json.brand);
      setDna(json.brand_dna);
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

    </div>
  );
}
