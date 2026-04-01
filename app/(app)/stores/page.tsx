"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PricingModal from "@/components/PricingModal";
import { useLanguage } from "@/components/LanguageProvider";
import type { Brand } from "@/types";

// Plan limits — free & starter allow max 1 store
const FREE_STORE_LIMIT = 1;

function StoreCard({ brand, deleting, onDelete }: { brand: Brand; deleting: boolean; onDelete: (e: React.MouseEvent, brand: Brand) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Link
        href={`/brands/${brand.id}`}
        className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 hover:border-[#C7F56F] hover:shadow-sm transition-all"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#C7F56F]/15 text-lg font-bold text-gray-700 dark:text-gray-200">
          {brand.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-white">{brand.name}</p>
          {brand.url && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{brand.url}</p>}
        </div>
        <p className="text-xs text-gray-300 dark:text-gray-600 flex-shrink-0">
          {new Date(brand.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </Link>
      {hovered && (
        <button
          onClick={(e) => onDelete(e, brand)}
          disabled={deleting}
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {deleting ? "…" : "✕"}
        </button>
      )}
    </div>
  );
}

export default function StoresPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((data) => { setBrands(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(e: React.MouseEvent, brand: Brand) {
    e.preventDefault();
    if (!confirm(t("stores.deleteConfirm"))) return;
    setDeletingId(brand.id);
    await fetch(`/api/brands/${brand.id}`, { method: "DELETE" });
    setBrands((prev) => prev.filter((b) => b.id !== brand.id));
    setDeletingId(null);
  }

  function handleConnectStore() {
    if (brands.length >= FREE_STORE_LIMIT) {
      setShowPricing(true);
    } else {
      router.push("/brands/new");
    }
  }

  const atLimit = brands.length >= FREE_STORE_LIMIT;

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{t("stores.title")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("stores.subtitle")}</p>
        </div>
        <button
          onClick={handleConnectStore}
          className="flex items-center gap-2 rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t("stores.connect")}
        </button>
      </div>

      {/* Store counter + plan info */}
      {!loading && (
        <div className={`mb-6 flex items-center justify-between rounded-xl px-4 py-3 ${atLimit ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30" : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${atLimit ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" : "bg-[#C7F56F]/20 text-gray-700 dark:text-gray-200"}`}>
              {brands.length}
            </div>
            <div>
              <p className={`text-sm font-medium ${atLimit ? "text-amber-800 dark:text-amber-300" : "text-gray-700 dark:text-gray-200"}`}>
                {brands.length} {t("stores.of")} {FREE_STORE_LIMIT} {FREE_STORE_LIMIT !== 1 ? t("stores.connectedPlural") : t("stores.connected")}
              </p>
              <p className={`text-xs ${atLimit ? "text-amber-600 dark:text-amber-400" : "text-gray-400 dark:text-gray-500"}`}>
                {atLimit ? t("stores.freePlanLimit") : t("stores.freePlan")}
              </p>
            </div>
          </div>
          {atLimit && (
            <button
              onClick={() => setShowPricing(true)}
              className="rounded-lg bg-[#C7F56F] px-4 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors"
            >
              {t("stores.upgradeMore")}
            </button>
          )}
        </div>
      )}

      {loading && <p className="text-sm text-gray-400 dark:text-gray-500">{t("stores.loading")}</p>}

      {!loading && brands.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-200">{t("stores.noStores")}</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{t("stores.noStoresDesc")}</p>
          <button
            onClick={handleConnectStore}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t("stores.connect")}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {brands.map((brand) => (
          <StoreCard
            key={brand.id}
            brand={brand}
            deleting={deletingId === brand.id}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div>
  );
}
