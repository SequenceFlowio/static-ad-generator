"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { useBrand } from "@/lib/brand-context";
import ContentGenerator from "@/components/content/ContentGenerator";
import type { BrandDnaData, Product } from "@/types";

interface ContentSession {
  id: string;
  template_name: string;
  platform: string;
  caption: string | null;
  image_url: string | null;
  image_prompt: string | null;
  status: string;
  created_at: string;
}

export default function SocialCreatePage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const { brand, loading: brandCtxLoading } = useBrand();
  const [dna, setDna] = useState<BrandDnaData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdSession, setCreatedSession] = useState<ContentSession | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [sendingToPlanner, setSendingToPlanner] = useState(false);
  const loadedBrandIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!brand || brand.id === loadedBrandIdRef.current) return;
    loadedBrandIdRef.current = brand.id;
    setLoading(true);
    setShowGenerator(false);
    setCreatedSession(null);
    Promise.all([
      fetch(`/api/brands/${brand.id}`),
      fetch(`/api/brands/${brand.id}/products`),
    ]).then(async ([brandRes, prodsRes]) => {
      const [brandData, prodsData] = await Promise.all([brandRes.json(), prodsRes.json()]);
      setDna(brandData?.brand_dna?.data ?? null);
      setProducts(Array.isArray(prodsData) ? prodsData : []);
      setShowGenerator(true);
    }).finally(() => setLoading(false));
  }, [brand?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSendToPlanner(session: ContentSession) {
    if (!brand || !session.image_url) return;
    setSendingToPlanner(true);
    const res = await fetch(`/api/brands/${brand.id}/social/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platforms: [session.platform ?? "instagram"],
        media_type: "image",
        image_urls: [session.image_url],
        caption: session.caption ?? "",
        source: "generated",
      }),
    });
    setSendingToPlanner(false);
    if (res.ok) router.push(`/social/planner`);
  }

  if (brandCtxLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-8 w-48 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse mb-4" />
        <div className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {lang === "nl" ? "Content maken" : "Create content"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {lang === "nl" ? "Selecteer een brand via het menu linksonder." : "Select a brand from the bottom-left menu."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{brand.name}</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lang === "nl" ? "Content maken" : "Create content"}
          </h1>
        </div>
        <Link href="/social/planner"
          className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-[#C7F56F] hover:text-gray-900 dark:hover:text-white">
          {lang === "nl" ? "Naar planner →" : "Go to planner →"}
        </Link>
      </div>

      {loading && <div className="flex justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C7F56F] border-t-transparent" /></div>}

      {createdSession && (
        <div className="mb-6 flex gap-4 rounded-2xl border-2 border-[#C7F56F]/40 bg-white dark:bg-[#111] p-5">
          {createdSession.image_url && (
            <Image src={createdSession.image_url} alt="" width={120} height={120} className="rounded-xl object-cover w-[120px] h-[120px] flex-shrink-0" unoptimized />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{lang === "nl" ? "Content gegenereerd ✓" : "Content generated ✓"}</p>
            {createdSession.caption && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">{createdSession.caption}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={() => handleSendToPlanner(createdSession)} disabled={sendingToPlanner}
                className="rounded-full bg-[#C7F56F] px-4 py-2 text-xs font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] disabled:opacity-50">
                {sendingToPlanner ? "…" : (lang === "nl" ? "Inplannen →" : "Schedule →")}
              </button>
              <button onClick={() => setCreatedSession(null)}
                className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                {lang === "nl" ? "Nieuw" : "New"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerator && dna && !createdSession && (
        <ContentGenerator
          brandId={brand.id}
          brandDna={dna}
          products={products}
          onCreated={(session) => setCreatedSession(session)}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  );
}
