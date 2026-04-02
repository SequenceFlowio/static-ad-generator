"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import type { Brand, Product } from "@/types";

export default function ProductsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productsByBrand, setProductsByBrand] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then(async (data: Brand[]) => {
        const list: Brand[] = Array.isArray(data) ? data : [];
        setBrands(list);
        // Load products for all brands in parallel
        const entries = await Promise.all(
          list.map(async (b) => {
            const res = await fetch(`/api/brands/${b.id}/products`);
            const prods = await res.json();
            return [b.id, Array.isArray(prods) ? prods : []] as [string, Product[]];
          })
        );
        setProductsByBrand(Object.fromEntries(entries));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">{t("stores.loading")}</p>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{t("nav.products")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("products.subtitle")}</p>
      </div>

      <div className="space-y-10">
        {brands.map((brand) => {
          const products = productsByBrand[brand.id] ?? [];
          return (
            <div key={brand.id}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{brand.name}</h2>
                <Link href={`/brands/${brand.id}/products/new`}
                  className="text-xs font-medium text-[#C7F56F] hover:underline">
                  + {t("products.add")}
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                  <Link key={p.id} href={`/brands/${brand.id}/products/${p.id}`}
                    className="group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden hover:border-[#C7F56F] hover:shadow-sm transition-all">
                    <div className="aspect-square w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      {p.image_urls?.[0] ? (
                        <Image src={p.image_urls[0]} alt={p.name} width={200} height={200}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-300 dark:text-gray-600">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                      {p.description && (
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{p.description}</p>
                      )}
                    </div>
                  </Link>
                ))}

                <Link href={`/brands/${brand.id}/products/new`}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-4 hover:border-[#C7F56F] hover:text-gray-600 dark:hover:text-gray-300 text-gray-400 dark:text-gray-500 transition-all min-h-[120px]">
                  <span className="text-2xl font-light">+</span>
                  <span className="text-xs font-medium">{t("products.add")}</span>
                </Link>
              </div>
            </div>
          );
        })}

        {brands.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">{t("stores.noStores")}</p>
            <Link href="/brands/new" className="mt-4 inline-block rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]">
              {t("stores.connect")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
