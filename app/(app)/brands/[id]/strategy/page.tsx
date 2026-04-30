"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CreativeStrategyForm from "@/components/CreativeStrategyForm";
import type { Brand, CreativeStrategy } from "@/types";

export default function StrategyPage() {
  const params = useParams();
  const id = params.id as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [strategy, setStrategy] = useState<CreativeStrategy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [brandRes, stratRes] = await Promise.all([
        fetch(`/api/brands/${id}`),
        fetch(`/api/brands/${id}/creative-strategy`),
      ]);

      if (brandRes.ok) {
        const json = await brandRes.json();
        setBrand(json.brand);
      }

      if (stratRes.ok) {
        const json = await stratRes.json();
        setStrategy(json.strategy ?? null);
      }

      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9f7] dark:bg-[#0d0d0d]">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-[#0d0d0d] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-300">Stores</Link>
          <span>/</span>
          <Link href={`/brands/${id}`} className="hover:text-gray-600 dark:hover:text-gray-300">
            {brand?.name ?? "Brand"}
          </Link>
          <span>/</span>
          <span className="text-gray-600 dark:text-gray-300">Creative Strategy</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Creative Strategy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Define the creative angles, content pillars, and hooks the AI draws from when generating ads and content.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111] p-6">
          <CreativeStrategyForm
            brandId={id}
            initialStrategy={strategy}
            onSaved={setStrategy}
          />
        </div>
      </div>
    </div>
  );
}
