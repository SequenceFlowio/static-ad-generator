"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import InspoLibrary from "@/components/InspoLibrary";
import ContentGenerator from "@/components/content/ContentGenerator";
import { CONTENT_TEMPLATES } from "@/lib/content-templates";
import type { Brand, BrandDna, Product } from "@/types";

export default function ContentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [dna, setDna] = useState<BrandDna | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentModalTemplate, setContentModalTemplate] = useState<string | null>(null);

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
      setDna(json.brand_dna);
      setProducts(Array.isArray(prods) ? prods : []);
      setLoading(false);
      if (!json.brand_dna) {
        router.push(`/brands/${id}`);
      }
    }
    load();
  }, [id, router]);

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>;
  if (!brand || !dna) return null;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <Link href="/stores" className="hover:text-gray-700 dark:hover:text-gray-200">Stores</Link>
        <span>/</span>
        <Link href={`/brands/${id}`} className="hover:text-gray-700 dark:hover:text-gray-200">{brand.name}</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">Content Generator</span>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Generator</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{brand.name}</p>
        </div>
        <Link href={`/brands/${id}/content-gallery`}
          className="rounded-full bg-[#1a1a1a] dark:bg-white px-4 py-1.5 text-xs font-semibold text-[#C7F56F] dark:text-[#1a1a1a] hover:opacity-90 transition-opacity">
          View Gallery →
        </Link>
      </div>

      {/* Template grid */}
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

      {/* Content Inspo Library */}
      <details className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <summary className="cursor-pointer px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none hover:text-gray-600 dark:hover:text-gray-300">
          Content Inspo Library ▼
        </summary>
        <div className="border-t border-gray-100 dark:border-gray-800 p-5">
          <InspoLibrary brandId={id} type="content" label="Reference images used as style guide during content generation (max 20)" />
        </div>
      </details>

      {/* Content Generator modal */}
      {contentModalTemplate && (
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
