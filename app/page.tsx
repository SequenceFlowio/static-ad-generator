"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Brand } from "@/types";

export default function DashboardPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((data) => {
        setBrands(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(e: React.MouseEvent, brand: Brand) {
    e.preventDefault();
    if (!confirm(`Delete "${brand.name}"? This cannot be undone.`)) return;
    setDeletingId(brand.id);
    await fetch(`/api/brands/${brand.id}`, { method: "DELETE" });
    setBrands((prev) => prev.filter((b) => b.id !== brand.id));
    setDeletingId(null);
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="mt-1 text-sm text-gray-500">
            Each brand runs the 3-phase ad pipeline independently.
          </p>
        </div>
        <Link
          href="/brands/new"
          className="rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e] transition-colors"
        >
          + New Brand
        </Link>
      </div>

      {loading && (
        <p className="text-sm text-gray-400">Loading brands…</p>
      )}

      {!loading && brands.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-sm">No brands yet.</p>
          <Link
            href="/brands/new"
            className="mt-4 inline-block rounded-lg bg-[#C7F56F] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#b8e85e]"
          >
            Add your first brand
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <div key={brand.id} className="relative group">
            <Link
              href={`/brands/${brand.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-[#C7F56F] hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{brand.name}</h2>
                  {brand.url && (
                    <p className="mt-1 text-xs text-gray-400 truncate max-w-[180px]">{brand.url}</p>
                  )}
                </div>
                <span className="text-xs text-gray-300 mt-0.5">→</span>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                {new Date(brand.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </Link>
            <button
              onClick={(e) => handleDelete(e, brand)}
              disabled={deletingId === brand.id}
              className="absolute top-3 right-3 flex items-center justify-center h-6 w-6 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
              title="Delete brand"
            >
              {deletingId === brand.id ? "…" : "✕"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
