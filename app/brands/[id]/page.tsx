"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Phase1Research from "@/components/pipeline/Phase1Research";
import type { Brand, BrandDna, Product } from "@/types";

export default function BrandPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [dna, setDna] = useState<BrandDna | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dnaOpen, setDnaOpen] = useState(false);

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
      if (!json.brand_dna) setDnaOpen(true);
    }
    load();
  }, [id, router]);

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;
  if (!brand) return null;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-700">Brands</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{brand.name}</span>
      </div>

      {/* Brand header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{brand.name}</h1>
        {brand.url && (
          <a href={brand.url} target="_blank" rel="noopener noreferrer"
            className="mt-1 text-xs text-gray-400 hover:underline">
            {brand.url}
          </a>
        )}
      </div>

      {/* Brand DNA */}
      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Brand DNA</h2>
          {dna && (
            <button
              onClick={() => setDnaOpen((o) => !o)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {dnaOpen ? "Collapse ▲" : "View / Edit ▼"}
            </button>
          )}
        </div>

        {/* No DNA yet */}
        {!dna && (
          <Phase1Research
            brandId={id}
            brandUrl={brand.url ?? ""}
            initialDna={null}
            onComplete={(newDna) => { setDna(newDna); setDnaOpen(false); }}
          />
        )}

        {/* DNA exists — collapsed summary */}
        {dna && !dnaOpen && (
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="flex gap-1.5">
              {[dna.data.primary_color, dna.data.secondary_color, dna.data.accent_color]
                .filter(Boolean)
                .map((c, i) => (
                  <div key={i} className="h-5 w-5 rounded-full border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: c! }} />
                ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{dna.data.name}</p>
              {dna.data.positioning && (
                <p className="text-xs text-gray-400 truncate">{dna.data.positioning}</p>
              )}
            </div>
            <span className="text-xs text-gray-300 flex-shrink-0">
              {new Date(dna.generated_at).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* DNA exists — expanded */}
        {dna && dnaOpen && (
          <Phase1Research
            brandId={id}
            brandUrl={brand.url ?? ""}
            initialDna={dna}
            onComplete={(newDna) => setDna(newDna)}
          />
        )}
      </section>

      {/* Products */}
      <section>
        <div className="mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Products</h2>
          {!dna && (
            <p className="mt-1 text-xs text-gray-400">Complete Brand DNA first to enable product generation.</p>
          )}
        </div>

        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${!dna ? "opacity-50 pointer-events-none" : ""}`}>
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/brands/${id}/products/${product.id}`}
              className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-[#C7F56F] hover:shadow-sm transition-all"
            >
              <p className="font-semibold text-sm">{product.name}</p>
              {product.description && (
                <p className="mt-1 text-xs text-gray-400 line-clamp-2">{product.description}</p>
              )}
              {product.url && (
                <p className="mt-1 text-xs text-gray-300 truncate">{product.url}</p>
              )}
              <p className="mt-3 text-xs text-[#C7F56F] font-medium">Generate ads →</p>
            </Link>
          ))}

          <Link
            href={`/brands/${id}/products/new`}
            className="rounded-xl border border-dashed border-gray-300 bg-white p-5 hover:border-[#C7F56F] transition-all flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600 min-h-[100px]"
          >
            <span className="text-2xl font-light">+</span>
            <span className="text-sm font-medium">Add Product</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
