"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import InspoLibrary from "@/components/InspoLibrary";
import ContentGenerator from "@/components/content/ContentGenerator";
import { CONTENT_TEMPLATES } from "@/lib/content-templates";
import type { Brand, BrandDna, Product } from "@/types";
import { useLanguage } from "@/components/LanguageProvider";

export default function ContentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { t } = useLanguage();

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
        <Link href="/stores" className="hover:text-gray-700 dark:hover:text-gray-200">{t("nav.stores")}</Link>
        <span>/</span>
        <Link href={`/brands/${id}`} className="hover:text-gray-700 dark:hover:text-gray-200">{brand.name}</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">{t("content.title")}</span>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("content.title")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{brand.name}</p>
        </div>
        <Link href={`/brands/${id}/content-gallery`}
          className="rounded-full bg-[#C7F56F] px-4 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors">
          {t("content.viewGallery")} →
        </Link>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {CONTENT_TEMPLATES.map((t) => (
          <button key={t.name} onClick={() => setContentModalTemplate(t.name)}
            className="group flex flex-col items-start rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden text-left hover:border-[#C7F56F] transition-colors">
            <div className="aspect-[4/5] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
              <Image src={t.thumb} alt={t.label} width={240} height={300}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.label}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">{t.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Content Inspo Library */}
      <details className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <summary className="cursor-pointer px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none hover:text-gray-600 dark:hover:text-gray-300">
          {t("content.inspoLibrary")}
        </summary>
        <div className="border-t border-gray-100 dark:border-gray-800 p-5">
          <InspoLibrary brandId={id} type="content" label={t("content.inspoLibraryLabel")} />
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
