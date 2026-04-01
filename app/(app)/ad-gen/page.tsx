"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import type { Brand } from "@/types";

export default function AdGenPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((data) => {
        const list: Brand[] = Array.isArray(data) ? data : [];
        setBrands(list);
        if (list.length === 1) {
          router.replace(`/brands/${list[0].id}/ads`);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">{t("stores.loading")}</p>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{t("adGen.title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("adGen.subtitle")}</p>
      </div>

      {brands.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t("adGen.noStores")}</p>
          <Link href="/brands/new" className="mt-4 inline-block rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
            {t("adGen.connectFirst")}
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/brands/${brand.id}/ads`}
            className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 hover:border-[#C7F56F] hover:shadow-sm transition-all"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#C7F56F]/15 text-lg font-bold text-gray-700 dark:text-gray-200">
              {brand.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{brand.name}</p>
              {brand.url && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{brand.url}</p>}
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("adGen.generate")}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
