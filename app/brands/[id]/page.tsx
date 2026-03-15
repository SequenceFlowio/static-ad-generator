"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Phase1Research from "@/components/pipeline/Phase1Research";
import Phase2Prompts from "@/components/pipeline/Phase2Prompts";
import Phase3Generate from "@/components/pipeline/Phase3Generate";
import type { Brand, BrandDna, PromptSet } from "@/types";

interface BrandData {
  brand: Brand;
  brand_dna: BrandDna | null;
  prompt_set: PromptSet | null;
}

export default function BrandPipelinePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadBrand() {
    const res = await fetch(`/api/brands/${id}`);
    if (!res.ok) {
      router.push("/");
      return;
    }
    const json: BrandData = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    loadBrand();
  }, [id]);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading…</p>;
  }

  if (!data) return null;

  const { brand, brand_dna, prompt_set } = data;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-700">Brands</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{brand.name}</span>
      </div>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{brand.name}</h1>
          {brand.url && (
            <a
              href={brand.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-xs text-gray-400 hover:underline"
            >
              {brand.url}
            </a>
          )}
        </div>
        {prompt_set && (
          <Link
            href={`/brands/${id}/gallery`}
            className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            View Gallery →
          </Link>
        )}
      </div>

      {/* Pipeline */}
      <div className="space-y-4">
        <Phase1Research
          brandId={id}
          brandUrl={brand.url ?? ""}
          initialDna={brand_dna}
          onComplete={(dna) => setData((d) => d ? { ...d, brand_dna: dna } : d)}
        />

        <Phase2Prompts
          brandId={id}
          hasDna={!!brand_dna}
          initialPromptSet={prompt_set}
          onComplete={(ps) => setData((d) => d ? { ...d, prompt_set: ps } : d)}
        />

        <Phase3Generate
          brandId={id}
          promptSet={prompt_set}
        />
      </div>
    </div>
  );
}
